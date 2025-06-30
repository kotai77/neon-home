import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  usePersistentBilling,
  usePersistentSearchFilters,
  usePersistentSettings,
  usePersistentJobs,
  usePersistentApplications,
} from "../usePersistentState";
import {
  createMockUser,
  createMockRecruiter,
} from "../../__tests__/test-utils";
import * as persistenceModule from "../../lib/persistence";

// Mock the persistence service
vi.mock("../../lib/persistence", () => ({
  persistenceService: {
    getBillingData: vi.fn(),
    saveBillingData: vi.fn(),
    getSearchFilters: vi.fn(),
    saveSearchFilters: vi.fn(),
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    getJobsByRecruiter: vi.fn(),
    saveJob: vi.fn(),
    getApplicationsByUser: vi.fn(),
    saveApplication: vi.fn(),
    clearUserData: vi.fn(),
  },
}));

const mockPersistenceService = persistenceModule.persistenceService as any;

describe("usePersistentBilling", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistenceService.getBillingData.mockReturnValue(null);
  });

  it("should initialize with default billing data when no saved data exists", async () => {
    const { result } = renderHook(() => usePersistentBilling(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded
    });

    const [billingData] = result.current;
    expect(billingData.currentPlan).toBe("professional");
    expect(billingData.billingCycle).toBe("monthly");
    expect(billingData.subscription.status).toBe("active");
  });

  it("should load saved billing data from persistence", async () => {
    const savedData = {
      userId: mockUser.id,
      currentPlan: "enterprise",
      billingCycle: "yearly",
      subscription: { status: "active", amount: 199 },
      usage: { jobs: { used: 5, limit: -1 } },
      billingHistory: [],
      updatedAt: "2024-01-01",
    };

    mockPersistenceService.getBillingData.mockReturnValue(savedData);

    const { result } = renderHook(() => usePersistentBilling(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded
    });

    const [billingData] = result.current;
    expect(billingData.currentPlan).toBe("enterprise");
    expect(billingData.billingCycle).toBe("yearly");
  });

  it("should save billing data when state changes", async () => {
    const { result } = renderHook(() => usePersistentBilling(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded
    });

    act(() => {
      const setBillingData = result.current[1];
      setBillingData((prev) => ({ ...prev, currentPlan: "starter" }));
    });

    expect(mockPersistenceService.saveBillingData).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPlan: "starter",
        userId: mockUser.id,
      }),
    );
  });

  it("should handle null user gracefully", () => {
    const { result } = renderHook(() => usePersistentBilling(null));

    expect(result.current[2]).toBe(true); // isLoaded should be true
    expect(result.current[0].userId).toBe("");
  });
});

describe("usePersistentSearchFilters", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistenceService.getSearchFilters.mockReturnValue(null);
  });

  it("should initialize with default search filters", async () => {
    const { result } = renderHook(() => usePersistentSearchFilters(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded
    });

    const [filters] = result.current;
    expect(filters.location).toBe("");
    expect(filters.remote).toBe(false);
    expect(filters.skills).toEqual([]);
    expect(filters.salaryRange).toEqual({ min: 0, max: 200000 });
  });

  it("should load saved search filters from persistence", async () => {
    const savedFilters = {
      userId: mockUser.id,
      location: "San Francisco",
      remote: true,
      jobType: "full-time",
      salaryRange: { min: 100000, max: 150000 },
      skills: ["React", "TypeScript"],
      updatedAt: "2024-01-01",
    };

    mockPersistenceService.getSearchFilters.mockReturnValue(savedFilters);

    const { result } = renderHook(() => usePersistentSearchFilters(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded
    });

    const [filters] = result.current;
    expect(filters.location).toBe("San Francisco");
    expect(filters.remote).toBe(true);
    expect(filters.skills).toEqual(["React", "TypeScript"]);
  });

  it("should save search filters when state changes", async () => {
    const { result } = renderHook(() => usePersistentSearchFilters(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded
    });

    act(() => {
      const setFilters = result.current[1];
      setFilters((prev) => ({ ...prev, location: "New York" }));
    });

    expect(mockPersistenceService.saveSearchFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        location: "New York",
        userId: mockUser.id,
      }),
    );
  });
});

describe("usePersistentSettings", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistenceService.getSettings.mockReturnValue(null);
  });

  it("should initialize with default settings", async () => {
    const { result } = renderHook(() => usePersistentSettings(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded
    });

    const [settings] = result.current;
    expect(settings.notifications.email).toBe(true);
    expect(settings.privacy.profileVisibility).toBe("public");
    expect(settings.general.theme).toBe("system");
  });

  it("should load saved settings from persistence", async () => {
    const savedSettings = {
      userId: mockUser.id,
      notifications: { email: false, push: true },
      privacy: { profileVisibility: "private" },
      general: { theme: "dark", language: "es" },
      updatedAt: "2024-01-01",
    };

    mockPersistenceService.getSettings.mockReturnValue(savedSettings);

    const { result } = renderHook(() => usePersistentSettings(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded
    });

    const [settings] = result.current;
    expect(settings.notifications.email).toBe(false);
    expect(settings.privacy.profileVisibility).toBe("private");
    expect(settings.general.theme).toBe("dark");
  });

  it("should save settings when state changes", async () => {
    const { result } = renderHook(() => usePersistentSettings(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded
    });

    act(() => {
      const setSettings = result.current[1];
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, email: false },
      }));
    });

    expect(mockPersistenceService.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.objectContaining({ email: false }),
        userId: mockUser.id,
      }),
    );
  });
});

