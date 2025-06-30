import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApplicationManagement from "../ApplicationManagement";
import { createMockUser } from "../../__tests__/test-utils";

// Mock the persistent state hooks
const mockSetApplications = vi.fn();
const mockSetJobs = vi.fn();

vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentApplications: vi.fn(() => [
    [
      {
        id: "app-1",
        jobId: "job-1",
        candidateName: "John Doe",
        candidateEmail: "john.doe@example.com",
        candidatePhone: "+31 6 12345678",
        status: "pending",
        appliedDate: "2024-01-16T09:00:00.000Z",
        resumeUrl: "/resumes/john-doe.pdf",
        coverLetter: "I am very interested in this position...",
        experience: "5+ years",
        location: "Amsterdam, NL",
        salary: "€85,000",
        notes: "Strong candidate with relevant experience",
        rating: 4,
        interviewDate: null,
        jobTitle: "Senior Frontend Developer",
        jobCompany: "TechCorp",
      },
      {
        id: "app-2",
        jobId: "job-1",
        candidateName: "Jane Smith",
        candidateEmail: "jane.smith@example.com",
        candidatePhone: "+31 6 87654321",
        status: "interviewed",
        appliedDate: "2024-01-18T14:30:00.000Z",
        resumeUrl: "/resumes/jane-smith.pdf",
        coverLetter: "Excited to join your team...",
        experience: "3+ years",
        location: "Utrecht, NL",
        salary: "€75,000",
        notes: "Good technical skills, needs more experience",
        rating: 3,
        interviewDate: "2024-01-25T10:00:00.000Z",
        jobTitle: "Senior Frontend Developer",
        jobCompany: "TechCorp",
      },
      {
        id: "app-3",
        jobId: "job-2",
        candidateName: "Bob Johnson",
        candidateEmail: "bob.johnson@example.com",
        candidatePhone: "+31 6 11223344",
        status: "rejected",
        appliedDate: "2024-01-20T11:15:00.000Z",
        resumeUrl: "/resumes/bob-johnson.pdf",
        coverLetter: "Looking forward to contributing...",
        experience: "2+ years",
        location: "Remote",
        salary: "€65,000",
        notes: "Not enough experience for senior role",
        rating: 2,
        interviewDate: null,
        jobTitle: "Backend Developer",
        jobCompany: "StartupXYZ",
      },
    ],
    mockSetApplications,
    true,
  ]),
  usePersistentJobs: vi.fn(() => [
    [
      {
        id: "job-1",
        title: "Senior Frontend Developer",
        company: "TechCorp",
        status: "published",
      },
      {
        id: "job-2",
        title: "Backend Developer",
        company: "StartupXYZ",
        status: "published",
      },
    ],
    mockSetJobs,
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

describe("ApplicationManagement Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("should render application management header correctly", () => {
      render(<ApplicationManagement user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /application management/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/review and manage job applications/i),
      ).toBeInTheDocument();
    });

    it("should render filters and search", () => {
      render(<ApplicationManagement user={mockUser} />);

      expect(
        screen.getByPlaceholderText(/search applications/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/all status/i)).toBeInTheDocument();
      expect(screen.getByText(/all jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/all ratings/i)).toBeInTheDocument();
    });

    it("should show loading state when data is not loaded", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentApplications,
      ).mockReturnValue([[], vi.fn(), false]);

      render(<ApplicationManagement user={mockUser} />);

      expect(screen.getByText(/loading applications/i)).toBeInTheDocument();
    });
  });

  describe("Application Listing", () => {
    it("should display application cards", () => {
      render(<ApplicationManagement user={mockUser} />);

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(screen.getByText(/bob johnson/i)).toBeInTheDocument();
    });

    it("should show application status badges", () => {
      render(<ApplicationManagement user={mockUser} />);

      expect(screen.getByText(/pending/i)).toBeInTheDocument();
      expect(screen.getByText(/interviewed/i)).toBeInTheDocument();
      expect(screen.getByText(/rejected/i)).toBeInTheDocument();
    });

    it("should display candidate information", () => {
      render(<ApplicationManagement user={mockUser} />);

      expect(screen.getByText(/john.doe@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/jane.smith@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/5\+ years/i)).toBeInTheDocument();
      expect(screen.getByText(/amsterdam, nl/i)).toBeInTheDocument();
    });

    it("should show rating stars", () => {
      render(<ApplicationManagement user={mockUser} />);

      const ratingElements = screen.getAllByRole("img", { name: /star/i });
      expect(ratingElements.length).toBeGreaterThan(0);
    });

    it("should display job information", () => {
      render(<ApplicationManagement user={mockUser} />);

      expect(
        screen.getByText(/senior frontend developer/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/techcorp/i)).toBeInTheDocument();
      expect(screen.getByText(/backend developer/i)).toBeInTheDocument();
      expect(screen.getByText(/startupxyz/i)).toBeInTheDocument();
    });

    it("should display empty state when no applications", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentApplications,
      ).mockReturnValue([[], vi.fn(), true]);

      render(<ApplicationManagement user={mockUser} />);

      expect(screen.getByText(/no applications found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/applications will appear here/i),
      ).toBeInTheDocument();
    });
  });

  describe("Search and Filtering", () => {
    it("should filter applications by search term", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      await user.type(searchInput, "john");

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter applications by status", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const statusFilter = screen.getByRole("combobox", { name: /status/i });
      await user.click(statusFilter);
      await user.click(screen.getByText(/pending/i));

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter applications by job", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const jobFilter = screen.getByRole("combobox", { name: /job/i });
      await user.click(jobFilter);
      await user.click(screen.getByText(/senior frontend developer/i));

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter applications by rating", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const ratingFilter = screen.getByRole("combobox", { name: /rating/i });
      await user.click(ratingFilter);
      await user.click(screen.getByText(/4 stars & above/i));

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should clear filters", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/search applications/i);
      await user.type(searchInput, "john");

      // Clear filter
      const clearButton = screen.getByRole("button", { name: /clear/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue("");
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(screen.getByText(/bob johnson/i)).toBeInTheDocument();
    });
  });

  describe("Application Actions", () => {
    it("should handle status change", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const statusDropdowns = screen.getAllByRole("combobox");
      const applicationStatus = statusDropdowns.find((dropdown) =>
        dropdown.getAttribute("aria-label")?.includes("Change status"),
      );

      if (applicationStatus) {
        await user.click(applicationStatus);
        await user.click(screen.getByText(/approved/i));

        expect(mockSetApplications).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Status Updated",
          }),
        );
      }
    });

    it("should handle rating change", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const ratingStars = screen.getAllByRole("button", {
        name: /set rating/i,
      });
      await user.click(ratingStars[0]);

      expect(mockSetApplications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Rating Updated",
        }),
      );
    });

    it("should handle notes update", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const editNoteButtons = screen.getAllByRole("button", {
        name: /edit notes/i,
      });
      await user.click(editNoteButtons[0]);

      const notesTextarea = screen.getByRole("textbox", { name: /notes/i });
      await user.clear(notesTextarea);
      await user.type(notesTextarea, "Updated notes for candidate");

      const saveButton = screen.getByRole("button", { name: /save notes/i });
      await user.click(saveButton);

      expect(mockSetApplications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Notes Updated",
        }),
      );
    });

    it("should handle interview scheduling", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const scheduleButtons = screen.getAllByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(scheduleButtons[0]);

      expect(
        screen.getByRole("dialog", { name: /schedule interview/i }),
      ).toBeInTheDocument();

      const dateInput = screen.getByLabelText(/interview date/i);
      await user.type(dateInput, "2024-02-01");

      const timeInput = screen.getByLabelText(/interview time/i);
      await user.type(timeInput, "14:00");

      const confirmButton = screen.getByRole("button", {
        name: /schedule/i,
      });
      await user.click(confirmButton);

      expect(mockSetApplications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Interview Scheduled",
        }),
      );
    });

    it("should handle resume download", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const downloadButtons = screen.getAllByRole("button", {
        name: /download resume/i,
      });
      await user.click(downloadButtons[0]);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Downloading Resume",
        }),
      );
    });

    it("should handle application deletion", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete/i,
      });
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      expect(
        screen.getByRole("dialog", { name: /delete application/i }),
      ).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", {
        name: /delete application/i,
      });
      await user.click(confirmButton);

      expect(mockSetApplications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Application Deleted",
        }),
      );
    });
  });

  describe("Bulk Actions", () => {
    it("should select multiple applications", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it("should select all applications", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const selectAllCheckbox = screen.getByRole("checkbox", {
        name: /select all/i,
      });
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
    });

    it("should handle bulk status change", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      // Select applications
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Change status
      const bulkStatusButton = screen.getByRole("button", {
        name: /change status/i,
      });
      await user.click(bulkStatusButton);
      await user.click(screen.getByText(/approved/i));

      expect(mockSetApplications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Applications Updated",
        }),
      );
    });

    it("should handle bulk deletion", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      // Select applications
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
        name: /delete applications/i,
      });
      await user.click(confirmButton);

      expect(mockSetApplications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Applications Deleted",
        }),
      );
    });
  });

  describe("Sorting", () => {
    it("should sort applications by date", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/newest first/i));

      // Applications should be reordered
      const candidateNames = screen.getAllByRole("heading", { level: 3 });
      expect(candidateNames[0]).toHaveTextContent(/bob johnson/i);
    });

    it("should sort applications by rating", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/highest rated/i));

      // Applications should be reordered
      const candidateNames = screen.getAllByRole("heading", { level: 3 });
      expect(candidateNames[0]).toHaveTextContent(/john doe/i);
    });

    it("should sort applications alphabetically", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/name a-z/i));

      // Applications should be reordered
      const candidateNames = screen.getAllByRole("heading", { level: 3 });
      expect(candidateNames[0]).toHaveTextContent(/bob johnson/i);
    });
  });

  describe("Application Statistics", () => {
    it("should display application metrics", () => {
      render(<ApplicationManagement user={mockUser} />);

      expect(screen.getByText(/total applications/i)).toBeInTheDocument();
      expect(screen.getByText(/pending review/i)).toBeInTheDocument();
      expect(screen.getByText(/interviewed/i)).toBeInTheDocument();
      expect(screen.getByText(/average rating/i)).toBeInTheDocument();
    });

    it("should calculate metrics correctly", () => {
      render(<ApplicationManagement user={mockUser} />);

      expect(screen.getByText("3")).toBeInTheDocument(); // total applications
      expect(screen.getByText("1")).toBeInTheDocument(); // pending
      expect(screen.getByText("1")).toBeInTheDocument(); // interviewed
      expect(screen.getByText("3.0")).toBeInTheDocument(); // average rating
    });
  });

  describe("Application Details Modal", () => {
    it("should open application details modal", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      expect(
        screen.getByRole("dialog", { name: /application details/i }),
      ).toBeInTheDocument();
    });

    it("should display complete candidate information in modal", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      expect(screen.getByText(/cover letter/i)).toBeInTheDocument();
      expect(
        screen.getByText(/i am very interested in this position/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/\+31 6 12345678/i)).toBeInTheDocument();
    });

    it("should handle modal actions", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      // Should have action buttons in modal
      expect(
        screen.getByRole("button", { name: /approve/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reject/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /schedule interview/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle application loading errors", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentApplications,
      ).mockImplementation(() => {
        throw new Error("Failed to load applications");
      });

      expect(() =>
        render(<ApplicationManagement user={mockUser} />),
      ).not.toThrow();
    });

    it("should handle application action errors", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      // Mock application setter to throw
      mockSetApplications.mockImplementation(() => {
        throw new Error("Failed to update application");
      });

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete/i,
      });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole("button", {
        name: /delete application/i,
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
      render(<ApplicationManagement user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(expect.any(Number));
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      // Tab navigation
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("searchbox");

      // Continue navigation
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("combobox");
    });

    it("should have proper heading hierarchy", () => {
      render(<ApplicationManagement user={mockUser} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        expect.any(Number),
      );
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(
        expect.any(Number),
      );
    });
  });

  describe("Export Functionality", () => {
    it("should handle CSV export", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);
      await user.click(screen.getByText(/csv/i));

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Export Started",
        }),
      );
    });

    it("should handle PDF export", async () => {
      const user = userEvent.setup();
      render(<ApplicationManagement user={mockUser} />);

      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);
      await user.click(screen.getByText(/pdf/i));

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Export Started",
        }),
      );
    });
  });
});
