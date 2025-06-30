import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import winston from "winston";
import { z } from "zod";
import { getDatabase } from "../database/connection.js";

const router = express.Router();

// Logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

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

// Configure Passport OAuth strategies only if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          assertExists(profile, "Google profile");

          // Mock user creation for now
          const user = {
            id: profile.id,
            email: profile.emails?.[0]?.value || `${profile.id}@google.com`,
            firstName: profile.name?.givenName || profile.displayName,
            lastName: profile.name?.familyName || "",
            avatar: profile.photos?.[0]?.value,
            role: "applicant",
            isDemo: false,
          };

          logger.info("Google OAuth login", { userId: user.id });
          return done(null, user);
        } catch (error) {
          logger.error("Google OAuth error", { error: error.message });
          return done(error, null);
        }
      },
    ),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/auth/github/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          assertExists(profile, "GitHub profile");

          const user = {
            id: profile.id,
            email:
              profile.emails?.[0]?.value || `${profile.username}@github.local`,
            firstName: profile.displayName?.split(" ")[0] || profile.username,
            lastName: profile.displayName?.split(" ").slice(1).join(" ") || "",
            avatar: profile.photos?.[0]?.value,
            role: "applicant",
            isDemo: false,
          };

          logger.info("GitHub OAuth login", { userId: user.id });
          return done(null, user);
        } catch (error) {
          logger.error("GitHub OAuth error", { error: error.message });
          return done(error, null);
        }
      },
    ),
  );
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["recruiter", "applicant"]),
});

// JWT helper functions
function generateToken(user) {
  assert(user && user.id, "User must have an ID");

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "skillmatch-api",
      audience: "skillmatch-app",
    },
  );
}

// Mock users for development
const mockUsers = [
  {
    id: "demo-recruiter",
    email: "recruiter@demo.skillmatch.dev",
    password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    firstName: "Demo",
    lastName: "Recruiter",
    role: "recruiter",
    isDemo: true,
    avatar: "/avatars/demo-recruiter.jpg",
  },
  {
    id: "demo-applicant",
    email: "applicant@demo.skillmatch.dev",
    password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    firstName: "Demo",
    lastName: "Applicant",
    role: "applicant",
    isDemo: true,
    avatar: "/avatars/demo-applicant.jpg",
  },
];

// POST /api/auth/login - Email/password login
router.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        details: result.error.errors,
      });
    }

    const { email, password } = result.data;

    // Find user in mock data
    const user = mockUsers.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    logger.info("User logged in", { userId: user.id, email });

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    logger.error("Login error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: error.message,
    });
  }
});

// POST /api/auth/register - Email/password registration
router.post("/register", async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        details: result.error.errors,
      });
    }

    const { email, password, firstName, lastName, role } = result.data;

    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isDemo: false,
      avatar: `/avatars/default-${role}.jpg`,
    };

    // Add to mock users
    mockUsers.push(newUser);

    // Generate token
    const token = generateToken(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    logger.info("User registered", { userId: newUser.id, email });

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    logger.error("Registration error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Registration failed",
      message: error.message,
    });
  }
});

// POST /api/auth/logout - Logout
router.post("/logout", (req, res) => {
  try {
    logger.info("User logged out", { userId: req.user?.id });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
});

// POST /api/auth/refresh - Refresh token
router.post("/refresh", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = mockUsers.find((u) => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Generate new token
    const newToken = generateToken(user);

    res.json({
      success: true,
      data: { token: newToken },
    });
  } catch (error) {
    logger.error("Token refresh error", { error: error.message });
    res.status(401).json({
      success: false,
      error: "Token refresh failed",
    });
  }
});

// OAuth routes (only if configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {
      const token = generateToken(req.user);
      res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
    },
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"] }),
  );

  router.get(
    "/github/callback",
    passport.authenticate("github", { session: false }),
    (req, res) => {
      const token = generateToken(req.user);
      res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
    },
  );
}

export default router;
