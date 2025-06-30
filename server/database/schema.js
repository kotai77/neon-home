import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Helper function to generate UUIDs
const generateId = () => createId();

// Users table
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["recruiter", "applicant", "admin"] }).notNull(),
  avatar: text("avatar"),
  company: text("company"),
  isDemo: integer("is_demo", { mode: "boolean" }).default(false),
  passwordHash: text("password_hash"),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  subscriptionStatus: text("subscription_status", {
    enum: ["active", "inactive", "trial"],
  }).default("trial"),
  subscriptionPlanType: text("subscription_plan_type", {
    enum: ["basic", "pro", "enterprise"],
  }).default("basic"),
  subscriptionExpiresAt: integer("subscription_expires_at", {
    mode: "timestamp",
  }),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// OAuth providers table
export const oauthProviders = sqliteTable("oauth_providers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", {
    enum: ["google", "github", "linkedin"],
  }).notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// User sessions table
export const userSessions = sqliteTable("user_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Jobs table
export const jobs = sqliteTable("jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  recruiterId: text("recruiter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"), // JSON array
  location: text("location"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("USD"),
  type: text("type", {
    enum: ["full-time", "part-time", "contract", "internship"],
  }).notNull(),
  remote: integer("remote", { mode: "boolean" }).default(false),
  skills: text("skills"), // JSON array
  status: text("status", {
    enum: ["draft", "published", "closed"],
  }).default("draft"),
  applicationDeadline: integer("application_deadline", { mode: "timestamp" }),
  viewCount: integer("view_count").default(0),
  applicationCount: integer("application_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Applicant profiles table
export const applicantProfiles = sqliteTable("applicant_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  summary: text("summary"),
  skills: text("skills"), // JSON array
  experience: text("experience"), // JSON array
  education: text("education"), // JSON array
  resumeUrl: text("resume_url"),
  portfolioUrl: text("portfolio_url"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  phone: text("phone"),
  location: text("location"),
  availabilityStatus: text("availability_status", {
    enum: ["available", "not-available", "open-to-offers"],
  }).default("available"),
  salaryExpectationMin: integer("salary_expectation_min"),
  salaryExpectationMax: integer("salary_expectation_max"),
  profileViews: integer("profile_views").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Applications table
export const applications = sqliteTable("applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  applicantId: text("applicant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: [
      "pending",
      "reviewing",
      "interview",
      "offered",
      "rejected",
      "withdrawn",
    ],
  }).default("pending"),
  coverLetter: text("cover_letter"),
  resumeUrl: text("resume_url"),
  aiScore: real("ai_score"), // 0-100 AI matching score
  aiAnalysis: text("ai_analysis"), // AI-generated analysis
  recruiterNotes: text("recruiter_notes"),
  appliedAt: integer("applied_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Application notes table
export const applicationNotes = sqliteTable("application_notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  applicationId: text("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isPrivate: integer("is_private", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Files table
export const files = sqliteTable("files", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  type: text("type", {
    enum: ["resume", "avatar", "document", "image"],
  }).notNull(),
  metadata: text("metadata"), // JSON
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// AI configurations table
export const aiConfigurations = sqliteTable("ai_configurations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(),
  providerName: text("provider_name").notNull(),
  providerType: text("provider_type", {
    enum: ["openai", "anthropic", "azure", "custom"],
  }).notNull(),
  apiKey: text("api_key"), // Encrypted
  baseUrl: text("base_url"),
  model: text("model").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  settings: text("settings"), // JSON
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Scraping jobs table
export const scrapingJobs = sqliteTable("scraping_jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["url", "file", "bulk"] }).notNull(),
  input: text("input").notNull(),
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed"],
  }).default("pending"),
  progress: integer("progress").default(0),
  result: text("result"), // JSON
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Search history table
export const searchHistory = sqliteTable("search_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  filters: text("filters"), // JSON
  resultCount: integer("result_count").default(0),
  searchedAt: integer("searched_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Saved searches table
export const savedSearches = sqliteTable("saved_searches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  query: text("query").notNull(),
  filters: text("filters"), // JSON
  alertEnabled: integer("alert_enabled", { mode: "boolean" }).default(false),
  lastResultCount: integer("last_result_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Notifications table
export const notifications = sqliteTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["application", "interview", "offer", "system", "ai_match"],
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON
  read: integer("read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Analytics events table
export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  eventType: text("event_type").notNull(),
  eventName: text("event_name").notNull(),
  properties: text("properties"), // JSON
  timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Audit logs table
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  oldValues: text("old_values"), // JSON
  newValues: text("new_values"), // JSON
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// System configurations table
export const systemConfigurations = sqliteTable("system_configurations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  type: text("type", {
    enum: ["string", "number", "boolean", "json"],
  }).default("string"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Export all tables for migrations and queries
export const schema = {
  users,
  oauthProviders,
  userSessions,
  jobs,
  applicantProfiles,
  applications,
  applicationNotes,
  files,
  aiConfigurations,
  scrapingJobs,
  searchHistory,
  savedSearches,
  notifications,
  analyticsEvents,
  auditLogs,
  systemConfigurations,
};

// Validation functions with Tiger-style assertions
export function validateUser(user) {
  assert(user, "User object must be provided");
  assert(user.email && user.email.length > 0, "User email must be provided");
  assert(
    user.firstName && user.firstName.length > 0,
    "User first name must be provided",
  );
  assert(
    user.lastName && user.lastName.length > 0,
    "User last name must be provided",
  );
  assert(
    ["recruiter", "applicant", "admin"].includes(user.role),
    "User role must be valid",
  );
  return true;
}

export function validateJob(job) {
  assert(job, "Job object must be provided");
  assert(job.title && job.title.length > 0, "Job title must be provided");
  assert(job.company && job.company.length > 0, "Job company must be provided");
  assert(
    job.description && job.description.length > 0,
    "Job description must be provided",
  );
  assert(
    ["full-time", "part-time", "contract", "internship"].includes(job.type),
    "Job type must be valid",
  );
  return true;
}

export function validateApplication(application) {
  assert(application, "Application object must be provided");
  assert(
    application.jobId && application.jobId.length > 0,
    "Application job ID must be provided",
  );
  assert(
    application.applicantId && application.applicantId.length > 0,
    "Application applicant ID must be provided",
  );
  assert(
    [
      "pending",
      "reviewing",
      "interview",
      "offered",
      "rejected",
      "withdrawn",
    ].includes(application.status),
    "Application status must be valid",
  );
  return true;
}

export default schema;
