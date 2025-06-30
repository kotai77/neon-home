import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { User, UserRole } from "@/lib/types";
import { vi } from "vitest";

// Add jsdom polyfills for missing browser APIs
if (typeof window !== "undefined") {
  // Polyfill for hasPointerCapture (required by Radix UI)
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }

  // Polyfill for ResizeObserver
  if (!window.ResizeObserver) {
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Polyfill for IntersectionObserver
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Mock matchMedia
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
}

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        cacheTime: Infinity,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock user data for testing
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: "test-user-id",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  name: "Test User", // Add name property
  role: "recruiter" as UserRole, // Default to recruiter for most test scenarios
  company: "Test Company",
  avatar: "https://example.com/avatar.jpg",
  isDemo: true,
  subscription: {
    status: "active",
    planType: "pro",
    expiresAt: new Date("2024-12-31"),
  },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockRecruiter = (): User =>
  createMockUser({ role: "recruiter" as UserRole });

export const createMockApplicant = (): User =>
  createMockUser({ role: "applicant" as UserRole });

// Mock job data
export const createMockJob = (overrides?: any) => ({
  id: "test-job-id",
  recruiterId: "test-recruiter-id",
  title: "Test Job",
  company: "Test Company",
  description: "This is a test job description",
  requirements: ["Requirement 1", "Requirement 2"],
  location: "San Francisco, CA",
  salary: { min: 100000, max: 150000, currency: "USD" },
  type: "full-time",
  remote: true,
  skills: ["React", "TypeScript", "JavaScript"],
  status: "published",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

// Mock application data
export const createMockApplication = (overrides?: any) => ({
  id: "test-application-id",
  jobId: "test-job-id",
  applicantId: "test-applicant-id",
  status: "pending",
  coverLetter: "This is a test cover letter",
  resumeUrl: "https://example.com/resume.pdf",
  aiScore: 85,
  aiAnalysis: "Strong candidate with relevant experience",
  appliedAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

// Mock notification data
export const createMockNotification = (overrides?: any) => ({
  id: "test-notification-id",
  userId: "test-user-id",
  type: "job_application",
  priority: "medium",
  title: "Test Notification",
  message: "This is a test notification",
  actionUrl: "/test",
  actionLabel: "View",
  metadata: {},
  read: false,
  archived: false,
  createdAt: new Date("2024-01-01"),
  readAt: undefined,
  ...overrides,
});

// Mock localStorage functions
export const mockLocalStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    store,
  };
};

// Wait for async operations
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock API responses
export function mockApiResponse<T>(data: T, success = true) {
  return {
    success,
    data: success ? data : undefined,
    error: success ? undefined : "Mock error",
  };
}

// Custom matchers
export const expectToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className);
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
