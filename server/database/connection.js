import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import winston from "winston";

// Tiger-style assertion utilities
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger for database operations
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: "database" },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

let db = null;
let sqlite = null;

export async function initializeDatabase() {
  try {
    // Tiger-style assertion at start
    assert(process.env.NODE_ENV, "NODE_ENV must be defined");

    logger.info("Initializing database connection");

    // Ensure database directory exists
    const dbDir = join(__dirname, "../../data");
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
      logger.info("Created database directory", { path: dbDir });
    }

    // Database file path
    const dbPath = process.env.DATABASE_URL || join(dbDir, "skillmatch.db");
    assertExists(dbPath, "Database path");

    logger.info("Connecting to SQLite database", { path: dbPath });

    // Initialize SQLite connection
    sqlite = new Database(dbPath);

    // Enable WAL mode for better performance
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("synchronous = NORMAL");
    sqlite.pragma("cache_size = 1000000");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("temp_store = MEMORY");

    // Initialize Drizzle ORM
    db = drizzle(sqlite, {
      logger: process.env.NODE_ENV === "development",
    });

    assertExists(db, "Database connection");

    logger.info("Database connection established successfully");

    // Test the connection
    const result = sqlite.prepare("SELECT 1 as test").get();
    assert(result.test === 1, "Database connection test failed");

    logger.info("Database connection test passed");

    return db;
  } catch (error) {
    logger.error("Failed to initialize database", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export function getDatabase() {
  assertExists(db, "Database must be initialized first");
  return db;
}

export function getSQLite() {
  assertExists(sqlite, "SQLite connection must be initialized first");
  return sqlite;
}

export async function closeDatabase() {
  try {
    if (sqlite) {
      logger.info("Closing database connection");
      sqlite.close();
      sqlite = null;
      db = null;
      logger.info("Database connection closed");
    }
  } catch (error) {
    logger.error("Error closing database", { error: error.message });
    throw error;
  }
}

// Health check for database
export async function checkDatabaseHealth() {
  try {
    assertExists(sqlite, "Database connection");

    const result = sqlite.prepare("SELECT 1 as health").get();
    assert(result.health === 1, "Health check query failed");

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "SQLite",
      path: sqlite.name,
    };
  } catch (error) {
    logger.error("Database health check failed", { error: error.message });
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await closeDatabase();
});

process.on("SIGTERM", async () => {
  await closeDatabase();
});

export { db, sqlite };
