import { z } from "zod";

// Tiger-style assertion utilities
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function assertExists<T>(
  value: T | null | undefined,
  name: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Assertion failed: ${name} must exist`);
  }
}

// User types
export const UserRole = z.enum(["recruiter", "applicant", "admin"]);
export type UserRole = z.infer<typeof UserRole>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: UserRole,
  avatar: z.string().url().optional(),
  company: z.string().optional(),
  isDemo: z.boolean().default(false),
  subscription: z.object({
    status: z.enum(["active", "inactive", "trial"]),
    planType: z.enum(["basic", "pro", "enterprise"]),
    expiresAt: z.date().optional(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Notification types
export const NotificationTypeSchema = z.enum([
  "job_application",
  "application_status",
  "interview_scheduled",
  "interview_reminder",
  "job_match",
  "profile_view",
  "message",
  "system",
  "billing",
  "team_invite",
  "ai_insight",
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);
export type NotificationPriority = z.infer<typeof NotificationPrioritySchema>;

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  priority: NotificationPrioritySchema,
  title: z.string().min(1),
  message: z.string().min(1),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  read: z.boolean().default(false),
  archived: z.boolean().default(false),
  createdAt: z.date(),
  readAt: z.date().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Job posting types
export const JobPostingSchema = z.object({
  id: z.string().uuid(),
  recruiterId: z.string().uuid(),
  title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(10),
  requirements: z.array(z.string()),
  location: z.string(),
  salary: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
      currency: z.string().default("USD"),
    })
    .optional(),
  type: z.enum(["full-time", "part-time", "contract", "internship"]),
  remote: z.boolean().default(false),
  skills: z.array(z.string()),
  status: z.enum(["draft", "published", "closed"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type JobPosting = z.infer<typeof JobPostingSchema>;

// Application types
export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  applicantId: z.string().uuid(),
  status: z.enum([
    "pending",
    "reviewing",
    "interview",
    "offered",
    "rejected",
    "withdrawn",
  ]),
  coverLetter: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  aiScore: z.number().min(0).max(100).optional(),
  aiAnalysis: z.string().optional(),
  appliedAt: z.date(),
  updatedAt: z.date(),
});

export type Application = z.infer<typeof ApplicationSchema>;

// API response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
