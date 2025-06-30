import { User, JobPosting, Application, Notification } from "./types";
import { logger } from "./api";

// Storage interfaces for browser-based persistence
export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  company?: string;
  avatar?: string;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BillingData {
  userId: string;
  currentPlan: string;
  billingCycle: string;
  subscription: Record<string, any>;
  usage: Record<string, any>;
  billingHistory: Array<Record<string, any>>;
  updatedAt: string;
}

export interface SearchFilters {
  userId: string;
  location: string;
  remote: boolean;
  jobType: string;
  salaryRange: Record<string, any>;
  skills: string[];
  updatedAt: string;
}

export interface JobData {
  id: string;
  recruiterId: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  location: string;
  salary: string;
  type: string;
  remote: boolean;
  skills: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationData {
  id: string;
  jobId: string;
  applicantId: string;
  status: string;
  coverLetter?: string;
  resumeUrl?: string;
  aiScore?: number;
  aiAnalysis?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface SettingsData {
  userId: string;
  notifications: Record<string, any>;
  privacy: Record<string, any>;
  general: Record<string, any>;
  updatedAt: string;
}

export class PersistenceService {
  private storagePrefix = "skillmatch_";
  private isInitialized = false;

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    try {
      // Initialize storage structure if needed
      if (!localStorage.getItem(`${this.storagePrefix}initialized`)) {
        localStorage.setItem(`${this.storagePrefix}initialized`, "true");
        logger.info("Storage initialized successfully");
      }
      this.isInitialized = true;
    } catch (error) {
      logger.error("Failed to initialize storage", { error });
      throw error;
    }
  }

  private getStorageKey(table: string, id?: string): string {
    return id
      ? `${this.storagePrefix}${table}_${id}`
      : `${this.storagePrefix}${table}`;
  }

  private setItem(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      logger.error("Failed to save to localStorage", { key, error });
      throw error;
    }
  }

