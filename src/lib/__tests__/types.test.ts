import { describe, it, expect } from "vitest";
import {
  assert,
  assertExists,
  UserSchema,
  NotificationSchema,
  JobPostingSchema,
  ApplicationSchema,
  ApiResponseSchema,
} from "../types";

describe("assert function", () => {
  it("should not throw when condition is true", () => {
    expect(() => assert(true, "Should not throw")).not.toThrow();
  });

  it("should throw when condition is false", () => {
    expect(() => assert(false, "Should throw")).toThrow(
      "Assertion failed: Should throw",
    );
  });

  it("should throw with custom message", () => {
    const message = "Custom error message";
    expect(() => assert(false, message)).toThrow(
      `Assertion failed: ${message}`,
    );
  });
});

describe("assertExists function", () => {
  it("should not throw when value exists", () => {
    expect(() => assertExists("value", "testValue")).not.toThrow();
    expect(() => assertExists(0, "testValue")).not.toThrow();
    expect(() => assertExists(false, "testValue")).not.toThrow();
    expect(() => assertExists([], "testValue")).not.toThrow();
  });

  it("should throw when value is null", () => {
    expect(() => assertExists(null, "testValue")).toThrow(
      "Assertion failed: testValue must exist",
    );
  });

  it("should throw when value is undefined", () => {
    expect(() => assertExists(undefined, "testValue")).toThrow(
      "Assertion failed: testValue must exist",
    );
  });
});

describe("UserSchema validation", () => {
  const validUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "applicant",
    company: "Test Company",
    subscription: {
      status: "active",
      planType: "pro",
      expiresAt: new Date("2024-12-31"),
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  it("should validate a correct user object", () => {
    expect(() => UserSchema.parse(validUser)).not.toThrow();
  });

  it("should reject invalid email", () => {
    const invalidUser = { ...validUser, email: "invalid-email" };
    expect(() => UserSchema.parse(invalidUser)).toThrow();
  });

  it("should reject invalid UUID", () => {
    const invalidUser = { ...validUser, id: "invalid-uuid" };
    expect(() => UserSchema.parse(invalidUser)).toThrow();
  });

  it("should reject invalid role", () => {
    const invalidUser = { ...validUser, role: "invalid-role" };
    expect(() => UserSchema.parse(invalidUser)).toThrow();
  });

  it("should require firstName and lastName", () => {
    const invalidUser = { ...validUser, firstName: "" };
    expect(() => UserSchema.parse(invalidUser)).toThrow();

    const invalidUser2 = { ...validUser, lastName: "" };
    expect(() => UserSchema.parse(invalidUser2)).toThrow();
  });
});

describe("NotificationSchema validation", () => {
  const validNotification = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    userId: "550e8400-e29b-41d4-a716-446655440001",
    type: "job_application",
    priority: "medium",
    title: "New Application",
    message: "You have a new application",
    read: false,
    archived: false,
    createdAt: new Date("2024-01-01"),
  };

  it("should validate a correct notification object", () => {
    expect(() => NotificationSchema.parse(validNotification)).not.toThrow();
  });

  it("should reject invalid notification type", () => {
    const invalidNotification = { ...validNotification, type: "invalid-type" };
    expect(() => NotificationSchema.parse(invalidNotification)).toThrow();
  });

  it("should reject invalid priority", () => {
    const invalidNotification = {
      ...validNotification,
      priority: "invalid-priority",
    };
    expect(() => NotificationSchema.parse(invalidNotification)).toThrow();
  });

  it("should require title and message", () => {
    const invalidNotification = { ...validNotification, title: "" };
    expect(() => NotificationSchema.parse(invalidNotification)).toThrow();

    const invalidNotification2 = { ...validNotification, message: "" };
    expect(() => NotificationSchema.parse(invalidNotification2)).toThrow();
  });
});

describe("JobPostingSchema validation", () => {
  const validJob = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    recruiterId: "550e8400-e29b-41d4-a716-446655440001",
    title: "Software Engineer",
    company: "Test Company",
    description: "A great job opportunity",
    requirements: ["React", "TypeScript"],
    location: "San Francisco, CA",
    type: "full-time",
    remote: true,
    skills: ["React", "JavaScript"],
    status: "published",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  it("should validate a correct job posting", () => {
    expect(() => JobPostingSchema.parse(validJob)).not.toThrow();
  });

  it("should reject invalid job type", () => {
    const invalidJob = { ...validJob, type: "invalid-type" };
    expect(() => JobPostingSchema.parse(invalidJob)).toThrow();
  });

  it("should reject invalid status", () => {
    const invalidJob = { ...validJob, status: "invalid-status" };
    expect(() => JobPostingSchema.parse(invalidJob)).toThrow();
  });

  it("should require minimum description length", () => {
    const invalidJob = { ...validJob, description: "short" };
    expect(() => JobPostingSchema.parse(invalidJob)).toThrow();
  });

  it("should validate salary object when provided", () => {
    const jobWithSalary = {
      ...validJob,
      salary: { min: 100000, max: 150000, currency: "USD" },
    };
    expect(() => JobPostingSchema.parse(jobWithSalary)).not.toThrow();

    const jobWithInvalidSalary = {
      ...validJob,
      salary: { min: -1000, max: 150000, currency: "USD" },
    };
    expect(() => JobPostingSchema.parse(jobWithInvalidSalary)).toThrow();
  });
});

describe("ApplicationSchema validation", () => {
  const validApplication = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    jobId: "550e8400-e29b-41d4-a716-446655440001",
    applicantId: "550e8400-e29b-41d4-a716-446655440002",
    status: "pending",
    appliedAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  it("should validate a correct application", () => {
    expect(() => ApplicationSchema.parse(validApplication)).not.toThrow();
  });

  it("should reject invalid status", () => {
    const invalidApplication = {
      ...validApplication,
      status: "invalid-status",
    };
    expect(() => ApplicationSchema.parse(invalidApplication)).toThrow();
  });

  it("should validate optional fields", () => {
    const applicationWithOptionals = {
      ...validApplication,
      coverLetter: "I am interested in this position",
      resumeUrl: "https://example.com/resume.pdf",
      aiScore: 85,
      aiAnalysis: "Strong candidate",
    };
    expect(() =>
      ApplicationSchema.parse(applicationWithOptionals),
    ).not.toThrow();
  });

  it("should reject invalid AI score range", () => {
    const invalidApplication = { ...validApplication, aiScore: 150 };
    expect(() => ApplicationSchema.parse(invalidApplication)).toThrow();

    const invalidApplication2 = { ...validApplication, aiScore: -10 };
    expect(() => ApplicationSchema.parse(invalidApplication2)).toThrow();
  });
});

describe("ApiResponseSchema validation", () => {
  it("should validate successful response", () => {
    const response = {
      success: true,
      data: { test: "data" },
    };
    expect(() => ApiResponseSchema.parse(response)).not.toThrow();
  });

  it("should validate error response", () => {
    const response = {
      success: false,
      error: "Something went wrong",
    };
    expect(() => ApiResponseSchema.parse(response)).not.toThrow();
  });

  it("should validate response with pagination", () => {
    const response = {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      },
    };
    expect(() => ApiResponseSchema.parse(response)).not.toThrow();
  });

  it("should require success field", () => {
    const response = { data: "test" };
    expect(() => ApiResponseSchema.parse(response)).toThrow();
  });
});
