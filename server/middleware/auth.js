import jwt from "jsonwebtoken";
import { getDatabase } from "../database/connection.js";
import { users, userSessions } from "../database/schema.js";
import { eq, and, gt } from "drizzle-orm";
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

// Logger for auth middleware
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: "auth-middleware" },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

/**
 * Authentication middleware that verifies JWT tokens and loads user data
 */
export async function authMiddleware(req, res, next) {
  try {
    // Tiger-style assertion at start
    assertExists(req, "Request object");
    assertExists(res, "Response object");
    assertExists(next, "Next function");

    // Allow public access to certain demo endpoints
    const publicEndpoints = [
      "/jobs",
      "/analytics/dashboard",
      "/search/jobs",
      "/search",
      "/notifications",
      "/files",
      "/applications",
    ];

    // Check both req.path and req.originalUrl for matching
    const isPublicEndpoint = publicEndpoints.some((endpoint) => {
      const pathMatch =
        req.path.startsWith(endpoint) || req.originalUrl.includes(endpoint);
      // Allow all methods for notifications, files, search, and applications; only GET for others
      if (
        endpoint === "/notifications" ||
        endpoint === "/files" ||
        endpoint === "/search" ||
        endpoint === "/applications"
      ) {
        return pathMatch;
      }
      return req.method === "GET" && pathMatch;
    });

    if (isPublicEndpoint) {
      // Attach a demo user for these endpoints
      req.user = {
        id: "demo-user",
        email: "demo@skillmatch.dev",
        role: "applicant",
        isDemo: true,
      };
      logger.info("Public endpoint access granted", {
        path: req.path,
        originalUrl: req.originalUrl,
        ip: req.ip,
      });
      return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Missing or invalid authorization header", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
      });

      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    assert(token && token.length > 0, "Token must exist after extraction");

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "development-secret",
        {
          issuer: "skillmatch-api",
          audience: "skillmatch-app",
        },
      );
    } catch (jwtError) {
      logger.warn("JWT verification failed", {
        error: jwtError.message,
        ip: req.ip,
        path: req.path,
      });

      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Token has expired. Please login again.",
        });
      }

      return res.status(401).json({
        success: false,
        error: "Invalid token.",
      });
    }

    assertExists(decoded.userId, "User ID in JWT payload");

    const db = getDatabase();

    // Check if session exists and is valid
    const session = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, decoded.userId),
          eq(userSessions.token, token),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (session.length === 0) {
      logger.warn("Session not found or expired", {
        userId: decoded.userId,
        ip: req.ip,
        path: req.path,
      });

      return res.status(401).json({
        success: false,
        error: "Session expired or invalid. Please login again.",
      });
    }

    // Load user data
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        avatar: users.avatar,
        company: users.company,
        isDemo: users.isDemo,
        emailVerified: users.emailVerified,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlanType: users.subscriptionPlanType,
        subscriptionExpiresAt: users.subscriptionExpiresAt,
        stripeCustomerId: users.stripeCustomerId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length === 0) {
      logger.warn("User not found for valid session", {
        userId: decoded.userId,
        ip: req.ip,
        path: req.path,
      });

      return res.status(401).json({
        success: false,
        error: "User not found.",
      });
    }

    // Attach user to request object
    req.user = user[0];
    req.session = session[0];

    // Tiger-style assertion at end
    assert(req.user.id === decoded.userId, "User ID must match JWT payload");
    assert(req.user.role, "User role must be set");

    logger.debug("Authentication successful", {
      userId: req.user.id,
      role: req.user.role,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.error("Authentication middleware error", {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      path: req.path,
    });

    res.status(500).json({
      success: false,
      error: "Internal server error during authentication.",
    });
  }
}

/**
 * Role-based authorization middleware
 * @param {string|Array<string>} allowedRoles - Role(s) that can access the route
 */
export function requireRole(allowedRoles) {
  // Tiger-style assertion for parameters
  assertExists(allowedRoles, "Allowed roles");

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  assert(roles.length > 0, "At least one role must be specified");

  return (req, res, next) => {
    try {
      // Tiger-style assertion at start
      assertExists(req.user, "User must be authenticated");
      assertExists(req.user.role, "User role must be set");

      if (!roles.includes(req.user.role)) {
        logger.warn("Insufficient permissions", {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles,
          path: req.path,
        });

        return res.status(403).json({
          success: false,
          error: "Insufficient permissions to access this resource.",
        });
      }

      logger.debug("Role authorization successful", {
        userId: req.user.id,
        role: req.user.role,
        path: req.path,
      });

      next();
    } catch (error) {
      logger.error("Role authorization error", {
        error: error.message,
        userId: req.user?.id,
        path: req.path,
      });

      res.status(500).json({
        success: false,
        error: "Internal server error during authorization.",
      });
    }
  };
}

