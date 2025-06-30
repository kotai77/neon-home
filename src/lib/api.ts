import {
  User,
  JobPosting,
  Application,
  ApiResponse,
  assert,
  assertExists,
  SearchFilters,
} from "./types";

// API Service interfaces for dependency injection and testing
export interface ApiService {
  // Authentication
  login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }>;
  register(userData: Partial<User>): Promise<{ user: User; token: string }>;
  logout(): Promise<void>;
  refreshToken(): Promise<string>;

  // Job Management
  getJobs(filters?: SearchFilters): Promise<ApiResponse<JobPosting[]>>;
  getJob(id: string): Promise<ApiResponse<JobPosting>>;
  createJob(job: Partial<JobPosting>): Promise<ApiResponse<JobPosting>>;
  updateJob(
    id: string,
    job: Partial<JobPosting>,
  ): Promise<ApiResponse<JobPosting>>;
  deleteJob(id: string): Promise<ApiResponse<void>>;

  // Application Management
  getApplications(jobId?: string): Promise<ApiResponse<Application[]>>;
  getApplication(id: string): Promise<ApiResponse<Application>>;
  createApplication(
    application: Partial<Application>,
  ): Promise<ApiResponse<Application>>;
  updateApplication(
    id: string,
    application: Partial<Application>,
  ): Promise<ApiResponse<Application>>;

  // AI Services
  analyzeResume(fileUrl: string): Promise<ApiResponse<any>>;
  matchCandidates(jobId: string): Promise<ApiResponse<any[]>>;
  scoreApplication(applicationId: string): Promise<ApiResponse<number>>;

  // File Upload
  uploadFile(file: File, type: string): Promise<ApiResponse<{ url: string }>>;
  deleteFile(url: string): Promise<ApiResponse<void>>;

  // Web Scraping
  scrapeProfile(url: string): Promise<ApiResponse<any>>;
  extractFromDocument(fileUrl: string): Promise<ApiResponse<any>>;

  // Search
  searchCandidates(
    query: string,
    filters?: SearchFilters,
  ): Promise<ApiResponse<any[]>>;
  searchJobs(
    query: string,
    filters?: SearchFilters,
  ): Promise<ApiResponse<JobPosting[]>>;

  // Analytics
  getDashboardStats(): Promise<ApiResponse<any>>;
  getRecruitmentMetrics(): Promise<ApiResponse<any>>;

  // Payments
  createSubscription(planType: string): Promise<ApiResponse<any>>;
  updatePaymentMethod(paymentMethodId: string): Promise<ApiResponse<any>>;
  getBillingHistory(): Promise<ApiResponse<any[]>>;
}

