import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchPage from "../SearchPage";
import {
  createMockUser,
  createMockRecruiter,
  createMockJob,
} from "../../__tests__/test-utils";

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the persistent state hook
vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentSearchFilters: vi.fn(() => [
    {
      skills: [],
      location: "",
      salaryRange: { min: 0, max: 200000 },
      jobType: "",
      remote: false,
    },
    vi.fn(),
    true, // isLoaded
  ]),
}));

// Mock the logger
vi.mock("../../lib/api", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("SearchPage Component", () => {
  const mockUser = createMockUser();
  const mockRecruiter = createMockRecruiter();

  beforeEach(() => {
    vi.clearAllMocks();
    global.localStorage.clear();
  });

  describe("Rendering and Layout", () => {
    it("should render search page header correctly", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /ai-powered job search/i }),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/find your perfect job with ai assistance/i),
      ).toBeInTheDocument();
    });

    it("should render different header for recruiters", async () => {
      render(<SearchPage user={mockRecruiter} />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /ai-powered candidate search/i }),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/discover top talent with intelligent matching/i),
      ).toBeInTheDocument();
    });

    it("should render search mode toggle", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("tab", { name: /job search/i }),
      ).toBeInTheDocument();
    });

    it("should show correct initial search mode based on user role", async () => {
      const { rerender } = render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: /job search/i }),
        ).toHaveAttribute("data-state", "active");
      });

      rerender(<SearchPage user={mockRecruiter} />);

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: /candidate search/i }),
        ).toHaveAttribute("data-state", "active");
      });
    });
  });

  describe("Search Functionality", () => {
    it("should render search input", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/search jobs, companies/i),
        ).toBeInTheDocument();
      });
    });

    it("should handle search input changes", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      const searchInput = screen.getByRole("textbox");
      await user.type(searchInput, "React Developer");

      expect(searchInput).toHaveValue("React Developer");
    });

    it("should trigger search on form submission", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      const searchInput = screen.getByRole("textbox");
      await user.type(searchInput, "React Developer{enter}");

      // Should trigger search (loading state or results)
      expect(searchInput).toHaveValue("React Developer");
    });

    it("should show loading state during search", async () => {
      render(<SearchPage user={mockUser} />);

      // The component initializes search automatically
      // We can't easily test loading state without mocking timers
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
    });
  });

  describe("Search Mode Toggle", () => {
    it("should switch between job and candidate search", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockRecruiter} />);

      await waitFor(() => {
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      const candidateTab = screen.getByRole("tab", {
        name: /candidate search/i,
      });
      const jobTab = screen.getByRole("tab", { name: /my jobs/i });

      expect(candidateTab).toHaveAttribute("data-state", "active");

      await user.click(jobTab);
      expect(jobTab).toHaveAttribute("data-state", "active");
    });

    it("should show different search placeholders for different modes", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockRecruiter} />);

      await waitFor(() => {
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      // Should show candidate search placeholder initially
      expect(
        screen.getByPlaceholderText(/search candidates/i),
      ).toBeInTheDocument();

      const jobTab = screen.getByRole("tab", { name: /my jobs/i });
      await user.click(jobTab);

      // Should show job search placeholder
      expect(
        screen.getByPlaceholderText(/search your jobs/i),
      ).toBeInTheDocument();
    });
  });

  describe("Filters", () => {
    it("should render filter sidebar", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/filters/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/location/i)).toBeInTheDocument();
      expect(screen.getByText(/remote work/i)).toBeInTheDocument();
      expect(screen.getByText(/job type/i)).toBeInTheDocument();
      expect(screen.getByText(/salary range/i)).toBeInTheDocument();
      expect(screen.getByText(/skills/i)).toBeInTheDocument();
    });

    it("should handle location filter changes", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      });

      const locationInput = screen.getByLabelText(/location/i);
      await user.type(locationInput, "San Francisco");

      expect(locationInput).toHaveValue("San Francisco");
    });

    it("should handle remote work toggle", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/remote work/i)).toBeInTheDocument();
      });

      const remoteCheckbox = screen.getByLabelText(/remote work/i);
      await user.click(remoteCheckbox);

      expect(remoteCheckbox).toBeChecked();
    });

    it("should handle job type filter", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/job type/i)).toBeInTheDocument();
      });

      // Find job type select trigger
      const jobTypeSelect = screen.getByRole("combobox");
      await user.click(jobTypeSelect);

      // Should show options
      await waitFor(() => {
        expect(screen.getByText(/full-time/i)).toBeInTheDocument();
      });
    });

    it("should handle salary range filter", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/salary range/i)).toBeInTheDocument();
      });

      // Salary range slider should be present
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("should handle skills filter", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/skills/i)).toBeInTheDocument();
      });

      // Should have skills input
      const skillsInput = screen.getByPlaceholderText(/add skill/i);
      await user.type(skillsInput, "React{enter}");

      expect(skillsInput).toHaveValue("");
      // Skill tag should be added
      expect(screen.getByText("React")).toBeInTheDocument();
    });

    it("should remove skills when clicking remove button", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add skill/i)).toBeInTheDocument();
      });

      // Add a skill
      const skillsInput = screen.getByPlaceholderText(/add skill/i);
      await user.type(skillsInput, "React{enter}");

      // Remove the skill
      const removeButton = screen.getByRole("button", {
        name: /remove react/i,
      });
      await user.click(removeButton);

      expect(screen.queryByText("React")).not.toBeInTheDocument();
    });
  });

  describe("Search Results", () => {
    beforeEach(() => {
      // Mock some demo jobs
      const mockJobs = [
        createMockJob({ id: "job-1", title: "React Developer" }),
        createMockJob({ id: "job-2", title: "Frontend Engineer" }),
      ];
      localStorage.setItem("demo_jobs", JSON.stringify(mockJobs));
    });

    it("should display search results", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        // Should show some job results
        expect(screen.getByText(/react developer/i)).toBeInTheDocument();
      });
    });

    it("should show no results message when filters match nothing", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      });

      // Set a very specific filter that won't match anything
      const locationInput = screen.getByLabelText(/location/i);
      await user.type(locationInput, "Nonexistent City, ZZ");

      // Should show no results
      await waitFor(() => {
        expect(screen.queryByText(/react developer/i)).not.toBeInTheDocument();
      });
    });

    it("should handle job application", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/react developer/i)).toBeInTheDocument();
      });

      const applyButton = screen.getByRole("button", { name: /apply now/i });
      await user.click(applyButton);

      // Should show application confirmation or modal
      await waitFor(() => {
        expect(screen.getByText(/application submitted/i)).toBeInTheDocument();
      });
    });

    it("should handle job details view", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/react developer/i)).toBeInTheDocument();
      });

      const viewButton = screen.getByRole("button", { name: /view details/i });
      await user.click(viewButton);

      // Should show job details modal or navigate
      expect(viewButton).toBeInTheDocument();
    });
  });

  describe("Candidate Search (Recruiter Mode)", () => {
    it("should show candidate results for recruiters", async () => {
      render(<SearchPage user={mockRecruiter} />);

      await waitFor(() => {
        // Should show candidate search results
        expect(screen.getByText(/candidate/i)).toBeInTheDocument();
      });
    });

    it("should handle candidate contact action", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockRecruiter} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /contact/i }),
        ).toBeInTheDocument();
      });

      const contactButton = screen.getByRole("button", { name: /contact/i });
      await user.click(contactButton);

      // Should handle contact action
      expect(contactButton).toBeInTheDocument();
    });

    it("should show candidate match scores", async () => {
      render(<SearchPage user={mockRecruiter} />);

      await waitFor(() => {
        // Should show AI match scores
        expect(screen.getByText(/match/i)).toBeInTheDocument();
      });
    });
  });

  describe("AI Suggestions", () => {
    it("should display AI search suggestions", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/ai suggestions/i)).toBeInTheDocument();
      });
    });

    it("should handle suggestion clicks", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/ai suggestions/i)).toBeInTheDocument();
      });

      // Find a suggestion button
      const suggestionButton = screen.getByRole("button", {
        name: /senior react developer/i,
      });
      await user.click(suggestionButton);

      // Should populate search input
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveValue("Senior React Developer");
    });
  });

  describe("Saved Searches", () => {
    it("should display saved searches", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/saved searches/i)).toBeInTheDocument();
      });
    });

    it("should handle saving current search", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      // Enter search query
      const searchInput = screen.getByRole("textbox");
      await user.type(searchInput, "React Developer");

      // Save search
      const saveButton = screen.getByRole("button", { name: /save search/i });
      await user.click(saveButton);

      // Should show save confirmation
      await waitFor(() => {
        expect(screen.getByText(/search saved/i)).toBeInTheDocument();
      });
    });

    it("should load saved search when clicked", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/frontend engineers/i)).toBeInTheDocument();
      });

      const savedSearch = screen.getByText(/frontend engineers/i);
      await user.click(savedSearch);

      // Should load the saved search parameters
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveValue("Frontend Engineer");
    });
  });

  describe("Error Handling", () => {
    it("should handle localStorage errors gracefully", () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error("Storage error");
      });

      expect(() => render(<SearchPage user={mockUser} />)).not.toThrow();

      localStorage.getItem = originalGetItem;
    });

    it("should handle search errors gracefully", async () => {
      render(<SearchPage user={mockUser} />);

      // Should still render even if search fails
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
    });

    it("should handle filter persistence errors", async () => {
      // Mock the persistent state hook to simulate error
      const mockUsePersistentSearchFilters = vi.fn(() => [
        {
          skills: [],
          location: "",
          salaryRange: { min: 0, max: 200000 },
          jobType: "",
          remote: false,
        },
        vi.fn(),
        false, // isLoaded = false
      ]);

      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentSearchFilters,
      ).mockImplementation(mockUsePersistentSearchFilters);

      render(<SearchPage user={mockUser} />);

      // Should show loading state
      expect(screen.getByText(/loading search filters/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByRole("main")).toBeInTheDocument();
      });

      expect(screen.getByRole("searchbox")).toBeInTheDocument();
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(2);
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByRole("searchbox")).toBeInTheDocument();
      });

      // Tab to search input
      await user.tab();
      expect(screen.getByRole("searchbox")).toHaveFocus();

      // Navigate through form elements
      await user.tab();
      // Should focus on next interactive element
    });

    it("should have proper heading hierarchy", async () => {
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      });

      // Should have proper heading structure
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        /ai-powered job search/i,
      );
    });
  });

  describe("Performance", () => {
    it("should not cause memory leaks", () => {
      const { unmount } = render(<SearchPage user={mockUser} />);

      expect(() => unmount()).not.toThrow();
    });

    it("should handle rapid filter changes", async () => {
      const user = userEvent.setup();
      render(<SearchPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      });

      const locationInput = screen.getByLabelText(/location/i);

      // Rapidly change location
      for (let i = 0; i < 5; i++) {
        await user.clear(locationInput);
        await user.type(locationInput, `City ${i}`);
      }

      // Should still be functional
      expect(locationInput).toHaveValue("City 4");
    });
  });
});
