import { beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import {
  initializeDatabase,
  closeDatabase,
  getSQLite,
} from "../database/connection.js";
import { runMigrations } from "../database/migrations.js";
import { createApp } from "../index.js";
import fs from "fs";
import path from "path";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Global test setup
let app;
let server;
let testDbPath;

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = "test";
  process.env.LOG_LEVEL = "error"; // Reduce log noise during tests

  // Create test database path
  testDbPath = path.join(__dirname, "../data/test.db");
  process.env.DATABASE_URL = testDbPath;

  // Remove existing test database
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Initialize test database
  await initializeDatabase();
  await runMigrations();

  // Create test app
  const appInstance = await createApp();
  app = appInstance.app;
  server = appInstance.httpServer;

  // Assertions to verify test setup
  assert(app, "Test app must be created");
  assert(server, "Test server must be created");

  console.log("Test environment initialized");
});

afterAll(async () => {
  // Cleanup test environment
  await closeDatabase();

  if (server) {
    server.close();
  }

  // Remove test database
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log("Test environment cleaned up");
});

beforeEach(async () => {
  // Clear all tables before each test
  const sqlite = getSQLite();
  assert(sqlite, "SQLite connection must exist");

  // Get all table names
  const tables = sqlite
    .prepare(
      `
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `,
    )
    .all();

  // Clear each table
  for (const table of tables) {
    sqlite.prepare(`DELETE FROM ${table.name}`).run();
  }

  // Reset auto-increment sequences
  sqlite.prepare("DELETE FROM sqlite_sequence").run();
});

afterEach(() => {
  // Reset any test-specific configurations
  jest.clearAllMocks();
});

export { app, server };