// HTTP client for API communication
export class HttpApiService implements ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = "/api") {
    assert(baseUrl.length > 0, "Base URL must be provided");
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem("auth-token");
  }

  private isDemoMode(): boolean {
    // Check if we're in demo mode by looking for demo user data
    const userData = localStorage.getItem("user-data");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.isDemo === true;
      } catch {
        return false;
      }
    }
    return false;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 2,
  ): Promise<ApiResponse<T>> {
    assert(endpoint.length > 0, "Endpoint must be provided");

    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 5000); // 5 second timeout

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if response is HTML instead of JSON
        const contentType = response.headers.get("content-type");
        if (contentType && !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        assert(typeof data === "object", "Response must be an object");
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        // Handle AbortError specifically
        if (error.name === "AbortError") {
          lastError = new Error("Request timeout - server may be unavailable");
          break; // Don't retry timeouts
        }

        // Don't retry on certain errors
        if (
          error.message.includes("non-JSON response") ||
          error.message.includes("Unexpected token") ||
          error.message.includes("TypeError: Failed to fetch")
        ) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000),
          );
        }
      }
    }

    console.error(
      `API request failed after ${retries + 1} attempts: ${endpoint}`,
      lastError,
    );
    return {
      success: false,
      error: lastError?.message || "Unknown error",
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    assert(email.length > 0, "Email must be provided");
    assert(password.length > 0, "Password must be provided");

    const response = await this.request<{ user: User; token: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Login failed");
    }

    this.token = response.data.token;
    localStorage.setItem("auth-token", this.token);

    assertExists(response.data.user, "User data");
    assertExists(response.data.token, "Token");

    return response.data;
  }

  async register(
    userData: Partial<User>,
  ): Promise<{ user: User; token: string }> {
    assertExists(userData.email, "Email");
    assertExists(userData.firstName, "First name");
    assertExists(userData.lastName, "Last name");
    assertExists(userData.role, "Role");

    const response = await this.request<{ user: User; token: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      },
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Registration failed");
    }

    this.token = response.data.token;
    localStorage.setItem("auth-token", this.token);

    assertExists(response.data.user, "User data");
    assertExists(response.data.token, "Token");

    return response.data;
  }

  async logout(): Promise<void> {
    await this.request("/auth/logout", { method: "POST" });
    this.token = null;
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-data");
  }

  async refreshToken(): Promise<string> {
    const response = await this.request<{ token: string }>("/auth/refresh", {
      method: "POST",
    });

    if (!response.success || !response.data) {
      throw new Error("Token refresh failed");
    }

    this.token = response.data.token;
    localStorage.setItem("auth-token", this.token);

    assert(response.data.token.length > 0, "New token must be valid");
    return response.data.token;
  }

  async getJobs(filters?: SearchFilters): Promise<ApiResponse<JobPosting[]>> {
    const params = new URLSearchParams();
    if (filters?.query) params.set("q", filters.query);
    if (filters?.location) params.set("location", filters.location);
    if (filters?.remote !== undefined)
      params.set("remote", filters.remote.toString());

    const queryString = params.toString();
    const endpoint = `/jobs${queryString ? `?${queryString}` : ""}`;

    return this.request<JobPosting[]>(endpoint);
  }

  async getJob(id: string): Promise<ApiResponse<JobPosting>> {
    assert(id.length > 0, "Job ID must be provided");
    return this.request<JobPosting>(`/jobs/${id}`);
  }

  async createJob(job: Partial<JobPosting>): Promise<ApiResponse<JobPosting>> {
    assertExists(job.title, "Job title");
    assertExists(job.company, "Company name");
    assertExists(job.description, "Job description");

    // In demo mode, return mock success response
    if (this.isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay
      const createdJob: JobPosting = {
        id: job.id || `job-${Date.now()}`,
        recruiterId: job.recruiterId || "demo-recruiter-1",
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: job.requirements || [],
        skills: job.skills || [],
        location: job.location || "",
        salary: job.salary || { min: 0, max: 0, currency: "USD" },
        type: job.type || "full-time",
        remote: job.remote || false,
        status: job.status || "published",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...job, // Include any additional fields
      };

      return {
        success: true,
        data: createdJob,
      };
    }

    return this.request<JobPosting>("/jobs", {
      method: "POST",
      body: JSON.stringify(job),
    });
  }

  async updateJob(
    id: string,
    job: Partial<JobPosting>,
  ): Promise<ApiResponse<JobPosting>> {
    assert(id.length > 0, "Job ID must be provided");

    return this.request<JobPosting>(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(job),
    });
  }

  async deleteJob(id: string): Promise<ApiResponse<void>> {
    assert(id.length > 0, "Job ID must be provided");

    return this.request<void>(`/jobs/${id}`, {
      method: "DELETE",
    });
  }

  async getApplications(jobId?: string): Promise<ApiResponse<Application[]>> {
    // In demo mode, return empty array to let components use mock data
    if (this.isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
      return {
        success: true,
        data: [], // Return empty to trigger mock data fallback in components
      };
    }

    const endpoint = jobId ? `/jobs/${jobId}/applications` : "/applications";
    return this.request<Application[]>(endpoint);
  }

  async getApplication(id: string): Promise<ApiResponse<Application>> {
    assert(id.length > 0, "Application ID must be provided");
    return this.request<Application>(`/applications/${id}`);
  }

  async createApplication(
    application: Partial<Application>,
  ): Promise<ApiResponse<Application>> {
    assertExists(application.jobId, "Job ID");
    assertExists(application.applicantId, "Applicant ID");

    return this.request<Application>("/applications", {
      method: "POST",
      body: JSON.stringify(application),
    });
  }

  async updateApplication(
    id: string,
    application: Partial<Application>,
  ): Promise<ApiResponse<Application>> {
    assert(id.length > 0, "Application ID must be provided");

    // In demo mode, return mock success response
    if (this.isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
      return {
        success: true,
        data: {
          id,
          ...application,
          updatedAt: new Date(),
        } as Application,
      };
    }

    return this.request<Application>(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(application),
    });
  }

  async analyzeResume(fileUrl: string): Promise<ApiResponse<any>> {
    assert(fileUrl.length > 0, "File URL must be provided");

    return this.request("/ai/analyze-resume", {
      method: "POST",
      body: JSON.stringify({ fileUrl }),
    });
  }

  async matchCandidates(jobId: string): Promise<ApiResponse<any[]>> {
    assert(jobId.length > 0, "Job ID must be provided");

    return this.request(`/ai/match-candidates/${jobId}`);
  }

  async scoreApplication(applicationId: string): Promise<ApiResponse<number>> {
    assert(applicationId.length > 0, "Application ID must be provided");

    // In demo mode, return mock AI score
    if (this.isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate AI processing delay
      const mockScore = Math.floor(Math.random() * 30) + 70; // Random score between 70-99
      return {
        success: true,
        data: mockScore,
      };
    }

    return this.request(`/ai/score-application/${applicationId}`);
  }

  async uploadFile(
    file: File,
    type: string,
  ): Promise<ApiResponse<{ url: string }>> {
    assertExists(file, "File");
    assert(type.length > 0, "File type must be provided");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    // For file uploads, we need to use a separate request method that doesn't set Content-Type
    const url = `${this.baseUrl}/files/upload`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      assert(typeof data === "object", "Response must be an object");
      return data;
    } catch (error) {
      console.error(`API request failed: /files/upload`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteFile(url: string): Promise<ApiResponse<void>> {
    assert(url.length > 0, "File URL must be provided");

    return this.request("/files", {
      method: "DELETE",
      body: JSON.stringify({ url }),
    });
  }

  async scrapeProfile(url: string): Promise<ApiResponse<any>> {
    assert(url.length > 0, "URL must be provided");

    return this.request("/scraper/profile", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  }

  async extractFromDocument(fileUrl: string): Promise<ApiResponse<any>> {
    assert(fileUrl.length > 0, "File URL must be provided");

    return this.request("/scraper/document", {
      method: "POST",
      body: JSON.stringify({ fileUrl }),
    });
  }

  async searchCandidates(
    query: string,
    filters?: SearchFilters,
  ): Promise<ApiResponse<any[]>> {
    assert(query.length > 0, "Search query must be provided");

    // Use fewer retries for search since we have fallback data
    return this.request(
      "/search/candidates",
      {
        method: "POST",
        body: JSON.stringify({ query, filters }),
      },
      0,
    ); // No retries for search
  }

  async searchJobs(
    query: string,
    filters?: SearchFilters,
  ): Promise<ApiResponse<JobPosting[]>> {
    assert(query.length > 0, "Search query must be provided");

    // Use fewer retries for search since we have fallback data
    return this.request(
      "/search/jobs",
      {
        method: "POST",
        body: JSON.stringify({ query, filters }),
      },
      0,
    ); // No retries for search
  }

  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request("/analytics/dashboard");
  }

  async getRecruitmentMetrics(): Promise<ApiResponse<any>> {
    return this.request("/analytics/recruitment");
  }

  async createSubscription(planType: string): Promise<ApiResponse<any>> {
    assert(planType.length > 0, "Plan type must be provided");

    return this.request("/billing/subscription", {
      method: "POST",
      body: JSON.stringify({ planType }),
    });
  }

  async updatePaymentMethod(
    paymentMethodId: string,
  ): Promise<ApiResponse<any>> {
    assert(paymentMethodId.length > 0, "Payment method ID must be provided");

    return this.request("/billing/payment-method", {
      method: "PUT",
      body: JSON.stringify({ paymentMethodId }),
    });
  }

  async getBillingHistory(): Promise<ApiResponse<any[]>> {
    return this.request("/billing/history");
  }
}

// Create singleton instance
export const apiService = new HttpApiService();

// Logger interface for observability
export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, meta?: any): void {
    console.log(`[INFO] ${message}`, meta || "");
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${message}`, meta || "");
  }

  error(message: string, meta?: any): void {
    console.error(`[ERROR] ${message}`, meta || "");
  }

  debug(message: string, meta?: any): void {
    console.debug(`[DEBUG] ${message}`, meta || "");
  }
}

export const logger = new ConsoleLogger();
