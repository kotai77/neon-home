import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  persistenceService,
  BillingData,
  SearchFilters,
  SettingsData,
} from "@/lib/persistence";
import { User } from "@/lib/types";
import { logger } from "@/lib/api";

// Generic persistent state hook
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  userId?: string,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialized = useRef(false);

  // Load data from persistence on mount
  useEffect(() => {
    if (!userId || isInitialized.current) return;

    try {
      let loadedData: T | null = null;

      switch (key) {
        case "billing":
          loadedData = persistenceService.getBillingData(userId) as T;
          break;
        case "searchFilters":
          loadedData = persistenceService.getSearchFilters(userId) as T;
          break;
        case "settings":
          loadedData = persistenceService.getSettings(userId) as T;
          break;
        default:
          // For custom keys, try to load from a generic approach
          break;
      }

      if (loadedData) {
        setState(loadedData);
        logger.info("Persistent state loaded", { key, userId });
      } else {
        logger.info("No persistent state found, using initial value", {
          key,
          userId,
        });
      }
    } catch (error) {
      logger.error("Failed to load persistent state", { key, userId, error });
    } finally {
      setIsLoaded(true);
      isInitialized.current = true;
    }
  }, [key, userId]);

  // Save data to persistence when state changes
  const setPersistentState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prevState) => {
        const newState =
          typeof value === "function" ? (value as Function)(prevState) : value;

        // Save to persistence if we have a userId and data is loaded
        if (userId && isLoaded) {
          try {
            const timestamp = new Date().toISOString();

            switch (key) {
              case "billing":
                persistenceService.saveBillingData({
                  ...newState,
                  userId,
                  updatedAt: timestamp,
                } as BillingData);
                break;
              case "searchFilters":
                persistenceService.saveSearchFilters({
                  ...newState,
                  userId,
                  updatedAt: timestamp,
                } as SearchFilters);
                break;
              case "settings":
                persistenceService.saveSettings({
                  ...newState,
                  userId,
                  updatedAt: timestamp,
                } as SettingsData);
                break;
              default:
                // For custom keys, implement custom save logic
                break;
            }

            logger.info("Persistent state saved", { key, userId });
          } catch (error) {
            logger.error("Failed to save persistent state", {
              key,
              userId,
              error,
            });
          }
        }

        return newState;
      });
    },
    [key, userId, isLoaded],
  );

  return [state, setPersistentState, isLoaded];
}

// Specific hooks for different data types
export function usePersistentBilling(user: User | null) {
  const initialBillingData: BillingData = {
    userId: user?.id || "",
    currentPlan: "professional",
    billingCycle: "monthly",
    subscription: {
      id: "sub_123456",
      status: "active",
      currentPeriodStart: "2024-01-01",
      currentPeriodEnd: "2024-02-01",
      cancelAtPeriodEnd: false,
      plan: "professional",
      amount: 79,
      currency: "USD",
      paymentMethod: "**** **** **** 4242 (Visa)",
    },
    usage: {
      jobs: { used: 12, limit: -1 },
      applications: { used: 234, limit: 500 },
      aiCredits: { used: 650, limit: 1000 },
      teamMembers: { used: 3, limit: 10 },
    },
    // Enhanced billing history with VAT support
    billingHistory: [
      {
        id: "inv_001",
        date: "2024-01-01",
        amount: 79,
        subtotal: 79,
        vatRate: 21,
        vatAmount: 16.59,
        totalAmount: 95.59,
        status: "paid",
        description: "Professional Plan - Monthly",
        downloadUrl: "#",
        billingAddress: {
          country: "NL",
          vatNumber: "NL123456789B01",
          companyName: user?.company || "Individual Account",
        },
      },
      {
        id: "inv_002",
        date: "2023-12-01",
        amount: 79,
        subtotal: 79,
        vatRate: 21,
        vatAmount: 16.59,
        totalAmount: 95.59,
        status: "paid",
        description: "Professional Plan - Monthly",
        downloadUrl: "#",
        billingAddress: {
          country: "NL",
          vatNumber: "NL123456789B01",
          companyName: user?.company || "Individual Account",
        },
      },
      {
        id: "inv_003",
        date: "2023-11-01",
        amount: 79,
        subtotal: 79,
        vatRate: 21,
        vatAmount: 16.59,
        totalAmount: 95.59,
        status: "paid",
        description: "Professional Plan - Monthly",
        downloadUrl: "#",
        billingAddress: {
          country: "NL",
          vatNumber: "NL123456789B01",
          companyName: user?.company || "Individual Account",
        },
      },
      {
        id: "inv_004",
        date: "2023-10-01",
        amount: 29,
        subtotal: 29,
        vatRate: 21,
        vatAmount: 6.09,
        totalAmount: 35.09,
        status: "paid",
        description: "Starter Plan - Monthly",
        downloadUrl: "#",
        billingAddress: {
          country: "NL",
          vatNumber: "NL123456789B01",
          companyName: user?.company || "Individual Account",
        },
      },
    ],
    // VAT settings
    vatSettings: {
      country: "NL",
      vatNumber: "NL123456789B01",
      vatRate: 21,
      vatIncluded: false,
      billingAddress: {
        street: "Keizersgracht 123",
        city: "Amsterdam",
        postalCode: "1015 CJ",
        country: "Netherlands",
        companyName: user?.company || "Individual Account",
      },
    },
    updatedAt: new Date().toISOString(),
  };

  return usePersistentState("billing", initialBillingData, user?.id);
}

export function usePersistentSearchFilters(user: User | null) {
  const initialFilters: SearchFilters = {
    userId: user?.id || "",
    location: "",
    remote: false,
    jobType: "",
    salaryRange: { min: 0, max: 200000 },
    skills: [],
    updatedAt: new Date().toISOString(),
  };

  return usePersistentState("searchFilters", initialFilters, user?.id);
}

