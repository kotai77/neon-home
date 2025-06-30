import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JobManagement from "../JobManagement";
import { createMockUser } from "../../__tests__/test-utils";

// Mock the persistent state hooks
const mockSetJobs = vi.fn();
const mockSetApplications = vi.fn();

vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentJobs: vi.fn(() => [
    [
      {
        id: "job-1",
        title: "Senior Frontend Developer",
        company: "TechCorp",
        location: "Amsterdam, NL",
        type: "Full-time",
        salary: "€80,000 - €100,000",
        description: "Looking for an experienced frontend developer...",
        requirements: ["React", "TypeScript", "5+ years experience"],
        benefits: ["Health insurance", "Remote work", "Learning budget"],
        status: "published",
        applicantCount: 12,
        viewCount: 234,
        postedDate: "2024-01-15T10:00:00.000Z",
        expiryDate: "2024-03-15T10:00:00.000Z",
        tags: ["react", "typescript", "senior"],
        remote: true,
        urgent: false,
        featured: true,
      },
      {
        id: "job-2",
        title: "Backend Developer",
        company: "StartupXYZ",
        location: "Remote",
        type: "Contract",
        salary: "€60,000 - €80,000",
        description: "Join our backend team...",
        requirements: ["Node.js", "Python", "3+ years experience"],
        benefits: ["Flexible hours", "Stock options"],
        status: "draft",
        applicantCount: 5,
        viewCount: 89,
        postedDate: "2024-01-20T14:30:00.000Z",
        expiryDate: "2024-04-20T14:30:00.000Z",
        tags: ["nodejs", "python", "backend"],
        remote: true,
        urgent: true,
        featured: false,
      },
    ],
    mockSetJobs,
    true,
  ]),
  usePersistentApplications: vi.fn(() => [
    [
      {
        id: "app-1",
        jobId: "job-1",
        candidateName: "John Doe",
        candidateEmail: "john@example.com",
        status: "pending",
        appliedDate: "2024-01-16T09:00:00.000Z",
        resumeUrl: "/resumes/john-doe.pdf",
        coverLetter: "I am interested in this position...",
      },
    ],
    mockSetApplications,
    true,
  ]),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("../../hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("JobManagement Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("should render job management header correctly", () => {
      render(<JobManagement user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /job management/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/create, edit, and manage your job postings/i),
      ).toBeInTheDocument();
    });

    it("should render create job button", () => {
      render(<JobManagement user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /create new job/i }),
      ).toBeInTheDocument();
    });

    it("should render filters and search", () => {
      render(<JobManagement user={mockUser} />);

      expect(screen.getByPlaceholderText(/search jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/all status/i)).toBeInTheDocument();
      expect(screen.getByText(/all types/i)).toBeInTheDocument();
    });

    it("should show loading state when data is not loaded", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentJobs,
      ).mockReturnValue([[], vi.fn(), false]);

      render(<JobManagement user={mockUser} />);

      expect(screen.getByText(/loading jobs/i)).toBeInTheDocument();
    });
  });

  describe("Job Listing", () => {
    it("should display job cards", () => {
      render(<JobManagement user={mockUser} />);

      expect(
        screen.getByText(/senior frontend developer/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/techcorp/i)).toBeInTheDocument();
      expect(screen.getByText(/backend developer/i)).toBeInTheDocument();
      expect(screen.getByText(/startupxyz/i)).toBeInTheDocument();
    });

    it("should show job status badges", () => {
      render(<JobManagement user={mockUser} />);

      expect(screen.getByText(/published/i)).toBeInTheDocument();
      expect(screen.getByText(/draft/i)).toBeInTheDocument();
    });

    it("should display job statistics", () => {
      render(<JobManagement user={mockUser} />);

      expect(screen.getByText(/12 applicants/i)).toBeInTheDocument();
      expect(screen.getByText(/234 views/i)).toBeInTheDocument();
      expect(screen.getByText(/5 applicants/i)).toBeInTheDocument();
      expect(screen.getByText(/89 views/i)).toBeInTheDocument();
    });

    it("should show featured and urgent badges", () => {
      render(<JobManagement user={mockUser} />);

      expect(screen.getByText(/featured/i)).toBeInTheDocument();
      expect(screen.getByText(/urgent/i)).toBeInTheDocument();
    });

    it("should display empty state when no jobs", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentJobs,
      ).mockReturnValue([[], vi.fn(), true]);

      render(<JobManagement user={mockUser} />);

      expect(screen.getByText(/no jobs found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/create your first job posting/i),
      ).toBeInTheDocument();
    });
  });

  describe("Search and Filtering", () => {
    it("should filter jobs by search term", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/search jobs/i);
      await user.type(searchInput, "frontend");

      expect(
        screen.getByText(/senior frontend developer/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/backend developer/i)).not.toBeInTheDocument();
    });

    it("should filter jobs by status", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const statusFilter = screen.getByRole("combobox", { name: /status/i });
      await user.click(statusFilter);
      await user.click(screen.getByText(/published/i));

      expect(
        screen.getByText(/senior frontend developer/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/backend developer/i)).not.toBeInTheDocument();
    });

    it("should filter jobs by type", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const typeFilter = screen.getByRole("combobox", { name: /type/i });
      await user.click(typeFilter);
      await user.click(screen.getByText(/full-time/i));

      expect(
        screen.getByText(/senior frontend developer/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/backend developer/i)).not.toBeInTheDocument();
    });

    it("should clear filters", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/search jobs/i);
      await user.type(searchInput, "frontend");

      // Clear filter
      const clearButton = screen.getByRole("button", { name: /clear/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue("");
      expect(
        screen.getByText(/senior frontend developer/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/backend developer/i)).toBeInTheDocument();
    });
  });

  describe("Job Actions", () => {
    it("should handle job editing", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      await user.click(editButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/job-posting", {
        state: { editingJob: expect.any(Object) },
      });
    });

    it("should handle job viewing", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/job-details/job-1");
    });

    it("should handle job duplication", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const duplicateButtons = screen.getAllByRole("button", {
        name: /duplicate/i,
      });
      await user.click(duplicateButtons[0]);

      expect(mockSetJobs).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Job Duplicated",
        }),
      );
    });

    it("should handle job deletion", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete/i,
      });
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      expect(
        screen.getByRole("dialog", { name: /delete job/i }),
      ).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", {
        name: /delete job/i,
      });
      await user.click(confirmButton);

      expect(mockSetJobs).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Job Deleted",
        }),
      );
    });

    it("should handle job status toggle", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const publishButtons = screen.getAllByRole("button", {
        name: /publish/i,
      });
      await user.click(publishButtons[0]);

      expect(mockSetJobs).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Job Published",
        }),
      );
    });
  });

  describe("Bulk Actions", () => {
    it("should select multiple jobs", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it("should select all jobs", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const selectAllCheckbox = screen.getByRole("checkbox", {
        name: /select all/i,
      });
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it("should handle bulk deletion", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      // Select jobs
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Delete selected
      const bulkDeleteButton = screen.getByRole("button", {
        name: /delete selected/i,
      });
      await user.click(bulkDeleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole("button", {
        name: /delete jobs/i,
      });
      await user.click(confirmButton);

      expect(mockSetJobs).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Jobs Deleted",
        }),
      );
    });

    it("should handle bulk status change", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      // Select jobs
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Change status
      const statusButton = screen.getByRole("button", {
        name: /change status/i,
      });
      await user.click(statusButton);
      await user.click(screen.getByText(/publish/i));

      expect(mockSetJobs).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Jobs Updated",
        }),
      );
    });
  });

  describe("Job Creation", () => {
    it("should navigate to job posting page for new job", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const createButton = screen.getByRole("button", {
        name: /create new job/i,
      });
      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith("/job-posting");
    });
  });

  describe("Sorting", () => {
    it("should sort jobs by date", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/newest first/i));

      // Jobs should be reordered
      const jobTitles = screen.getAllByRole("heading", { level: 3 });
      expect(jobTitles[0]).toHaveTextContent(/backend developer/i);
    });

    it("should sort jobs by applicant count", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/most applicants/i));

      // Jobs should be reordered
      const jobTitles = screen.getAllByRole("heading", { level: 3 });
      expect(jobTitles[0]).toHaveTextContent(/senior frontend developer/i);
    });
  });

  describe("Performance Analytics", () => {
    it("should display job performance metrics", () => {
      render(<JobManagement user={mockUser} />);

      expect(screen.getByText(/total jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/active jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/total applications/i)).toBeInTheDocument();
      expect(
        screen.getByText(/avg. applications per job/i),
      ).toBeInTheDocument();
    });

    it("should calculate metrics correctly", () => {
      render(<JobManagement user={mockUser} />);

      expect(screen.getByText("2")).toBeInTheDocument(); // total jobs
      expect(screen.getByText("1")).toBeInTheDocument(); // active jobs
      expect(screen.getByText("17")).toBeInTheDocument(); // total applications
      expect(screen.getByText("8.5")).toBeInTheDocument(); // avg applications
    });
  });

  describe("Error Handling", () => {
    it("should handle job loading errors", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentJobs,
      ).mockImplementation(() => {
        throw new Error("Failed to load jobs");
      });

      expect(() => render(<JobManagement user={mockUser} />)).not.toThrow();
    });

    it("should handle job action errors", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      // Mock job setter to throw
      mockSetJobs.mockImplementation(() => {
        throw new Error("Failed to update job");
      });

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete/i,
      });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole("button", {
        name: /delete job/i,
      });
      await user.click(confirmButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          variant: "destructive",
        }),
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<JobManagement user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(expect.any(Number));
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<JobManagement user={mockUser} />);

      // Tab navigation
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("button");

      // Space/Enter for selection
      await user.keyboard(" ");
      expect(document.activeElement).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      render(<JobManagement user={mockUser} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        expect.any(Number),
      );
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(
        expect.any(Number),
      );
    });
  });

  describe("Responsive Design", () => {
    it("should adapt to mobile viewport", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<JobManagement user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });
});
