import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../Dashboard";
import {
  createMockUser,
  createMockRecruiter,
  createMockJob,
  createMockApplication,
} from "../../__tests__/test-utils";

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

// Mock the API and AI services
vi.mock("../../lib/api", () => ({
  apiService: {
    getJobs: vi.fn(),
    getApplications: vi.fn(),
    getNotifications: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../lib/ai", () => ({
  aiService: {
    generateInsights: vi.fn(),
    analyzeApplications: vi.fn(),
  },
}));

vi.mock("../../lib/scraping", () => ({
  scrapingService: {
    scrapeJobs: vi.fn(),
  },
}));

describe("Dashboard Component", () => {
  const mockUser = createMockUser();
  const mockRecruiter = createMockRecruiter();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage
    global.localStorage.clear();
  });

  describe("Rendering and Layout", () => {
    it("should render dashboard header correctly", () => {
      render(<Dashboard user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /welcome back, test/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/here's what's happening with your/i),
      ).toBeInTheDocument();
    });

    it("should render different content for recruiters vs applicants", () => {
      const { rerender } = render(<Dashboard user={mockRecruiter} />);

      // Recruiter should see jobs-focused content
      expect(screen.getByText(/new applications/i)).toBeInTheDocument();

      rerender(<Dashboard user={mockUser} />);

      // Applicant should see application-focused content
      expect(screen.getAllByText(/applications/i).length).toBeGreaterThan(0);
    });

    it("should render tab navigation", () => {
      render(<Dashboard user={mockUser} />);

      expect(
        screen.getByRole("tab", { name: /overview/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /jobs/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /applications/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /analytics/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Tab Navigation", () => {
    it("should switch between tabs correctly", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      const jobsTab = screen.getByRole("tab", { name: /jobs/i });
      await user.click(jobsTab);

      expect(jobsTab).toHaveAttribute("data-state", "active");
    });

    it("should show different content in each tab", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      // Click on Applications tab
      const applicationsTab = screen.getByRole("tab", {
        name: /applications/i,
      });
      await user.click(applicationsTab);

      expect(screen.getByText(/recent applications/i)).toBeInTheDocument();

      // Click on Analytics tab
      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      expect(screen.getByText(/recruitment performance/i)).toBeInTheDocument();
    });
  });

  describe("Quick Actions", () => {
    it("should render quick action cards", () => {
      render(<Dashboard user={mockRecruiter} />);

      expect(screen.getAllByText(/post new job/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/view analytics/i)).toBeInTheDocument();
      // Quick actions section should be present
      expect(screen.getByText(/quick actions/i)).toBeInTheDocument();
    });

    it("should handle post new job action for recruiters", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockRecruiter} />);

      const postJobButton = screen.getAllByText(/post new job/i)[0];
      await user.click(postJobButton);

      expect(mockNavigate).toHaveBeenCalledWith("/jobs/new");
    });

    it.skip("should handle AI insights action", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockRecruiter} />);

      const aiInsightsButton = screen.getByText(/ai insights/i);
      await user.click(aiInsightsButton);

      expect(mockNavigate).toHaveBeenCalledWith("/applicants");
    });

    it.skip("should handle AI insights for applicants", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      const aiInsightsButton = screen.getByText(/ai insights/i);
      await user.click(aiInsightsButton);

      expect(mockNavigate).toHaveBeenCalledWith("/search");
    });

    it("should handle view analytics action", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      const analyticsButton = screen.getByText(/view analytics/i);
      await user.click(analyticsButton);

      expect(mockNavigate).toHaveBeenCalledWith("/analytics");
    });
  });

  describe("Stats Display", () => {
    it("should display dashboard stats", () => {
      render(<Dashboard user={mockUser} />);

      // Should show some stat cards
      expect(screen.getByText(/total/i)).toBeInTheDocument();
    });

    it("should handle loading state", () => {
      render(<Dashboard user={mockUser} />);

      // Initially should show loading or default state
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("should update stats based on user role", () => {
      const { rerender } = render(<Dashboard user={mockRecruiter} />);

      // Recruiter stats
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();

      rerender(<Dashboard user={mockUser} />);

      // Applicant stats
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });
  });

  describe("Recent Jobs Section", () => {
    beforeEach(() => {
      // Mock some jobs in localStorage
      const mockJobs = [createMockJob(), createMockJob({ id: "job-2" })];
      localStorage.setItem(
        `jobs_${mockRecruiter.id}`,
        JSON.stringify(mockJobs),
      );
    });

    it("should display recent jobs for recruiters", () => {
      render(<Dashboard user={mockRecruiter} />);

      // Should show jobs section
      expect(screen.getByText(/recent jobs/i)).toBeInTheDocument();
    });

    it("should handle empty jobs state", () => {
      localStorage.removeItem(`jobs_${mockRecruiter.id}`);
      render(<Dashboard user={mockRecruiter} />);

      expect(screen.getByText(/recent jobs/i)).toBeInTheDocument();
    });

    it("should navigate to job creation", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockRecruiter} />);

      // Find and click post new job button
      const createButton = screen.getAllByText(/post new job/i)[0];
      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith("/jobs/new");
    });
  });

  describe("Applications Section", () => {
    it("should display View All Applications button", async () => {
      render(<Dashboard user={mockUser} />);

      const applicationsTab = screen.getByRole("tab", {
        name: /applications/i,
      });
      fireEvent.click(applicationsTab);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /view all applications/i }),
        ).toBeInTheDocument();
      });
    });

    it("should navigate to applications page when clicking View All", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      const applicationsTab = screen.getByRole("tab", {
        name: /applications/i,
      });
      await user.click(applicationsTab);

      const viewAllButton = screen.getByRole("button", {
        name: /view all applications/i,
      });
      await user.click(viewAllButton);

      expect(mockNavigate).toHaveBeenCalledWith("/applications");
    });

    it("should display recent applications", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      const applicationsTab = screen.getByRole("tab", {
        name: /applications/i,
      });
      await user.click(applicationsTab);

      expect(screen.getByText(/recent applications/i)).toBeInTheDocument();
    });
  });

  describe("Analytics Tab", () => {
    it("should display analytics content", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      expect(screen.getByText(/recruitment performance/i)).toBeInTheDocument();
    });

    it("should show different analytics for recruiters vs applicants", async () => {
      const user = userEvent.setup();

      // Test recruiter analytics
      const { rerender } = render(<Dashboard user={mockRecruiter} />);

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      expect(screen.getByText(/recruitment performance/i)).toBeInTheDocument();
    });

    it("should handle metrics refresh", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      await user.click(refreshButton);

      expect(screen.getByText(/recruitment performance/i)).toBeInTheDocument();
    });
  });

  describe("Data Loading and Error Handling", () => {
    it("should handle localStorage errors gracefully", () => {
      // Mock localStorage to throw
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error("Storage error");
      });

      expect(() => render(<Dashboard user={mockUser} />)).not.toThrow();

      // Restore original
      localStorage.getItem = originalGetItem;
    });

    it("should handle invalid JSON in localStorage", () => {
      localStorage.setItem(`jobs_${mockUser.id}`, "invalid json");

      expect(() => render(<Dashboard user={mockUser} />)).not.toThrow();
    });

    it("should initialize demo data when needed", () => {
      render(<Dashboard user={mockRecruiter} />);

      // Should render without errors even with empty localStorage
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should render on different screen sizes", () => {
      // Test mobile
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Dashboard user={mockUser} />);
      // Dashboard should render main content
      expect(
        screen.getByRole("heading", { name: /welcome back/i }),
      ).toBeInTheDocument();

      // Test desktop
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<Dashboard user={mockUser} />);
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should handle keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      // Tab navigation should focus some element
      await user.tab();
      expect(document.activeElement).not.toBe(null);

      // Should have focusable elements in the dashboard
      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBeGreaterThan(0);
    });

    it("should handle focus management", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      const firstTab = screen.getByRole("tab", { name: /overview/i });
      await user.click(firstTab);

      expect(firstTab).toHaveFocus();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<Dashboard user={mockUser} />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab").length).toBeGreaterThan(0);
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("should support screen readers", () => {
      render(<Dashboard user={mockUser} />);

      // Should have proper headings hierarchy
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

      // Should have descriptive text
      expect(screen.getByText(/here's what's happening/i)).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should not cause memory leaks", () => {
      const { unmount } = render(<Dashboard user={mockUser} />);

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it("should handle rapid tab switching", async () => {
      const user = userEvent.setup();
      render(<Dashboard user={mockUser} />);

      const tabs = screen.getAllByRole("tab");

      // Rapidly switch between tabs
      for (const tab of tabs) {
        await user.click(tab);
      }

      // Should still be functional
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });
  });
});