/**
 * Optional authentication middleware - loads user if token is provided but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  try {
    // Tiger-style assertion at start
    assertExists(req, "Request object");
    assertExists(res, "Response object");
    assertExists(next, "Next function");

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without user
      return next();
    }

    // Token provided, try to authenticate
    try {
      await authMiddleware(req, res, next);
    } catch (error) {
      // Authentication failed, continue without user
      logger.debug("Optional authentication failed, continuing", {
        error: error.message,
        path: req.path,
      });
      next();
    }
  } catch (error) {
    logger.error("Optional auth middleware error", {
      error: error.message,
      path: req.path,
    });
    next(); // Continue without user on error
  }
}

/**
 * Subscription status middleware - checks if user has valid subscription
 * @param {Array<string>} requiredPlans - Plans that grant access
 */
export function requireSubscription(
  requiredPlans = ["basic", "pro", "enterprise"],
) {
  // Tiger-style assertion for parameters
  assertExists(requiredPlans, "Required plans");
  assert(requiredPlans.length > 0, "At least one plan must be specified");

  return (req, res, next) => {
    try {
      // Tiger-style assertion at start
      assertExists(req.user, "User must be authenticated");

      const {
        subscriptionStatus,
        subscriptionPlanType,
        subscriptionExpiresAt,
        isDemo,
      } = req.user;

      // Demo users have full access
      if (isDemo) {
        logger.debug("Demo user granted subscription access", {
          userId: req.user.id,
          path: req.path,
        });
        return next();
      }

      // Check subscription status
      if (subscriptionStatus !== "active" && subscriptionStatus !== "trial") {
        logger.warn("Inactive subscription", {
          userId: req.user.id,
          status: subscriptionStatus,
          path: req.path,
        });

        return res.status(402).json({
          success: false,
          error: "Active subscription required to access this feature.",
          code: "SUBSCRIPTION_REQUIRED",
        });
      }

      // Check if plan is sufficient
      if (!requiredPlans.includes(subscriptionPlanType)) {
        logger.warn("Insufficient subscription plan", {
          userId: req.user.id,
          currentPlan: subscriptionPlanType,
          requiredPlans,
          path: req.path,
        });

        return res.status(402).json({
          success: false,
          error: "Higher subscription plan required for this feature.",
          code: "PLAN_UPGRADE_REQUIRED",
          data: {
            currentPlan: subscriptionPlanType,
            requiredPlans,
          },
        });
      }

      // Check expiration for non-trial subscriptions
      if (
        subscriptionStatus === "active" &&
        subscriptionExpiresAt &&
        new Date() > subscriptionExpiresAt
      ) {
        logger.warn("Expired subscription", {
          userId: req.user.id,
          expiresAt: subscriptionExpiresAt,
          path: req.path,
        });

        return res.status(402).json({
          success: false,
          error: "Subscription has expired. Please renew to continue.",
          code: "SUBSCRIPTION_EXPIRED",
        });
      }

      logger.debug("Subscription authorization successful", {
        userId: req.user.id,
        plan: subscriptionPlanType,
        status: subscriptionStatus,
        path: req.path,
      });

      next();
    } catch (error) {
      logger.error("Subscription middleware error", {
        error: error.message,
        userId: req.user?.id,
        path: req.path,
      });

      res.status(500).json({
        success: false,
        error: "Internal server error during subscription check.",
      });
    }
  };
}

/**
 * Rate limiting middleware for sensitive endpoints
 * @param {number} maxAttempts - Maximum attempts per window
 * @param {number} windowMs - Time window in milliseconds
 */
export function rateLimitAuth(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  // Tiger-style assertion for parameters
  assert(maxAttempts > 0, "Max attempts must be positive");
  assert(windowMs > 0, "Window duration must be positive");

  const attempts = new Map();

  return (req, res, next) => {
    try {
      // Tiger-style assertion at start
      assertExists(req, "Request object");

      const clientId = req.ip || "unknown";
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old attempts
      if (attempts.has(clientId)) {
        const clientAttempts = attempts.get(clientId);
        const validAttempts = clientAttempts.filter(
          (timestamp) => timestamp > windowStart,
        );
        attempts.set(clientId, validAttempts);
      }

      // Check current attempts
      const currentAttempts = attempts.get(clientId) || [];

      if (currentAttempts.length >= maxAttempts) {
        logger.warn("Rate limit exceeded for authentication", {
          ip: req.ip,
          attempts: currentAttempts.length,
          maxAttempts,
          path: req.path,
        });

        return res.status(429).json({
          success: false,
          error: "Too many authentication attempts. Please try again later.",
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Record attempt
      currentAttempts.push(now);
      attempts.set(clientId, currentAttempts);

      next();
    } catch (error) {
      logger.error("Rate limit middleware error", {
        error: error.message,
        ip: req.ip,
        path: req.path,
      });

      // Continue on error to avoid blocking legitimate requests
      next();
    }
  };
}

export { authMiddleware as default };
