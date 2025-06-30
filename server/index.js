import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import winston from "winston";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import route handlers
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
import userRoutes from "./routes/users.js";
import aiRoutes from "./routes/ai.js";
import fileRoutes from "./routes/files.js";
import scrapingRoutes from "./routes/scraping.js";
import searchRoutes from "./routes/search.js";
import analyticsRoutes from "./routes/analytics.js";
import billingRoutes from "./routes/billing.js";
import notificationRoutes from "./routes/notifications.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import { loggingMiddleware } from "./middleware/logging.js";
import { validateRequest } from "./middleware/validation.js";

// Import database
import { initializeDatabase } from "./database/connection.js";
import { runMigrations } from "./database/migrations.js";
import { seedDatabase } from "./database/seeds.js";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertExists(value, name) {
  if (value === null || value === undefined) {
    throw new Error(`Assertion failed: ${name} must exist`);
  }
}

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "skillmatch-api" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

async function createApp() {
  // Tiger-style assertions for critical environment variables
  assert(process.env.NODE_ENV, "NODE_ENV must be defined");

  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Initialize database
  logger.info("Initializing database connection");
  await initializeDatabase();
  await runMigrations();

  // Seed database in development
  if (process.env.NODE_ENV === "development") {
    await seedDatabase();
  }

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  );

  // Trust proxy for rate limiting (only trust first proxy)
  app.set("trust proxy", 1);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);

  // CORS configuration
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5178",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }),
  );

  // Compression and parsing
  app.use(compression());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Logging middleware
  app.use(loggingMiddleware(logger));

  // Health check endpoint
  app.get("/health", (req, res) => {
    assert(res, "Response object must exist");

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV,
    });

    logger.info("Health check completed", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", authMiddleware, jobRoutes);
  app.use("/api/applications", authMiddleware, applicationRoutes);
  app.use("/api/users", authMiddleware, userRoutes);
  app.use("/api/ai", authMiddleware, aiRoutes);
  app.use("/api/files", authMiddleware, fileRoutes);
  app.use("/api/scraping", authMiddleware, scrapingRoutes);
  app.use("/api/search", authMiddleware, searchRoutes);
  app.use("/api/analytics", authMiddleware, analyticsRoutes);
  app.use("/api/billing", authMiddleware, billingRoutes);
  app.use("/api/notifications", authMiddleware, notificationRoutes);

  // WebSocket for real-time updates
  io.use((socket, next) => {
    // Authentication middleware for WebSocket
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    // Verify token and attach user to socket
    next();
  });

  io.on("connection", (socket) => {
    logger.info("Client connected", { socketId: socket.id });

    socket.on("join-room", (roomId) => {
      assertExists(roomId, "Room ID");
      socket.join(roomId);
      logger.info("Client joined room", { socketId: socket.id, roomId });
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected", { socketId: socket.id });
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler(logger));

  // 404 handler
  app.use("*", (req, res) => {
    logger.warn("Route not found", {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(404).json({
      success: false,
      error: "Route not found",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  return { app, httpServer, io, logger };
}

async function startServer() {
  try {
    const { httpServer, logger } = await createApp();

    const PORT = process.env.PORT || 3001;
    assert(PORT > 0 && PORT < 65536, "Port must be valid");

    httpServer.listen(PORT, () => {
      logger.info(`Skillmatch API server started`, {
        port: PORT,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });

      // Assertion to verify server started successfully
      assert(httpServer.listening, "Server must be listening");
    });

    // Graceful shutdown handling
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      httpServer.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      httpServer.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { createApp, startServer };
