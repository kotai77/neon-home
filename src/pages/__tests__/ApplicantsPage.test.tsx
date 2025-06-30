import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApplicantsPage from "../ApplicantsPage";
import { createMockUser } from "../../__tests__/test-utils";

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockParams = { jobId: "job-1" };

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

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
        coverLetter:
          "I am very interested in this position and believe my 5+ years of experience in React development makes me a perfect fit.",
        experience: "5+ years",
        location: "Amsterdam, NL",
        expectedSalary: "€85,000",
        availabilityDate: "2024-02-01",
        notes: "Strong candidate with relevant experience",
        rating: 4,
        skills: ["React", "TypeScript", "Node.js", "GraphQL"],
        education: "Bachelor's in Computer Science",
        portfolio: "https://johndoe.dev",
        linkedinProfile: "https://linkedin.com/in/johndoe",
        interviewDate: null,
        source: "linkedin",
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
        coverLetter:
          "Excited to join your team and contribute to innovative projects.",
        experience: "3+ years",
        location: "Utrecht, NL",
        expectedSalary: "€75,000",
        availabilityDate: "2024-01-15",
        notes: "Good technical skills, needs more experience with TypeScript",
        rating: 3,
        skills: ["React", "JavaScript", "CSS", "HTML"],
        education: "Master's in Software Engineering",
        portfolio: "https://janesmith.portfolio.com",
        linkedinProfile: "https://linkedin.com/in/janesmith",
        interviewDate: "2024-01-25T10:00:00.000Z",
        source: "company_website",
      },
      {
        id: "app-3",
        jobId: "job-1",
        candidateName: "Bob Johnson",
        candidateEmail: "bob.johnson@example.com",
        candidatePhone: "+31 6 11223344",
        status: "rejected",
        appliedDate: "2024-01-20T11:15:00.000Z",
        resumeUrl: "/resumes/bob-johnson.pdf",
        coverLetter:
          "Looking forward to contributing to your company's success.",
        experience: "2+ years",
        location: "Remote",
        expectedSalary: "€65,000",
        availabilityDate: "Immediately",
        notes: "Not enough experience for senior role, but good potential",
        rating: 2,
        skills: ["JavaScript", "HTML", "CSS"],
        education: "Self-taught",
        portfolio: "https://bobjohnson.github.io",
        linkedinProfile: "https://linkedin.com/in/bobjohnson",
        interviewDate: null,
        source: "indeed",
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
        location: "Amsterdam, NL",
        type: "Full-time",
        status: "published",
        description: "We are looking for a senior frontend developer...",
        requirements: ["React", "TypeScript", "5+ years experience"],
        postedDate: "2024-01-10T10:00:00.000Z",
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

// Mock file download
global.URL.createObjectURL = vi.fn(() => "mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("ApplicantsPage Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("should render applicants page header correctly", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /applicants/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/senior frontend developer/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/techcorp/i)).toBeInTheDocument();
    });

    it("should show job information", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/amsterdam, nl/i)).toBeInTheDocument();
      expect(screen.getByText(/full-time/i)).toBeInTheDocument();
      expect(screen.getByText(/published/i)).toBeInTheDocument();
    });

    it("should render filter controls", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(
        screen.getByPlaceholderText(/search applicants/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/all status/i)).toBeInTheDocument();
      expect(screen.getByText(/all ratings/i)).toBeInTheDocument();
      expect(screen.getByText(/all sources/i)).toBeInTheDocument();
    });

    it("should show loading state when data is not loaded", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentApplications,
      ).mockReturnValue([[], vi.fn(), false]);

      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/loading applicants/i)).toBeInTheDocument();
    });
  });

  describe("Applicant Display", () => {
    it("should display applicant cards", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(screen.getByText(/bob johnson/i)).toBeInTheDocument();
    });

    it("should show applicant contact information", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/john.doe@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/\+31 6 12345678/i)).toBeInTheDocument();
      expect(screen.getByText(/amsterdam, nl/i)).toBeInTheDocument();
    });

    it("should display status badges", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/pending/i)).toBeInTheDocument();
      expect(screen.getByText(/interviewed/i)).toBeInTheDocument();
      expect(screen.getByText(/rejected/i)).toBeInTheDocument();
    });

    it("should show rating stars", () => {
      render(<ApplicantsPage user={mockUser} />);

      const ratingElements = screen.getAllByRole("img", { name: /star/i });
      expect(ratingElements.length).toBeGreaterThan(0);
    });

    it("should display experience and skills", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/5\+ years/i)).toBeInTheDocument();
      expect(screen.getByText(/react/i)).toBeInTheDocument();
      expect(screen.getByText(/typescript/i)).toBeInTheDocument();
    });

    it("should show application dates", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/applied 2 days ago/i)).toBeInTheDocument();
    });

    it("should display source information", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/linkedin/i)).toBeInTheDocument();
      expect(screen.getByText(/company website/i)).toBeInTheDocument();
      expect(screen.getByText(/indeed/i)).toBeInTheDocument();
    });

    it("should display empty state when no applicants", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentApplications,
      ).mockReturnValue([[], vi.fn(), true]);

      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/no applicants found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/applicants will appear here/i),
      ).toBeInTheDocument();
    });
  });

  describe("Search and Filtering", () => {
    it("should filter applicants by search term", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/search applicants/i);
      await user.type(searchInput, "john");

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter by status", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const statusFilter = screen.getByRole("combobox", { name: /status/i });
      await user.click(statusFilter);
      await user.click(screen.getByText(/pending/i));

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter by rating", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const ratingFilter = screen.getByRole("combobox", { name: /rating/i });
      await user.click(ratingFilter);
      await user.click(screen.getByText(/4 stars & above/i));

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter by source", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const sourceFilter = screen.getByRole("combobox", { name: /source/i });
      await user.click(sourceFilter);
      await user.click(screen.getByText(/linkedin/i));

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should clear filters", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/search applicants/i);
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

  describe("Applicant Actions", () => {
    it("should handle status change", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const statusDropdown = screen
        .getAllByRole("combobox")
        .find((dropdown) =>
          dropdown.getAttribute("aria-label")?.includes("Change status"),
        );

      if (statusDropdown) {
        await user.click(statusDropdown);
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
      render(<ApplicantsPage user={mockUser} />);

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
      render(<ApplicantsPage user={mockUser} />);

      const editNotesButtons = screen.getAllByRole("button", {
        name: /edit notes/i,
      });
      await user.click(editNotesButtons[0]);

      const notesTextarea = screen.getByRole("textbox", { name: /notes/i });
      await user.clear(notesTextarea);
      await user.type(notesTextarea, "Updated candidate notes");

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
      render(<ApplicantsPage user={mockUser} />);

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
      render(<ApplicantsPage user={mockUser} />);

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

    it("should handle applicant deletion", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete/i,
      });
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      expect(
        screen.getByRole("dialog", { name: /delete applicant/i }),
      ).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", {
        name: /delete applicant/i,
      });
      await user.click(confirmButton);

      expect(mockSetApplications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Applicant Removed",
        }),
      );
    });
  });

  describe("Applicant Details Modal", () => {
    it("should open applicant details modal", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      expect(
        screen.getByRole("dialog", { name: /applicant details/i }),
      ).toBeInTheDocument();
    });

    it("should display complete applicant information in modal", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      expect(screen.getByText(/cover letter/i)).toBeInTheDocument();
      expect(
        screen.getByText(/i am very interested in this position/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/education/i)).toBeInTheDocument();
      expect(
        screen.getByText(/bachelor's in computer science/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/portfolio/i)).toBeInTheDocument();
      expect(screen.getByText(/johndoe.dev/i)).toBeInTheDocument();
    });

    it("should show skills and experience in modal", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      expect(screen.getByText(/skills/i)).toBeInTheDocument();
      expect(screen.getByText(/react/i)).toBeInTheDocument();
      expect(screen.getByText(/typescript/i)).toBeInTheDocument();
      expect(screen.getByText(/node\.js/i)).toBeInTheDocument();
      expect(screen.getByText(/graphql/i)).toBeInTheDocument();
    });

    it("should handle modal actions", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

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

  describe("Bulk Operations", () => {
    it("should select multiple applicants", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it("should select all applicants", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const selectAllCheckbox = screen.getByRole("checkbox", {
        name: /select all/i,
      });
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
    });

    it("should handle bulk status change", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      // Select applicants
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Change status
      const bulkStatusButton = screen.getByRole("button", {
        name: /change status/i,
      });
      await user.click(bulkStatusButton);
      await user.click(screen.getByText(/reviewed/i));

      expect(mockSetApplications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Status Updated",
        }),
      );
    });

    it("should handle bulk interview scheduling", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      // Select applicants
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Schedule interviews
      const bulkInterviewButton = screen.getByRole("button", {
        name: /schedule interviews/i,
      });
      await user.click(bulkInterviewButton);

      expect(
        screen.getByRole("dialog", { name: /schedule interviews/i }),
      ).toBeInTheDocument();
    });

    it("should export selected applicants", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      // Select applicants
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Export
      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Export Started",
        }),
      );
    });
  });

  describe("Sorting", () => {
    it("should sort applicants by date", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/newest first/i));

      // Applicants should be reordered
      const applicantNames = screen.getAllByRole("heading", { level: 3 });
      expect(applicantNames[0]).toHaveTextContent(/bob johnson/i);
    });

    it("should sort by rating", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/highest rated/i));

      // Applicants should be reordered
      const applicantNames = screen.getAllByRole("heading", { level: 3 });
      expect(applicantNames[0]).toHaveTextContent(/john doe/i);
    });

    it("should sort alphabetically", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/name a-z/i));

      // Applicants should be reordered
      const applicantNames = screen.getAllByRole("heading", { level: 3 });
      expect(applicantNames[0]).toHaveTextContent(/bob johnson/i);
    });
  });

  describe("Statistics and Analytics", () => {
    it("should display applicant statistics", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/total applicants/i)).toBeInTheDocument();
      expect(screen.getByText(/pending review/i)).toBeInTheDocument();
      expect(screen.getByText(/interviewed/i)).toBeInTheDocument();
      expect(screen.getByText(/average rating/i)).toBeInTheDocument();
    });

    it("should calculate statistics correctly", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText("3")).toBeInTheDocument(); // total
      expect(screen.getByText("1")).toBeInTheDocument(); // pending
      expect(screen.getByText("1")).toBeInTheDocument(); // interviewed
      expect(screen.getByText("3.0")).toBeInTheDocument(); // average rating
    });

    it("should show source distribution", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/application sources/i)).toBeInTheDocument();
      expect(screen.getByText(/linkedin: 33%/i)).toBeInTheDocument();
      expect(screen.getByText(/company website: 33%/i)).toBeInTheDocument();
      expect(screen.getByText(/indeed: 33%/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle applicant loading errors", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentApplications,
      ).mockImplementation(() => {
        throw new Error("Failed to load applicants");
      });

      expect(() => render(<ApplicantsPage user={mockUser} />)).not.toThrow();
    });

    it("should handle invalid job ID", () => {
      mockParams.jobId = "invalid-job-id";

      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByText(/job not found/i)).toBeInTheDocument();
    });

    it("should handle applicant action errors", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      // Mock setter to throw
      mockSetApplications.mockImplementation(() => {
        throw new Error("Failed to update applicant");
      });

      const statusDropdown = screen.getAllByRole("combobox")[0];
      await user.click(statusDropdown);
      await user.click(screen.getByText(/approved/i));

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
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(expect.any(Number));
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      // Tab through applicant cards
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("article");

      // Enter to view details
      await user.keyboard("{Enter}");
      expect(
        screen.getByRole("dialog", { name: /applicant details/i }),
      ).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      render(<ApplicantsPage user={mockUser} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        expect.any(Number),
      );
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(
        expect.any(Number),
      );
    });

    it("should announce status changes", async () => {
      const user = userEvent.setup();
      render(<ApplicantsPage user={mockUser} />);

      const statusDropdown = screen.getAllByRole("combobox")[0];
      await user.click(statusDropdown);
      await user.click(screen.getByText(/approved/i));

      // Should have live region for announcements
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle large applicant lists efficiently", () => {
      // Mock large applicant list
      const largeApplicantList = Array.from({ length: 1000 }, (_, i) => ({
        id: `app-${i}`,
        jobId: "job-1",
        candidateName: `Candidate ${i}`,
        candidateEmail: `candidate${i}@example.com`,
        status: "pending",
        appliedDate: new Date().toISOString(),
        rating: Math.floor(Math.random() * 5) + 1,
      }));

      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentApplications,
      ).mockReturnValue([largeApplicantList, vi.fn(), true]);

      render(<ApplicantsPage user={mockUser} />);

      // Should virtualize large lists
      const renderedApplicants = screen.getAllByRole("article");
      expect(renderedApplicants.length).toBeLessThan(100);
    });

    it("should handle memory cleanup", () => {
      const { unmount } = render(<ApplicantsPage user={mockUser} />);

      expect(() => unmount()).not.toThrow();
    });
  });
});