describe("usePersistentJobs", () => {
  const mockRecruiter = createMockRecruiter();
  const mockApplicant = createMockUser({ role: "applicant" });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistenceService.getJobsByRecruiter.mockReturnValue([]);
  });

  it("should load jobs for recruiters", async () => {
    const mockJobs = [
      {
        id: "job-1",
        recruiterId: mockRecruiter.id,
        title: "Software Engineer",
        company: "Test Company",
        description: "A great job",
        requirements: "React, TypeScript",
        location: "SF",
        salary: "{}",
        type: "full-time",
        remote: true,
        skills: '["React"]',
        status: "published",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ];

    mockPersistenceService.getJobsByRecruiter.mockReturnValue(mockJobs);

    const { result } = renderHook(() => usePersistentJobs(mockRecruiter));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.jobs).toHaveLength(1);
    expect(result.current.jobs[0].title).toBe("Software Engineer");
    expect(mockPersistenceService.getJobsByRecruiter).toHaveBeenCalledWith(
      mockRecruiter.id,
    );
  });

  it("should not load jobs for applicants", async () => {
    const { result } = renderHook(() => usePersistentJobs(mockApplicant));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.jobs).toEqual([]);
    expect(mockPersistenceService.getJobsByRecruiter).not.toHaveBeenCalled();
  });

  it("should save jobs when saveJob is called", async () => {
    const { result } = renderHook(() => usePersistentJobs(mockRecruiter));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const newJob = {
      id: "new-job",
      title: "New Position",
      company: "Test Co",
      description: "A new job",
      requirements: ["React"],
      location: "NYC",
      salary: { min: 100000, max: 150000 },
      type: "full-time",
      remote: false,
      skills: ["React"],
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.saveJob(newJob);
    });

    expect(mockPersistenceService.saveJob).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "new-job",
        recruiterId: mockRecruiter.id,
        title: "New Position",
      }),
    );
  });

  it("should update job list when saving a job", async () => {
    const { result } = renderHook(() => usePersistentJobs(mockRecruiter));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const newJob = {
      id: "new-job",
      title: "New Position",
      company: "Test Co",
      description: "A new job",
      requirements: ["React"],
      location: "NYC",
      salary: {},
      type: "full-time",
      remote: false,
      skills: ["React"],
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.saveJob(newJob);
    });

    expect(result.current.jobs).toContainEqual(newJob);
  });

  it("should handle job deletion", async () => {
    const initialJobs = [
      {
        id: "job-1",
        title: "Job 1",
        company: "Company",
        description: "Description",
        requirements: [],
        location: "Location",
        salary: {},
        type: "full-time",
        remote: false,
        skills: [],
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockPersistenceService.getJobsByRecruiter.mockReturnValue([]);

    const { result } = renderHook(() => usePersistentJobs(mockRecruiter));

    // First add a job
    act(() => {
      result.current.saveJob(initialJobs[0]);
    });

    // Then delete it
    act(() => {
      result.current.deleteJob("job-1");
    });

    expect(result.current.jobs).not.toContainEqual(
      expect.objectContaining({ id: "job-1" }),
    );
  });
});

describe("usePersistentApplications", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistenceService.getApplicationsByUser.mockReturnValue([]);
  });

  it("should load applications for user", async () => {
    const mockApplications = [
      {
        id: "app-1",
        jobId: "job-1",
        applicantId: mockUser.id,
        status: "pending",
        coverLetter: "I'm interested",
        appliedAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ];

    mockPersistenceService.getApplicationsByUser.mockReturnValue(
      mockApplications,
    );

    const { result } = renderHook(() => usePersistentApplications(mockUser));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.applications).toHaveLength(1);
    expect(result.current.applications[0].status).toBe("pending");
    expect(mockPersistenceService.getApplicationsByUser).toHaveBeenCalledWith(
      mockUser.id,
    );
  });

  it("should save applications when saveApplication is called", async () => {
    const { result } = renderHook(() => usePersistentApplications(mockUser));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const newApplication = {
      id: "new-app",
      jobId: "job-1",
      status: "pending",
      coverLetter: "I'm very interested",
      appliedAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.saveApplication(newApplication);
    });

    expect(mockPersistenceService.saveApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "new-app",
        applicantId: mockUser.id,
        status: "pending",
      }),
    );
  });

  it("should handle null user gracefully", () => {
    const { result } = renderHook(() => usePersistentApplications(null));

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.applications).toEqual([]);
  });
});

describe("Error Handling", () => {
  const mockUser = createMockUser();

  it("should handle persistence service errors gracefully", async () => {
    mockPersistenceService.getBillingData.mockImplementation(() => {
      throw new Error("Storage error");
    });

    const { result } = renderHook(() => usePersistentBilling(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true); // isLoaded should still be true
    });

    // Should fall back to default data
    expect(result.current[0].currentPlan).toBe("professional");
  });

  it("should handle save errors gracefully", async () => {
    mockPersistenceService.saveBillingData.mockImplementation(() => {
      throw new Error("Save error");
    });

    const { result } = renderHook(() => usePersistentBilling(mockUser));

    await waitFor(() => {
      expect(result.current[2]).toBe(true);
    });

    // Should not throw when save fails
    expect(() => {
      act(() => {
        const setBillingData = result.current[1];
        setBillingData((prev) => ({ ...prev, currentPlan: "starter" }));
      });
    }).not.toThrow();
  });
});
