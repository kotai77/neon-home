import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  persistenceService,
  UserProfile,
  BillingData,
  SearchFilters,
  SettingsData,
} from "../persistence";

// Mock localStorage
const mockLocalStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    store,
  };
};

// Replace global localStorage with mock
const originalLocalStorage = global.localStorage;
let mockStorage: ReturnType<typeof mockLocalStorage>;

beforeEach(() => {
  mockStorage = mockLocalStorage();
  global.localStorage = mockStorage as any;
});

afterEach(() => {
  global.localStorage = originalLocalStorage;
});

describe("PersistenceService", () => {
  describe("User Profile Methods", () => {
    const mockUserProfile: UserProfile = {
      userId: "test-user-id",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "applicant",
      company: "Test Company",
      avatar: "https://example.com/avatar.jpg",
      preferences: { theme: "dark", language: "en" },
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should save user profile to localStorage", () => {
      persistenceService.saveUserProfile(mockUserProfile);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "skillmatch_users_test-user-id",
        JSON.stringify(mockUserProfile),
      );
    });

    it("should retrieve user profile from localStorage", () => {
      mockStorage.store.set(
        "skillmatch_users_test-user-id",
        JSON.stringify(mockUserProfile),
      );

      const result = persistenceService.getUserProfile("test-user-id");

      expect(result).toEqual(mockUserProfile);
      expect(mockStorage.getItem).toHaveBeenCalledWith(
        "skillmatch_users_test-user-id",
      );
    });

    it("should return null when user profile does not exist", () => {
      const result = persistenceService.getUserProfile("non-existent-user");

      expect(result).toBeNull();
    });

    it("should handle JSON parse errors gracefully", () => {
      mockStorage.store.set("skillmatch_users_test-user-id", "invalid-json");

      const result = persistenceService.getUserProfile("test-user-id");

      expect(result).toBeNull();
    });
  });

  describe("Billing Data Methods", () => {
    const mockBillingData: BillingData = {
      userId: "test-user-id",
      currentPlan: "professional",
      billingCycle: "monthly",
      subscription: {
        id: "sub_123",
        status: "active",
        amount: 79,
        currency: "USD",
      },
      usage: {
        jobs: { used: 5, limit: 10 },
        applications: { used: 25, limit: 100 },
      },
      billingHistory: [
        {
          id: "inv_001",
          date: "2024-01-01",
          amount: 79,
          status: "paid",
          description: "Professional Plan - Monthly",
        },
      ],
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should save billing data to localStorage", () => {
      persistenceService.saveBillingData(mockBillingData);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "skillmatch_billing_test-user-id",
        JSON.stringify(mockBillingData),
      );
    });

    it("should retrieve billing data from localStorage", () => {
      mockStorage.store.set(
        "skillmatch_billing_test-user-id",
        JSON.stringify(mockBillingData),
      );

      const result = persistenceService.getBillingData("test-user-id");

      expect(result).toEqual(mockBillingData);
    });

    it("should return null when billing data does not exist", () => {
      const result = persistenceService.getBillingData("non-existent-user");

      expect(result).toBeNull();
    });
  });

  describe("Search Filters Methods", () => {
    const mockSearchFilters: SearchFilters = {
      userId: "test-user-id",
      location: "San Francisco, CA",
      remote: true,
      jobType: "full-time",
      salaryRange: { min: 100000, max: 150000 },
      skills: ["React", "TypeScript", "JavaScript"],
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should save search filters to localStorage", () => {
      persistenceService.saveSearchFilters(mockSearchFilters);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "skillmatch_filters_test-user-id",
        JSON.stringify(mockSearchFilters),
      );
    });

    it("should retrieve search filters from localStorage", () => {
      mockStorage.store.set(
        "skillmatch_filters_test-user-id",
        JSON.stringify(mockSearchFilters),
      );

      const result = persistenceService.getSearchFilters("test-user-id");

      expect(result).toEqual(mockSearchFilters);
    });

    it("should return null when search filters do not exist", () => {
      const result = persistenceService.getSearchFilters("non-existent-user");

      expect(result).toBeNull();
    });
  });

  describe("Job Data Methods", () => {
    const mockJobData = {
      id: "job-123",
      recruiterId: "recruiter-456",
      title: "Software Engineer",
      company: "Test Company",
      description: "A great job opportunity",
      requirements: "React, TypeScript",
      location: "San Francisco, CA",
      salary: JSON.stringify({ min: 100000, max: 150000, currency: "USD" }),
      type: "full-time",
      remote: true,
      skills: JSON.stringify(["React", "TypeScript"]),
      status: "published",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should save job data to localStorage", () => {
      persistenceService.saveJob(mockJobData);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "skillmatch_jobs_job-123",
        JSON.stringify(mockJobData),
      );
    });

    it("should retrieve job data from localStorage", () => {
      mockStorage.store.set(
        "skillmatch_jobs_job-123",
        JSON.stringify(mockJobData),
      );

      const result = persistenceService.getJob("job-123");

      expect(result).toEqual(mockJobData);
    });

    it("should maintain recruiter job list when saving jobs", () => {
      persistenceService.saveJob(mockJobData);

      // Check that recruiter jobs list is updated
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "skillmatch_recruiter_jobs_recruiter-456",
        JSON.stringify(["job-123"]),
      );
    });

    it("should retrieve jobs by recruiter", () => {
      // Setup job data
      mockStorage.store.set(
        "skillmatch_jobs_job-123",
        JSON.stringify(mockJobData),
      );
      mockStorage.store.set(
        "skillmatch_recruiter_jobs_recruiter-456",
        JSON.stringify(["job-123"]),
      );

      const result = persistenceService.getJobsByRecruiter("recruiter-456");

      expect(result).toEqual([mockJobData]);
    });

    it("should handle empty recruiter job list", () => {
      const result = persistenceService.getJobsByRecruiter("non-existent");

      expect(result).toEqual([]);
    });
  });

  describe("Settings Methods", () => {
    const mockSettings: SettingsData = {
      userId: "test-user-id",
      notifications: {
        email: true,
        push: false,
        jobMatches: true,
      },
      privacy: {
        profileVisibility: "public",
        allowDirectMessages: true,
      },
      general: {
        theme: "dark",
        language: "en",
        timezone: "UTC",
      },
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should save settings to localStorage", () => {
      persistenceService.saveSettings(mockSettings);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "skillmatch_settings_test-user-id",
        JSON.stringify(mockSettings),
      );
    });

    it("should retrieve settings from localStorage", () => {
      mockStorage.store.set(
        "skillmatch_settings_test-user-id",
        JSON.stringify(mockSettings),
      );

      const result = persistenceService.getSettings("test-user-id");

      expect(result).toEqual(mockSettings);
    });
  });

  describe("Utility Methods", () => {
    beforeEach(() => {
      // Setup some test data
      mockStorage.store.set("skillmatch_users_test-user", "user-data");
      mockStorage.store.set("skillmatch_billing_test-user", "billing-data");
      mockStorage.store.set("skillmatch_settings_test-user", "settings-data");
      mockStorage.store.set("skillmatch_jobs_job-1", "job-data");
      mockStorage.store.set("skillmatch_recruiter_jobs_test-user", '["job-1"]');
    });

    it("should clear all user data", () => {
      persistenceService.clearUserData("test-user");

      // Check that removeItem was called for user-related keys
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        "skillmatch_users_test-user",
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        "skillmatch_billing_test-user",
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        "skillmatch_settings_test-user",
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        "skillmatch_recruiter_jobs_test-user",
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        "skillmatch_jobs_job-1",
      );
    });

    it("should check if user data exists", () => {
      mockStorage.store.set(
        "skillmatch_users_existing-user",
        JSON.stringify({ userId: "existing-user" }),
      );

      const exists = persistenceService.isUserDataExists("existing-user");
      const notExists = persistenceService.isUserDataExists("non-existent");

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it("should handle errors in clearUserData gracefully", () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      // Should not throw
      expect(() => persistenceService.clearUserData("test-user")).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle localStorage errors when saving", () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      // Should throw the error
      expect(() =>
        persistenceService.saveUserProfile({
          userId: "test",
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          role: "applicant",
          preferences: {},
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        }),
      ).toThrow();
    });

    it("should handle localStorage errors when reading", () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error("Storage access denied");
      });

      const result = persistenceService.getUserProfile("test-user");

      expect(result).toBeNull();
    });
  });
});
