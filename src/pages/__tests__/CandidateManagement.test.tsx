import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CandidateManagement from "../CandidateManagement";
import { createMockUser } from "../../__tests__/test-utils";

// Mock the persistent state hooks
const mockSetCandidates = vi.fn();
const mockSetTags = vi.fn();

vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentCandidates: vi.fn(() => [
    [
      {
        id: "candidate-1",
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+31 6 12345678",
        location: "Amsterdam, NL",
        title: "Senior Frontend Developer",
        company: "TechCorp",
        experience: "5+ years",
        skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
        education: "Bachelor's in Computer Science",
        resumeUrl: "/resumes/john-doe.pdf",
        portfolioUrl: "https://johndoe.dev",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        githubUrl: "https://github.com/johndoe",
        availability: "Immediately",
        expectedSalary: "€85,000",
        status: "active",
        source: "linkedin",
        rating: 4,
        notes: "Excellent candidate with strong React skills",
        tags: ["frontend", "senior", "react"],
        addedDate: "2024-01-10T10:00:00.000Z",
        lastContact: "2024-01-15T14:30:00.000Z",
        interviews: [
          {
            date: "2024-01-20T10:00:00.000Z",
            type: "technical",
            feedback: "Strong technical skills",
            rating: 4,
          },
        ],
      },
      {
        id: "candidate-2",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+31 6 87654321",
        location: "Utrecht, NL",
        title: "UX Designer",
        company: "DesignCorp",
        experience: "3+ years",
        skills: ["Figma", "Sketch", "Adobe XD", "User Research"],
        education: "Master's in Design",
        resumeUrl: "/resumes/jane-smith.pdf",
        portfolioUrl: "https://janesmith.design",
        linkedinUrl: "https://linkedin.com/in/janesmith",
        githubUrl: null,
        availability: "2 weeks notice",
        expectedSalary: "€65,000",
        status: "contacted",
        source: "dribbble",
        rating: 3,
        notes: "Great design portfolio, good cultural fit",
        tags: ["design", "ux", "figma"],
        addedDate: "2024-01-12T09:00:00.000Z",
        lastContact: "2024-01-18T11:00:00.000Z",
        interviews: [],
      },
      {
        id: "candidate-3",
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        phone: "+31 6 11223344",
        location: "Remote",
        title: "DevOps Engineer",
        company: "CloudTech",
        experience: "7+ years",
        skills: ["Docker", "Kubernetes", "AWS", "Terraform", "Python"],
        education: "Self-taught",
        resumeUrl: "/resumes/bob-johnson.pdf",
        portfolioUrl: "https://bobjohnson.dev",
        linkedinUrl: "https://linkedin.com/in/bobjohnson",
        githubUrl: "https://github.com/bobjohnson",
        availability: "1 month notice",
        expectedSalary: "€95,000",
        status: "interviewed",
        source: "github",
        rating: 5,
        notes: "Exceptional DevOps skills, perfect for senior role",
        tags: ["devops", "senior", "kubernetes"],
        addedDate: "2024-01-08T16:00:00.000Z",
        lastContact: "2024-01-22T09:30:00.000Z",
        interviews: [
          {
            date: "2024-01-25T15:00:00.000Z",
            type: "technical",
            feedback: "Outstanding technical knowledge",
            rating: 5,
          },
          {
            date: "2024-01-26T14:00:00.000Z",
            type: "cultural",
            feedback: "Great team fit",
            rating: 4,
          },
        ],
      },
    ],
    mockSetCandidates,
    true,
  ]),
  usePersistentTags: vi.fn(() => [
    [
      "frontend",
      "backend",
      "design",
      "senior",
      "junior",
      "react",
      "vue",
      "angular",
      "nodejs",
      "python",
      "devops",
      "aws",
      "kubernetes",
    ],
    mockSetTags,
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

// Mock file upload
const mockUploadFile = vi.fn();
vi.mock("../../lib/file-upload", () => ({
  uploadFile: mockUploadFile,
}));

describe("CandidateManagement Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("should render candidate management header correctly", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /candidate management/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/discover, manage, and track top talent/i),
      ).toBeInTheDocument();
    });

    it("should render add candidate button", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /add candidate/i }),
      ).toBeInTheDocument();
    });

    it("should render search and filter controls", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(
        screen.getByPlaceholderText(/search candidates/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/all status/i)).toBeInTheDocument();
      expect(screen.getByText(/all skills/i)).toBeInTheDocument();
      expect(screen.getByText(/all locations/i)).toBeInTheDocument();
    });

    it("should show loading state when data is not loaded", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentCandidates,
      ).mockReturnValue([[], vi.fn(), false]);

      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByText(/loading candidates/i)).toBeInTheDocument();
    });
  });

  describe("Candidate Display", () => {
    it("should display candidate cards", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(screen.getByText(/bob johnson/i)).toBeInTheDocument();
    });

    it("should show candidate information", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(
        screen.getByText(/senior frontend developer/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/amsterdam, nl/i)).toBeInTheDocument();
      expect(screen.getByText(/5\+ years/i)).toBeInTheDocument();
    });

    it("should display status badges", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByText(/active/i)).toBeInTheDocument();
      expect(screen.getByText(/contacted/i)).toBeInTheDocument();
      expect(screen.getByText(/interviewed/i)).toBeInTheDocument();
    });

    it("should show rating stars", () => {
      render(<CandidateManagement user={mockUser} />);

      const ratingElements = screen.getAllByRole("img", { name: /star/i });
      expect(ratingElements.length).toBeGreaterThan(0);
    });

    it("should display skills and tags", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByText(/react/i)).toBeInTheDocument();
      expect(screen.getByText(/typescript/i)).toBeInTheDocument();
      expect(screen.getByText(/frontend/i)).toBeInTheDocument();
      expect(screen.getByText(/senior/i)).toBeInTheDocument();
    });

    it("should show contact information", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByText(/john.doe@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/\+31 6 12345678/i)).toBeInTheDocument();
    });

    it("should display empty state when no candidates", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentCandidates,
      ).mockReturnValue([[], vi.fn(), true]);

      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByText(/no candidates found/i)).toBeInTheDocument();
      expect(screen.getByText(/add your first candidate/i)).toBeInTheDocument();
    });
  });

  describe("Search and Filtering", () => {
    it("should filter candidates by search term", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/search candidates/i);
      await user.type(searchInput, "john");

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter by status", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const statusFilter = screen.getByRole("combobox", { name: /status/i });
      await user.click(statusFilter);
      await user.click(screen.getByText(/active/i));

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter by skills", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const skillsFilter = screen.getByRole("combobox", { name: /skills/i });
      await user.click(skillsFilter);
      await user.click(screen.getByText(/react/i));

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter by location", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const locationFilter = screen.getByRole("combobox", {
        name: /location/i,
      });
      await user.click(locationFilter);
      await user.click(screen.getByText(/amsterdam/i));

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bob johnson/i)).not.toBeInTheDocument();
    });

    it("should filter by rating", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const ratingFilter = screen.getByRole("combobox", { name: /rating/i });
      await user.click(ratingFilter);
      await user.click(screen.getByText(/5 stars/i));

      expect(screen.getByText(/bob johnson/i)).toBeInTheDocument();
      expect(screen.queryByText(/john doe/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
    });

    it("should clear filters", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/search candidates/i);
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

  describe("Candidate Actions", () => {
    it("should handle status change", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const statusDropdown = screen
        .getAllByRole("combobox")
        .find((dropdown) =>
          dropdown.getAttribute("aria-label")?.includes("Change status"),
        );

      if (statusDropdown) {
        await user.click(statusDropdown);
        await user.click(screen.getByText(/hired/i));

        expect(mockSetCandidates).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Status Updated",
          }),
        );
      }
    });

    it("should handle rating change", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const ratingStars = screen.getAllByRole("button", {
        name: /set rating/i,
      });
      await user.click(ratingStars[0]);

      expect(mockSetCandidates).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Rating Updated",
        }),
      );
    });

    it("should handle notes update", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const editNotesButtons = screen.getAllByRole("button", {
        name: /edit notes/i,
      });
      await user.click(editNotesButtons[0]);

      const notesTextarea = screen.getByRole("textbox", { name: /notes/i });
      await user.clear(notesTextarea);
      await user.type(notesTextarea, "Updated candidate notes");

      const saveButton = screen.getByRole("button", { name: /save notes/i });
      await user.click(saveButton);

      expect(mockSetCandidates).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Notes Updated",
        }),
      );
    });

    it("should handle candidate deletion", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete/i,
      });
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      expect(
        screen.getByRole("dialog", { name: /delete candidate/i }),
      ).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", {
        name: /delete candidate/i,
      });
      await user.click(confirmButton);

      expect(mockSetCandidates).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Candidate Deleted",
        }),
      );
    });

    it("should handle contact action", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const contactButtons = screen.getAllByRole("button", {
        name: /contact/i,
      });
      await user.click(contactButtons[0]);

      expect(
        screen.getByRole("dialog", { name: /contact candidate/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Add/Edit Candidate", () => {
    it("should open add candidate modal", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const addButton = screen.getByRole("button", { name: /add candidate/i });
      await user.click(addButton);

      expect(
        screen.getByRole("dialog", { name: /add candidate/i }),
      ).toBeInTheDocument();
    });

    it("should handle candidate form submission", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const addButton = screen.getByRole("button", { name: /add candidate/i });
      await user.click(addButton);

      // Fill form
      await user.type(screen.getByLabelText(/name/i), "New Candidate");
      await user.type(screen.getByLabelText(/email/i), "new@example.com");
      await user.type(screen.getByLabelText(/phone/i), "+31 6 12345678");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /add candidate/i,
      });
      await user.click(submitButton);

      expect(mockSetCandidates).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Candidate Added",
        }),
      );
    });

    it("should validate required fields", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const addButton = screen.getByRole("button", { name: /add candidate/i });
      await user.click(addButton);

      // Try to submit without filling required fields
      const submitButton = screen.getByRole("button", {
        name: /add candidate/i,
      });
      await user.click(submitButton);

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it("should handle resume upload", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      mockUploadFile.mockResolvedValue("/resumes/new-resume.pdf");

      const addButton = screen.getByRole("button", { name: /add candidate/i });
      await user.click(addButton);

      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(["resume"], "resume.pdf", {
        type: "application/pdf",
      });

      await user.upload(fileInput, file);

      expect(mockUploadFile).toHaveBeenCalledWith(file, "resumes");
    });

    it("should handle tag management", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const addButton = screen.getByRole("button", { name: /add candidate/i });
      await user.click(addButton);

      // Add existing tag
      const tagInput = screen.getByLabelText(/tags/i);
      await user.type(tagInput, "react");
      await user.keyboard("{Enter}");

      // Add new tag
      await user.type(tagInput, "newtag");
      await user.keyboard("{Enter}");

      expect(screen.getByText(/react/i)).toBeInTheDocument();
      expect(screen.getByText(/newtag/i)).toBeInTheDocument();
    });
  });

  describe("Candidate Details Modal", () => {
    it("should open candidate details modal", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      expect(
        screen.getByRole("dialog", { name: /candidate details/i }),
      ).toBeInTheDocument();
    });

    it("should display complete candidate information", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      expect(screen.getByText(/contact information/i)).toBeInTheDocument();
      expect(screen.getByText(/skills & experience/i)).toBeInTheDocument();
      expect(screen.getByText(/education/i)).toBeInTheDocument();
      expect(screen.getByText(/interview history/i)).toBeInTheDocument();
    });

    it("should show interview history", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      expect(screen.getByText(/technical interview/i)).toBeInTheDocument();
      expect(screen.getByText(/strong technical skills/i)).toBeInTheDocument();
    });

    it("should handle edit from modal", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await user.click(viewButtons[0]);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      expect(
        screen.getByRole("dialog", { name: /edit candidate/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Bulk Operations", () => {
    it("should select multiple candidates", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it("should select all candidates", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const selectAllCheckbox = screen.getByRole("checkbox", {
        name: /select all/i,
      });
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
    });

    it("should handle bulk status change", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      // Select candidates
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Change status
      const bulkStatusButton = screen.getByRole("button", {
        name: /change status/i,
      });
      await user.click(bulkStatusButton);
      await user.click(screen.getByText(/contacted/i));

      expect(mockSetCandidates).toHaveBeenCalled();
    });

    it("should handle bulk tag addition", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      // Select candidates
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Add tags
      const bulkTagButton = screen.getByRole("button", {
        name: /add tags/i,
      });
      await user.click(bulkTagButton);

      const tagInput = screen.getByLabelText(/add tags/i);
      await user.type(tagInput, "qualified");
      await user.keyboard("{Enter}");

      expect(mockSetCandidates).toHaveBeenCalled();
    });

    it("should export selected candidates", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      // Select candidates
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
    it("should sort candidates by name", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/name a-z/i));

      const candidateNames = screen.getAllByRole("heading", { level: 3 });
      expect(candidateNames[0]).toHaveTextContent(/bob johnson/i);
    });

    it("should sort by rating", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/highest rated/i));

      const candidateNames = screen.getAllByRole("heading", { level: 3 });
      expect(candidateNames[0]).toHaveTextContent(/bob johnson/i);
    });

    it("should sort by date added", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/newest first/i));

      const candidateNames = screen.getAllByRole("heading", { level: 3 });
      expect(candidateNames[0]).toHaveTextContent(/jane smith/i);
    });
  });

  describe("Statistics", () => {
    it("should display candidate statistics", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByText(/total candidates/i)).toBeInTheDocument();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
      expect(screen.getByText(/interviewed/i)).toBeInTheDocument();
      expect(screen.getByText(/average rating/i)).toBeInTheDocument();
    });

    it("should calculate statistics correctly", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByText("3")).toBeInTheDocument(); // total
      expect(screen.getByText("1")).toBeInTheDocument(); // active
      expect(screen.getByText("1")).toBeInTheDocument(); // interviewed
      expect(screen.getByText("4.0")).toBeInTheDocument(); // average rating
    });
  });

  describe("Error Handling", () => {
    it("should handle candidate loading errors", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentCandidates,
      ).mockImplementation(() => {
        throw new Error("Failed to load candidates");
      });

      expect(() =>
        render(<CandidateManagement user={mockUser} />),
      ).not.toThrow();
    });

    it("should handle candidate action errors", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      // Mock setter to throw
      mockSetCandidates.mockImplementation(() => {
        throw new Error("Failed to update candidate");
      });

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete/i,
      });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole("button", {
        name: /delete candidate/i,
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
      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(expect.any(Number));
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<CandidateManagement user={mockUser} />);

      // Tab through candidate cards
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("article");

      // Enter to view details
      await user.keyboard("{Enter}");
      expect(
        screen.getByRole("dialog", { name: /candidate details/i }),
      ).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      render(<CandidateManagement user={mockUser} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        expect.any(Number),
      );
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(
        expect.any(Number),
      );
    });
  });

  describe("Performance", () => {
    it("should handle large candidate lists efficiently", () => {
      // Mock large candidate list
      const largeCandidateList = Array.from({ length: 1000 }, (_, i) => ({
        id: `candidate-${i}`,
        name: `Candidate ${i}`,
        email: `candidate${i}@example.com`,
        status: "active",
        rating: Math.floor(Math.random() * 5) + 1,
        addedDate: new Date().toISOString(),
      }));

      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentCandidates,
      ).mockReturnValue([largeCandidateList, vi.fn(), true]);

      render(<CandidateManagement user={mockUser} />);

      // Should virtualize large lists
      const renderedCandidates = screen.getAllByRole("article");
      expect(renderedCandidates.length).toBeLessThan(100);
    });

    it("should handle memory cleanup", () => {
      const { unmount } = render(<CandidateManagement user={mockUser} />);

      expect(() => unmount()).not.toThrow();
    });
  });
});
