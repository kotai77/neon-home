import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JobPostingPage from "../JobPostingPage";
import { createMockUser } from "../../__tests__/test-utils";

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = {
  state: {
    editingJob: null,
  },
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock the persistent state hooks
const mockSetJobs = vi.fn();

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

// Mock AI service
const mockGenerateJobDescription = vi.fn();
vi.mock("../../lib/ai-service", () => ({
  generateJobDescription: mockGenerateJobDescription,
}));

describe("JobPostingPage Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.state = { editingJob: null };
  });

  describe("Rendering and Layout", () => {
    it("should render job posting header for new job", () => {
      render(<JobPostingPage user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /create job posting/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/create and publish your job posting/i),
      ).toBeInTheDocument();
    });

    it("should render job posting header for editing", () => {
      mockLocation.state = {
        editingJob: {
          id: "job-1",
          title: "Senior Frontend Developer",
          company: "TechCorp",
        },
      };

      render(<JobPostingPage user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /edit job posting/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/update your job posting details/i),
      ).toBeInTheDocument();
    });

    it("should render all form sections", () => {
      render(<JobPostingPage user={mockUser} />);

      expect(screen.getByText(/basic information/i)).toBeInTheDocument();
      expect(screen.getByText(/job details/i)).toBeInTheDocument();
      expect(screen.getByText(/requirements/i)).toBeInTheDocument();
      expect(screen.getByText(/benefits/i)).toBeInTheDocument();
      expect(screen.getByText(/preview/i)).toBeInTheDocument();
    });

    it("should have step navigation", () => {
      render(<JobPostingPage user={mockUser} />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
      expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show validation errors for required fields", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      const submitButton = screen.getByRole("button", { name: /next/i });
      await user.click(submitButton);

      expect(screen.getByText(/job title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/company is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
    });

    it("should validate email format", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      const emailInput = screen.getByLabelText(/contact email/i);
      await user.type(emailInput, "invalid-email");

      const submitButton = screen.getByRole("button", { name: /next/i });
      await user.click(submitButton);

      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    it("should validate salary range", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Navigate to job details step
      await user.click(screen.getByText(/job details/i));

      const minSalaryInput = screen.getByLabelText(/minimum salary/i);
      const maxSalaryInput = screen.getByLabelText(/maximum salary/i);

      await user.type(minSalaryInput, "100000");
      await user.type(maxSalaryInput, "80000");

      const submitButton = screen.getByRole("button", { name: /next/i });
      await user.click(submitButton);

      expect(
        screen.getByText(/maximum salary must be greater than minimum/i),
      ).toBeInTheDocument();
    });

    it("should validate description length", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Navigate to job details step
      await user.click(screen.getByText(/job details/i));

      const descriptionInput = screen.getByLabelText(/job description/i);
      await user.type(descriptionInput, "Too short");

      const submitButton = screen.getByRole("button", { name: /next/i });
      await user.click(submitButton);

      expect(
        screen.getByText(/description must be at least 100 characters/i),
      ).toBeInTheDocument();
    });
  });

  describe("Step Navigation", () => {
    it("should navigate between steps", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Fill required fields in step 1
      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");

      // Navigate to step 2
      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument();
      expect(screen.getByText(/job description/i)).toBeInTheDocument();
    });

    it("should prevent navigation with invalid data", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Try to navigate without filling required fields
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Should stay on step 1
      expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
    });

    it("should allow navigation back", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Fill required fields and navigate forward
      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Navigate back
      await user.click(screen.getByRole("button", { name: /back/i }));

      expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
    });

    it("should show progress indicator", () => {
      render(<JobPostingPage user={mockUser} />);

      const progressBars = screen.getAllByRole("progressbar");
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe("AI-Powered Features", () => {
    it("should generate job description with AI", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      mockGenerateJobDescription.mockResolvedValue(
        "Generated job description...",
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");

      // Navigate to job details step
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Click AI generate button
      const generateButton = screen.getByRole("button", {
        name: /generate with ai/i,
      });
      await user.click(generateButton);

      expect(mockGenerateJobDescription).toHaveBeenCalledWith({
        title: "Developer",
        company: "TechCorp",
        location: "Amsterdam",
      });

      await waitFor(() => {
        expect(
          screen.getByDisplayValue(/generated job description/i),
        ).toBeInTheDocument();
      });
    });

    it("should handle AI generation errors", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      mockGenerateJobDescription.mockRejectedValue(
        new Error("AI service unavailable"),
      );

      // Fill required fields and navigate to step 2
      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Try to generate with AI
      const generateButton = screen.getByRole("button", {
        name: /generate with ai/i,
      });
      await user.click(generateButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "AI Generation Failed",
          variant: "destructive",
        }),
      );
    });

    it("should suggest requirements based on job title", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Fill job title with "React Developer"
      await user.type(screen.getByLabelText(/job title/i), "React Developer");

      // Navigate to requirements step
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Should show suggested requirements
      expect(screen.getByText(/suggested requirements/i)).toBeInTheDocument();
      expect(screen.getByText(/react/i)).toBeInTheDocument();
      expect(screen.getByText(/javascript/i)).toBeInTheDocument();
    });
  });

  describe("Dynamic Form Fields", () => {
    it("should add and remove requirements", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Navigate to requirements step
      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Add requirement
      const addButton = screen.getByRole("button", {
        name: /add requirement/i,
      });
      await user.click(addButton);

      const requirementInputs = screen.getAllByLabelText(/requirement/i);
      await user.type(requirementInputs[0], "React experience");

      // Add another requirement
      await user.click(addButton);
      await user.type(requirementInputs[1], "TypeScript knowledge");

      // Remove a requirement
      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      await user.click(removeButtons[0]);

      expect(screen.getAllByLabelText(/requirement/i)).toHaveLength(1);
    });

    it("should add and remove benefits", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Navigate to benefits step
      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Add benefit
      const addButton = screen.getByRole("button", { name: /add benefit/i });
      await user.click(addButton);

      const benefitInputs = screen.getAllByLabelText(/benefit/i);
      await user.type(benefitInputs[0], "Health insurance");

      expect(screen.getByDisplayValue(/health insurance/i)).toBeInTheDocument();
    });

    it("should handle predefined benefit selection", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Navigate to benefits step
      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Select predefined benefits
      const healthInsuranceCheckbox = screen.getByRole("checkbox", {
        name: /health insurance/i,
      });
      await user.click(healthInsuranceCheckbox);

      const remoteWorkCheckbox = screen.getByRole("checkbox", {
        name: /remote work/i,
      });
      await user.click(remoteWorkCheckbox);

      expect(healthInsuranceCheckbox).toBeChecked();
      expect(remoteWorkCheckbox).toBeChecked();
    });
  });

  describe("Job Preview", () => {
    it("should show job preview with all entered data", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Fill all required fields through steps
      await user.type(
        screen.getByLabelText(/job title/i),
        "Senior React Developer",
      );
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam, NL");
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Job details
      await user.type(
        screen.getByLabelText(/job description/i),
        "We are looking for an experienced React developer to join our team. This role involves building modern web applications with React, TypeScript, and other cutting-edge technologies.",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Navigate to preview
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Should show preview with entered data
      expect(screen.getByText(/senior react developer/i)).toBeInTheDocument();
      expect(screen.getByText(/techcorp/i)).toBeInTheDocument();
      expect(screen.getByText(/amsterdam, nl/i)).toBeInTheDocument();
      expect(
        screen.getByText(/experienced react developer/i),
      ).toBeInTheDocument();
    });

    it("should handle preview mode toggle", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Navigate to preview step
      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Toggle preview modes
      const desktopPreview = screen.getByRole("button", { name: /desktop/i });
      const mobilePreview = screen.getByRole("button", { name: /mobile/i });

      await user.click(mobilePreview);
      expect(mobilePreview).toHaveAttribute("aria-pressed", "true");

      await user.click(desktopPreview);
      expect(desktopPreview).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Job Submission", () => {
    it("should create new job successfully", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Fill all required fields
      await user.type(
        screen.getByLabelText(/job title/i),
        "Senior React Developer",
      );
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam, NL");
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Add description
      await user.type(
        screen.getByLabelText(/job description/i),
        "We are looking for an experienced React developer to join our team and work on exciting projects.",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Submit as draft
      const saveDraftButton = screen.getByRole("button", {
        name: /save as draft/i,
      });
      await user.click(saveDraftButton);

      expect(mockSetJobs).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Job Saved as Draft",
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/job-management");
    });

    it("should publish job immediately", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Fill all required fields and navigate to preview
      await user.type(
        screen.getByLabelText(/job title/i),
        "Senior React Developer",
      );
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam, NL");
      await user.click(screen.getByRole("button", { name: /next/i }));

      await user.type(
        screen.getByLabelText(/job description/i),
        "We are looking for an experienced React developer to join our team and work on exciting projects.",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Publish job
      const publishButton = screen.getByRole("button", {
        name: /publish job/i,
      });
      await user.click(publishButton);

      expect(mockSetJobs).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Job Published Successfully",
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/job-management");
    });

    it("should update existing job", async () => {
      const user = userEvent.setup();

      // Set up editing mode
      mockLocation.state = {
        editingJob: {
          id: "job-1",
          title: "Senior Frontend Developer",
          company: "TechCorp",
          location: "Amsterdam, NL",
          description: "Original description...",
          status: "published",
        },
      };

      render(<JobPostingPage user={mockUser} />);

      // Modify the title
      const titleInput = screen.getByDisplayValue(/senior frontend developer/i);
      await user.clear(titleInput);
      await user.type(titleInput, "Senior React Developer");

      // Navigate to preview and update
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      const updateButton = screen.getByRole("button", {
        name: /update job/i,
      });
      await user.click(updateButton);

      expect(mockSetJobs).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Job Updated Successfully",
        }),
      );
    });
  });

  describe("Auto-save Functionality", () => {
    it("should auto-save form data", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Type in form fields
      await user.type(screen.getByLabelText(/job title/i), "Developer");

      // Wait for auto-save
      await waitFor(() => {
        expect(screen.getByText(/draft saved/i)).toBeInTheDocument();
      });
    });

    it("should restore form data from auto-save", () => {
      // Mock local storage with saved data
      const mockSavedData = {
        title: "Previously Saved Job",
        company: "SavedCorp",
        location: "Saved Location",
      };

      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: vi.fn(() => JSON.stringify(mockSavedData)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      });

      render(<JobPostingPage user={mockUser} />);

      expect(
        screen.getByDisplayValue(/previously saved job/i),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue(/savedcorp/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle job save errors", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Mock job setter to throw
      mockSetJobs.mockImplementation(() => {
        throw new Error("Failed to save job");
      });

      // Fill required fields and try to save
      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      const saveDraftButton = screen.getByRole("button", {
        name: /save as draft/i,
      });
      await user.click(saveDraftButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error Saving Job",
          variant: "destructive",
        }),
      );
    });

    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Mock network error for AI generation
      mockGenerateJobDescription.mockRejectedValue(new Error("Network error"));

      await user.type(screen.getByLabelText(/job title/i), "Developer");
      await user.type(screen.getByLabelText(/company/i), "TechCorp");
      await user.type(screen.getByLabelText(/location/i), "Amsterdam");
      await user.click(screen.getByRole("button", { name: /next/i }));

      const generateButton = screen.getByRole("button", {
        name: /generate with ai/i,
      });
      await user.click(generateButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
        }),
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      render(<JobPostingPage user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("navigation")).toBeInTheDocument();
      expect(screen.getAllByRole("textbox")).toHaveLength(expect.any(Number));
      expect(screen.getAllByRole("button")).toHaveLength(expect.any(Number));
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      // Tab through form fields
      await user.tab();
      expect(document.activeElement?.getAttribute("name")).toBe("title");

      await user.tab();
      expect(document.activeElement?.getAttribute("name")).toBe("company");
    });

    it("should announce form errors to screen readers", async () => {
      const user = userEvent.setup();
      render(<JobPostingPage user={mockUser} />);

      const submitButton = screen.getByRole("button", { name: /next/i });
      await user.click(submitButton);

      const errorElement = screen.getByText(/job title is required/i);
      expect(errorElement).toHaveAttribute("role", "alert");
    });
  });
});