  private getItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.error("Failed to read from localStorage", { key, error });
      return null;
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error("Failed to remove from localStorage", { key, error });
    }
  }

  // User Profile Methods
  saveUserProfile(profile: UserProfile): void {
    const key = this.getStorageKey("users", profile.userId);
    this.setItem(key, profile);
    logger.info("User profile saved", { userId: profile.userId });
  }

  getUserProfile(userId: string): UserProfile | null {
    const key = this.getStorageKey("users", userId);
    return this.getItem(key);
  }

  // Billing Data Methods
  saveBillingData(billingData: BillingData): void {
    const key = this.getStorageKey("billing", billingData.userId);
    this.setItem(key, billingData);
    logger.info("Billing data saved", { userId: billingData.userId });
  }

  getBillingData(userId: string): BillingData | null {
    const key = this.getStorageKey("billing", userId);
    return this.getItem(key);
  }

  // Search Filters Methods
  saveSearchFilters(filters: SearchFilters): void {
    const key = this.getStorageKey("filters", filters.userId);
    this.setItem(key, filters);
    logger.info("Search filters saved", { userId: filters.userId });
  }

  getSearchFilters(userId: string): SearchFilters | null {
    const key = this.getStorageKey("filters", userId);
    return this.getItem(key);
  }

  // Job Data Methods
  saveJob(job: JobData): void {
    const key = this.getStorageKey("jobs", job.id);
    this.setItem(key, job);

    // Also maintain a list of jobs by recruiter
    const recruiterJobsKey = this.getStorageKey(
      "recruiter_jobs",
      job.recruiterId,
    );
    const existingJobs = this.getItem(recruiterJobsKey) || [];
    const jobIndex = existingJobs.findIndex((j: any) => j.id === job.id);

    if (jobIndex >= 0) {
      existingJobs[jobIndex] = job.id;
    } else {
      existingJobs.push(job.id);
    }

    this.setItem(recruiterJobsKey, existingJobs);
    logger.info("Job saved", { jobId: job.id, recruiterId: job.recruiterId });
  }

  getJob(jobId: string): JobData | null {
    const key = this.getStorageKey("jobs", jobId);
    return this.getItem(key);
  }

  getJobsByRecruiter(recruiterId: string): JobData[] {
    const recruiterJobsKey = this.getStorageKey("recruiter_jobs", recruiterId);
    const jobIds = this.getItem(recruiterJobsKey) || [];

    const jobs = jobIds
      .map((jobId: string) => this.getJob(jobId))
      .filter((job: JobData | null) => job !== null)
      .sort(
        (a: JobData, b: JobData) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return jobs;
  }

  // Application Data Methods
  saveApplication(application: ApplicationData): void {
    const key = this.getStorageKey("applications", application.id);
    this.setItem(key, application);

    // Also maintain a list of applications by user
    const userAppsKey = this.getStorageKey(
      "user_applications",
      application.applicantId,
    );
    const existingApps = this.getItem(userAppsKey) || [];
    const appIndex = existingApps.findIndex(
      (a: any) => a.id === application.id,
    );

    if (appIndex >= 0) {
      existingApps[appIndex] = application.id;
    } else {
      existingApps.push(application.id);
    }

    this.setItem(userAppsKey, existingApps);
    logger.info("Application saved", { applicationId: application.id });
  }

  getApplication(applicationId: string): ApplicationData | null {
    const key = this.getStorageKey("applications", applicationId);
    return this.getItem(key);
  }

  getApplicationsByUser(userId: string): ApplicationData[] {
    const userAppsKey = this.getStorageKey("user_applications", userId);
    const appIds = this.getItem(userAppsKey) || [];

    const applications = appIds
      .map((appId: string) => this.getApplication(appId))
      .filter((app: ApplicationData | null) => app !== null)
      .sort(
        (a: ApplicationData, b: ApplicationData) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      );

    return applications;
  }

  // Settings Methods
  saveSettings(settings: SettingsData): void {
    const key = this.getStorageKey("settings", settings.userId);
    this.setItem(key, settings);
    logger.info("Settings saved", { userId: settings.userId });
  }

  getSettings(userId: string): SettingsData | null {
    const key = this.getStorageKey("settings", userId);
    return this.getItem(key);
  }

  // Utility Methods
  clearUserData(userId: string): void {
    try {
      // Get all keys that belong to this user
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix) && key.includes(userId)) {
          keysToRemove.push(key);
        }
      }

      // Remove all user-related keys
      keysToRemove.forEach((key) => this.removeItem(key));

      // Also remove job-specific data for recruiters
      const recruiterJobsKey = this.getStorageKey("recruiter_jobs", userId);
      const jobIds = this.getItem(recruiterJobsKey) || [];

      jobIds.forEach((jobId: string) => {
        const jobKey = this.getStorageKey("jobs", jobId);
        this.removeItem(jobKey);
      });

      this.removeItem(recruiterJobsKey);

      logger.info("User data cleared", { userId });
    } catch (error) {
      logger.error("Failed to clear user data", { userId, error });
    }
  }

  isUserDataExists(userId: string): boolean {
    const key = this.getStorageKey("users", userId);
    return this.getItem(key) !== null;
  }

  // Close/cleanup method (no-op for localStorage but kept for interface compatibility)
  close(): void {
    logger.info("Storage cleanup completed");
  }
}

// Singleton instance
export const persistenceService = new PersistenceService();

// Helper functions for data conversion
export const convertUserToPersistence = (user: User): UserProfile => ({
  userId: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  company: user.company,
  avatar: user.avatar,
  preferences: {},
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

export const convertJobToPersistence = (job: JobPosting): JobData => ({
  id: job.id,
  recruiterId: job.recruiterId,
  title: job.title,
  company: job.company,
  description: job.description,
  requirements: JSON.stringify(job.requirements),
  location: job.location,
  salary: JSON.stringify(job.salary),
  type: job.type,
  remote: job.remote,
  skills: JSON.stringify(job.skills),
  status: job.status,
  createdAt: job.createdAt.toISOString(),
  updatedAt: job.updatedAt.toISOString(),
});

export const convertApplicationToPersistence = (
  app: Application,
): ApplicationData => ({
  id: app.id,
  jobId: app.jobId,
  applicantId: app.applicantId,
  status: app.status,
  coverLetter: app.coverLetter,
  resumeUrl: app.resumeUrl,
  aiScore: app.aiScore,
  aiAnalysis: app.aiAnalysis,
  appliedAt: app.appliedAt.toISOString(),
  updatedAt: app.updatedAt.toISOString(),
});
