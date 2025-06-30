import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { app } from "../setup.js";
import { getDatabase } from "../../database/connection.js";
import { users } from "../../database/schema.js";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

describe("Authentication", () => {
  let db;

  beforeEach(async () => {
    db = getDatabase();
    assert(db, "Database connection must exist");
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "applicant",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      // Tiger-style assertions
      assert(response.body.success, "Registration should be successful");
      assert(response.body.data.user, "User data should be returned");
      assert(response.body.data.token, "JWT token should be returned");
      assert(
        response.body.data.user.email === userData.email,
        "Email should match",
      );
      assert(
        !response.body.data.user.passwordHash,
        "Password hash should not be exposed",
      );

      // Verify user was created in database
      const createdUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);
      assert(createdUser.length === 1, "User should be created in database");
      assert(
        createdUser[0].firstName === userData.firstName,
        "First name should match",
      );
    });

    test("should reject registration with invalid email", async () => {
      const userData = {
        email: "invalid-email",
        firstName: "John",
        lastName: "Doe",
        role: "applicant",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      assert(!response.body.success, "Registration should fail");
      assert(response.body.error, "Error message should be provided");
    });

    test("should reject registration with duplicate email", async () => {
      const userData = {
        email: "duplicate@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "applicant",
        password: "Password123!",
      };

      // First registration
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Second registration with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      assert(!response.body.success, "Duplicate registration should fail");
      assert(
        response.body.error.includes("email"),
        "Error should mention email conflict",
      );
    });

    test("should reject registration with weak password", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "applicant",
        password: "123", // Weak password
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      assert(
        !response.body.success,
        "Registration with weak password should fail",
      );
      assert(
        response.body.error.includes("password"),
        "Error should mention password requirements",
      );
    });

    test("should reject registration with invalid role", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "invalid-role",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      assert(
        !response.body.success,
        "Registration with invalid role should fail",
      );
    });
  });

  describe("POST /api/auth/login", () => {
    let testUser;

    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash("Password123!", 12);
      const insertResult = await db
        .insert(users)
        .values({
          email: "login-test@example.com",
          firstName: "Test",
          lastName: "User",
          role: "applicant",
          passwordHash: hashedPassword,
          emailVerified: true,
        })
        .returning();

      testUser = insertResult[0];
      assert(testUser, "Test user should be created");
    });

    test("should login successfully with valid credentials", async () => {
      const loginData = {
        email: "login-test@example.com",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      assert(response.body.success, "Login should be successful");
      assert(response.body.data.user, "User data should be returned");
      assert(response.body.data.token, "JWT token should be returned");
      assert(
        response.body.data.user.id === testUser.id,
        "User ID should match",
      );
    });

    test("should reject login with invalid password", async () => {
      const loginData = {
        email: "login-test@example.com",
        password: "WrongPassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      assert(!response.body.success, "Login should fail");
      assert(response.body.error, "Error message should be provided");
    });

    test("should reject login with non-existent email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      assert(!response.body.success, "Login should fail");
    });

    test("should create user session on successful login", async () => {
      const loginData = {
        email: "login-test@example.com",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      // Verify JWT token is valid
      const decoded = jwt.verify(
        response.body.data.token,
        process.env.JWT_SECRET || "test-secret",
      );
      assert(
        decoded.userId === testUser.id,
        "JWT should contain correct user ID",
      );
      assert(decoded.exp > Date.now() / 1000, "JWT should not be expired");
    });
  });

  describe("POST /api/auth/logout", () => {
    test("should logout successfully with valid token", async () => {
      // First, login to get a token
      const hashedPassword = await bcrypt.hash("Password123!", 12);
      await db.insert(users).values({
        email: "logout-test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "applicant",
        passwordHash: hashedPassword,
        emailVerified: true,
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "logout-test@example.com",
        password: "Password123!",
      });

      const token = loginResponse.body.data.token;
      assert(token, "Login should provide token");

      // Now logout
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      assert(response.body.success, "Logout should be successful");
    });

    test("should reject logout without token", async () => {
      const response = await request(app).post("/api/auth/logout").expect(401);

      assert(!response.body.success, "Logout without token should fail");
    });
  });

  describe("GET /api/auth/me", () => {
    test("should return current user with valid token", async () => {
      // Create and login user
      const hashedPassword = await bcrypt.hash("Password123!", 12);
      const insertResult = await db
        .insert(users)
        .values({
          email: "me-test@example.com",
          firstName: "Current",
          lastName: "User",
          role: "recruiter",
          passwordHash: hashedPassword,
          emailVerified: true,
        })
        .returning();

      const testUser = insertResult[0];

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "me-test@example.com",
        password: "Password123!",
      });

      const token = loginResponse.body.data.token;

      // Get current user
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      assert(response.body.success, "Should get current user successfully");
      assert(
        response.body.data.user.id === testUser.id,
        "Should return correct user",
      );
      assert(
        response.body.data.user.role === "recruiter",
        "Should return correct user role",
      );
    });

    test("should reject request without valid token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      assert(!response.body.success, "Request without token should fail");
    });
  });

  describe("Password Security", () => {
    test("should hash passwords before storing", async () => {
      const userData = {
        email: "hash-test@example.com",
        firstName: "Hash",
        lastName: "Test",
        role: "applicant",
        password: "TestPassword123!",
      };

      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Check that password is hashed in database
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);
      assert(user.length === 1, "User should exist in database");
      assert(
        user[0].passwordHash !== userData.password,
        "Password should be hashed",
      );
      assert(
        user[0].passwordHash.startsWith("$2b$"),
        "Should use bcrypt hashing",
      );
    });

    test("should verify password correctly during login", async () => {
      const password = "VerifyTest123!";
      const hashedPassword = await bcrypt.hash(password, 12);

      await db.insert(users).values({
        email: "verify-test@example.com",
        firstName: "Verify",
        lastName: "Test",
        role: "applicant",
        passwordHash: hashedPassword,
        emailVerified: true,
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "verify-test@example.com",
          password: password,
        })
        .expect(200);

      assert(
        response.body.success,
        "Login with correct password should succeed",
      );
    });
  });

  describe("Rate Limiting", () => {
    test("should rate limit login attempts", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "WrongPassword",
      };

      // Make multiple failed login attempts
      const promises = Array.from({ length: 10 }, () =>
        request(app).post("/api/auth/login").send(loginData),
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );
      assert(
        rateLimitedResponses.length > 0,
        "Should rate limit excessive login attempts",
      );
    });
  });
});
