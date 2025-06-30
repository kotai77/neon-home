import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActivityFeedPage from "../ActivityFeedPage";
import { createMockUser } from "../../__tests__/test-utils";

// Mock the persistent state hooks
const mockSetActivities = vi.fn();

vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentActivities: vi.fn(() => [
    [
      {
        id: "activity-1",
        type: "application_received",
        title: "New Application Received",
        message: "John Doe applied for Senior Frontend Developer",
        description: "John Doe applied for Senior Frontend Developer",
        timestamp: "2024-01-16T09:00:00.000Z",
        userId: "user-1",
        jobId: "job-1",
        applicantId: "applicant-1",
        read: false,
        priority: "high",
        metadata: {
          applicantName: "John Doe",
          jobTitle: "Senior Frontend Developer",
          company: "TechCorp",
        },
      },
      {
        id: "activity-2",
        type: "job_published",
        title: "Job Published",
        message: "Backend Developer position has been published",
        description: "Backend Developer position has been published",
        timestamp: "2024-01-15T14:30:00.000Z",
        userId: "user-1",
        jobId: "job-2",
        read: true,
        priority: "medium",
        metadata: {
          jobTitle: "Backend Developer",
          company: "TechCorp",
        },
      },
      {
        id: "activity-3",
        type: "interview_scheduled",
        title: "Interview Scheduled",
        message: "Interview with Jane Smith scheduled for tomorrow",
        description: "Interview with Jane Smith scheduled for tomorrow",
        timestamp: "2024-01-14T11:15:00.000Z",
        userId: "user-1",
        applicantId: "applicant-2",
        read: false,
        priority: "high",
        metadata: {
          applicantName: "Jane Smith",
          interviewDate: "2024-01-17T10:00:00.000Z",
        },
      },
      {
        id: "activity-4",
        type: "subscription_updated",
        title: "Subscription Updated",
        message: "Your plan has been upgraded to Professional",
        description: "Your plan has been upgraded to Professional",
        timestamp: "2024-01-13T16:45:00.000Z",
        userId: "user-1",
        read: true,
        priority: "low",
        metadata: {
          oldPlan: "Basic",
          newPlan: "Professional",
        },
      },
    ],
    mockSetActivities,
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

describe("ActivityFeedPage Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  }, 10000);

  describe("Rendering and Layout", () => {
    it("should render activity feed header correctly", () => {
      render(<ActivityFeedPage user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /activity feed/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/stay updated with your latest activities/i),
      ).toBeInTheDocument();
    });

    it("should render filter controls", async () => {
      render(<ActivityFeedPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getAllByRole("combobox")).toHaveLength(2);
      });

      expect(
        screen.getByPlaceholderText(/search activities/i),
      ).toBeInTheDocument();
    }, 10000);

    it.skip("should show loading state when data is not loaded", () => {
      // Mock the hook to return loading state (third parameter is false)
      const mockHook = vi.fn().mockReturnValue([[], vi.fn(), false]);

      // Replace the mock implementation temporarily
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentActivities,
      ).mockImplementationOnce(mockHook);

      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getByText(/loading activities.../i)).toBeInTheDocument();
    });
  });

  describe("Activity Display", () => {
    it("should display activity items", () => {
      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getByText(/new application received/i)).toBeInTheDocument();
      expect(screen.getByText(/job published/i)).toBeInTheDocument();
      expect(screen.getByText(/interview scheduled/i)).toBeInTheDocument();
      expect(screen.getByText(/subscription updated/i)).toBeInTheDocument();
    });

    it("should show activity descriptions", () => {
      render(<ActivityFeedPage user={mockUser} />);

      // Look for the actual description text from mock data
      expect(
        screen.getByText(/John Doe applied for Senior Frontend Developer/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Backend Developer position has been published/i),
      ).toBeInTheDocument();
    });

    it("should display timestamps correctly", () => {
      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getAllByText(/2 days ago/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/3 days ago/i)).toBeInTheDocument();
    });

    it("should show unread indicators", () => {
      render(<ActivityFeedPage user={mockUser} />);

      const unreadItems = screen.getAllByTestId("unread-indicator");
      expect(unreadItems).toHaveLength(2); // Two unread activities
    });

    it("should display priority badges", () => {
      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getAllByText(/high/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/medium/i)).toBeInTheDocument();
      expect(screen.getByText(/low/i)).toBeInTheDocument();
    });

    it("should show activity type icons", () => {
      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getByTestId("icon-application")).toBeInTheDocument();
      expect(screen.getByTestId("icon-job")).toBeInTheDocument();
      expect(screen.getByTestId("icon-interview")).toBeInTheDocument();
      expect(screen.getByTestId("icon-subscription")).toBeInTheDocument();
    });

    it("should display empty state when no activities", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentActivities,
      ).mockReturnValue([[], vi.fn(), true]);

      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getByText(/no activities found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/your activities will appear here/i),
      ).toBeInTheDocument();
    });
  });

  describe("Filtering", () => {
    it("should filter by unread activities", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const unreadFilter = screen.getByRole("button", { name: /unread only/i });
      await user.click(unreadFilter);

      expect(screen.getByText(/new application received/i)).toBeInTheDocument();
      expect(screen.getByText(/interview scheduled/i)).toBeInTheDocument();
      expect(screen.queryByText(/job published/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/subscription updated/i),
      ).not.toBeInTheDocument();
    });

    it("should filter by priority", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const priorityFilter = screen.getByRole("combobox", {
        name: /priority/i,
      });
      await user.click(priorityFilter);
      await user.click(screen.getByText(/high priority/i));

      expect(screen.getByText(/new application received/i)).toBeInTheDocument();
      expect(screen.getByText(/interview scheduled/i)).toBeInTheDocument();
      expect(screen.queryByText(/job published/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/subscription updated/i),
      ).not.toBeInTheDocument();
    });

    it("should filter by activity type", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const typeFilter = screen.getByRole("combobox", { name: /type/i });
      await user.click(typeFilter);
      await user.click(screen.getByText(/applications/i));

      expect(screen.getByText(/new application received/i)).toBeInTheDocument();
      expect(screen.queryByText(/job published/i)).not.toBeInTheDocument();
    });

    it("should clear filters", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      // Apply filter
      const unreadFilter = screen.getByRole("button", { name: /unread only/i });
      await user.click(unreadFilter);

      // Clear filters
      const clearButton = screen.getByRole("button", {
        name: /clear filters/i,
      });
      await user.click(clearButton);

      expect(screen.getByText(/job published/i)).toBeInTheDocument();
      expect(screen.getByText(/subscription updated/i)).toBeInTheDocument();
    });
  });

  describe("Activity Actions", () => {
    it("should mark activity as read", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const markReadButtons = screen.getAllByRole("button", {
        name: /mark as read/i,
      });
      await user.click(markReadButtons[0]);

      expect(mockSetActivities).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Marked as Read",
        }),
      );
    });

    it("should mark all as read", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const markAllReadButton = screen.getByRole("button", {
        name: /mark all as read/i,
      });
      await user.click(markAllReadButton);

      expect(mockSetActivities).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "All Activities Marked as Read",
        }),
      );
    });

    it("should delete activity", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Should show confirmation
      expect(
        screen.getByRole("dialog", { name: /delete activity/i }),
      ).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", {
        name: /delete activity/i,
      });
      await user.click(confirmButton);

      expect(mockSetActivities).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Activity Deleted",
        }),
      );
    });

    it("should handle activity click navigation", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const activityItem = screen.getByText(/new application received/i);
      await user.click(activityItem);

      expect(mockNavigate).toHaveBeenCalledWith("/applications");
    });

    it("should handle job-related activity navigation", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const jobActivity = screen.getByText(/job published/i);
      await user.click(jobActivity);

      expect(mockNavigate).toHaveBeenCalledWith("/job-details/job-2");
    });
  });

  describe("Bulk Actions", () => {
    it("should select multiple activities", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it("should select all activities", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const selectAllCheckbox = screen.getByRole("checkbox", {
        name: /select all/i,
      });
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/4 selected/i)).toBeInTheDocument();
    });

    it("should bulk mark as read", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      // Select activities
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Mark as read
      const bulkReadButton = screen.getByRole("button", {
        name: /mark selected as read/i,
      });
      await user.click(bulkReadButton);

      expect(mockSetActivities).toHaveBeenCalled();
    });

    it("should bulk delete activities", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      // Select activities
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Delete selected
      const bulkDeleteButton = screen.getByRole("button", {
        name: /delete selected/i,
      });
      await user.click(bulkDeleteButton);

      const confirmButton = screen.getByRole("button", {
        name: /delete activities/i,
      });
      await user.click(confirmButton);

      expect(mockSetActivities).toHaveBeenCalled();
    });
  });

  describe("Search and Sorting", () => {
    it("should search activities", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/search activities/i);
      await user.type(searchInput, "application");

      expect(screen.getByText(/new application received/i)).toBeInTheDocument();
      expect(screen.queryByText(/job published/i)).not.toBeInTheDocument();
    });

    it("should sort activities by date", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/oldest first/i));

      // Activities should be reordered
      const activities = screen.getAllByRole("article");
      expect(activities[0]).toHaveTextContent(/subscription updated/i);
    });

    it("should sort by priority", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const sortButton = screen.getByRole("button", { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText(/priority/i));

      // High priority items should be first
      const activities = screen.getAllByRole("article");
      expect(activities[0]).toHaveTextContent(/new application received/i);
    });
  });

  describe("Activity Statistics", () => {
    it("should display activity metrics", () => {
      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getByText(/total activities/i)).toBeInTheDocument();
      expect(screen.getByText(/unread/i)).toBeInTheDocument();
      expect(screen.getByText(/high priority/i)).toBeInTheDocument();
    });

    it("should calculate metrics correctly", () => {
      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getByText("4")).toBeInTheDocument(); // total activities
      expect(screen.getByText("2")).toBeInTheDocument(); // unread
      expect(screen.getByText("2")).toBeInTheDocument(); // high priority
    });
  });

  describe("Real-time Updates", () => {
    it("should handle new activity notifications", () => {
      render(<ActivityFeedPage user={mockUser} />);

      // Simulate new activity
      const newActivity = {
        id: "activity-5",
        type: "application_received",
        title: "New Application",
        description: "New candidate applied",
        timestamp: new Date().toISOString(),
        read: false,
        priority: "high",
      };

      // Should show notification
      expect(screen.getByText(/new activity/i)).toBeInTheDocument();
    });

    it("should auto-refresh activities", async () => {
      render(<ActivityFeedPage user={mockUser} />);

      // Should call refresh periodically
      await waitFor(() => {
        expect(mockSetActivities).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle activity loading errors", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentActivities,
      ).mockImplementation(() => {
        throw new Error("Failed to load activities");
      });

      expect(() => render(<ActivityFeedPage user={mockUser} />)).not.toThrow();
    });

    it("should handle activity action errors", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      // Mock setter to throw
      mockSetActivities.mockImplementation(() => {
        throw new Error("Failed to update activity");
      });

      const markReadButtons = screen.getAllByRole("button", {
        name: /mark as read/i,
      });
      await user.click(markReadButtons[0]);

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
      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getAllByRole("article")).toHaveLength(4);
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      // Tab through activities
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("article");

      // Enter to activate
      await user.keyboard("{Enter}");
      expect(mockNavigate).toHaveBeenCalled();
    });

    it("should have proper heading hierarchy", () => {
      render(<ActivityFeedPage user={mockUser} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        expect.any(Number),
      );
    });

    it("should announce activity updates", async () => {
      const user = userEvent.setup();
      render(<ActivityFeedPage user={mockUser} />);

      const markReadButtons = screen.getAllByRole("button", {
        name: /mark as read/i,
      });
      await user.click(markReadButtons[0]);

      // Should have live region for announcements
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should virtualize long activity lists", () => {
      // Mock large activity list
      const largeActivityList = Array.from({ length: 1000 }, (_, i) => ({
        id: `activity-${i}`,
        type: "application_received",
        title: `Activity ${i}`,
        description: `Description ${i}`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: "medium",
      }));

      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentActivities,
      ).mockReturnValue([largeActivityList, vi.fn(), true]);

      render(<ActivityFeedPage user={mockUser} />);

      // Should not render all 1000 items at once
      const renderedItems = screen.getAllByRole("article");
      expect(renderedItems.length).toBeLessThan(50);
    });

    it("should handle memory cleanup", () => {
      const { unmount } = render(<ActivityFeedPage user={mockUser} />);

      expect(() => unmount()).not.toThrow();
    });
  });
});