export function usePersistentSettings(user: User | null) {
  const initialSettings: SettingsData = {
    userId: user?.id || "",
    notifications: {
      email: true,
      push: true,
      jobMatches: true,
      applicationUpdates: true,
      interviewReminders: true,
      marketingEmails: false,
    },
    privacy: {
      profileVisibility: "public",
      allowDirectMessages: true,
      showActivityStatus: true,
      dataSharing: false,
    },
    general: {
      theme: "system",
      language: "en",
      timezone: "UTC",
      autoSave: true,
    },
    updatedAt: new Date().toISOString(),
  };

  return usePersistentState("settings", initialSettings, user?.id);
}

// Hook for managing job postings
export function usePersistentJobs(user: User | null) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id || user.role !== "recruiter") {
      setIsLoaded(true);
      return;
    }

    try {
      const userJobs = persistenceService.getJobsByRecruiter(user.id);

      // Convert stored job data back to proper format
      const formattedJobs = userJobs.map((job) => ({
        id: job.id,
        recruiterId: job.recruiterId,
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: JSON.parse(job.requirements),
        location: job.location,
        salary: JSON.parse(job.salary || "{}"),
        type: job.type,
        remote: job.remote,
        skills: JSON.parse(job.skills || "[]"),
        status: job.status,
        createdAt: new Date(job.createdAt),
        updatedAt: new Date(job.updatedAt),
      }));

      setJobs(formattedJobs);
      logger.info("Jobs loaded from persistence", {
        userId: user.id,
        count: formattedJobs.length,
      });
    } catch (error) {
      logger.error("Failed to load jobs", { userId: user.id, error });
    } finally {
      setIsLoaded(true);
    }
  }, [user?.id, user?.role]);

  const saveJob = useCallback(
    (job: any) => {
      if (!user?.id) return;

      try {
        const jobData = {
          id: job.id,
          recruiterId: user.id,
          title: job.title,
          company: job.company,
          description: job.description,
          requirements: JSON.stringify(job.requirements || []),
          location: job.location,
          salary: JSON.stringify(job.salary || {}),
          type: job.type,
          remote: job.remote,
          skills: JSON.stringify(job.skills || []),
          status: job.status,
          createdAt: job.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        persistenceService.saveJob(jobData);

        setJobs((prev) => {
          const existing = prev.find((j) => j.id === job.id);
          if (existing) {
            return prev.map((j) => (j.id === job.id ? job : j));
          } else {
            return [job, ...prev];
          }
        });

        logger.info("Job saved to persistence", {
          jobId: job.id,
          userId: user.id,
        });
      } catch (error) {
        logger.error("Failed to save job", {
          jobId: job.id,
          userId: user.id,
          error,
        });
      }
    },
    [user?.id],
  );

  const deleteJob = useCallback(
    (jobId: string) => {
      if (!user?.id) return;

      try {
        // In a real implementation, you'd have a delete method
        // For now, we'll just mark it as deleted locally
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        logger.info("Job deleted from persistence", { jobId, userId: user.id });
      } catch (error) {
        logger.error("Failed to delete job", { jobId, userId: user.id, error });
      }
    },
    [user?.id],
  );

  return { jobs, saveJob, deleteJob, isLoaded };
}

// Hook for managing applications
export function usePersistentApplications(user: User | null) {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setIsLoaded(true);
      return;
    }

    try {
      const userApplications = persistenceService.getApplicationsByUser(
        user.id,
      );

      // Convert stored application data back to proper format
      const formattedApplications = userApplications.map((app) => ({
        id: app.id,
        jobId: app.jobId,
        applicantId: app.applicantId,
        status: app.status,
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
        aiScore: app.aiScore,
        aiAnalysis: app.aiAnalysis,
        appliedAt: new Date(app.appliedAt),
        updatedAt: new Date(app.updatedAt),
      }));

      setApplications(formattedApplications);
      logger.info("Applications loaded from persistence", {
        userId: user.id,
        count: formattedApplications.length,
      });
    } catch (error) {
      logger.error("Failed to load applications", { userId: user.id, error });
    } finally {
      setIsLoaded(true);
    }
  }, [user?.id]);

  const saveApplication = useCallback(
    (application: any) => {
      if (!user?.id) return;

      try {
        const appData = {
          id: application.id,
          jobId: application.jobId,
          applicantId: user.id,
          status: application.status,
          coverLetter: application.coverLetter,
          resumeUrl: application.resumeUrl,
          aiScore: application.aiScore,
          aiAnalysis: application.aiAnalysis,
          appliedAt:
            application.appliedAt?.toISOString() || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        persistenceService.saveApplication(appData);

        setApplications((prev) => {
          const existing = prev.find((a) => a.id === application.id);
          if (existing) {
            return prev.map((a) => (a.id === application.id ? application : a));
          } else {
            return [application, ...prev];
          }
        });

        logger.info("Application saved to persistence", {
          applicationId: application.id,
          userId: user.id,
        });
      } catch (error) {
        logger.error("Failed to save application", {
          applicationId: application.id,
          userId: user.id,
          error,
        });
      }
    },
    [user?.id],
  );

  return { applications, saveApplication, isLoaded };
}

// Note: User cleanup is now handled directly in App.tsx to avoid React hook dependency issues

// Re-export missing hooks from extensions
export {
  usePersistentActivities,
  usePersistentAnalytics,
  usePersistentCandidates,
  usePersistentInterviews,
  usePersistentNotifications,
  usePersistentTags,
} from "./usePersistentStateExtensions";
