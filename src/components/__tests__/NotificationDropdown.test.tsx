import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationDropdown from "../NotificationDropdown";
import { createMockUser } from "../../__tests__/test-utils";

// Mock the persistent state hooks
const mockSetNotifications = vi.fn();

vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentNotifications: vi.fn(() => [
    [
      {
        id: "notif-1",
        type: "application_received",
        title: "New Application",
        message: "John Doe applied for Senior Frontend Developer",
        timestamp: "2024-01-16T09:00:00.000Z",
        read: false,
        priority: "high",
        actionUrl: "/applications/app-1",
        metadata: {
          candidateName: "John Doe",
          jobTitle: "Senior Frontend Developer",
          applicationId: "app-1",
        },
      },
      {
        id: "notif-2",
        type: "interview_scheduled",
        title: "Interview Scheduled",
        message: "Interview with Jane Smith scheduled for tomorrow at 2 PM",
        timestamp: "2024-01-15T14:30:00.000Z",
        read: false,
        priority: "medium",
        actionUrl: "/interviews/interview-1",
        metadata: {
          candidateName: "Jane Smith",
          interviewDate: "2024-01-17T14:00:00.000Z",
          interviewId: "interview-1",
        },
      },
      {
        id: "notif-3",
        type: "job_published",
        title: "Job Published",
        message: "Backend Developer position has been published successfully",
        timestamp: "2024-01-14T11:15:00.000Z",
        read: true,
        priority: "low",
        actionUrl: "/job-details/job-2",
        metadata: {
          jobTitle: "Backend Developer",
          jobId: "job-2",
        },
      },
      {
        id: "notif-4",
        type: "subscription_reminder",
        title: "Subscription Expiring",
        message: "Your Professional plan expires in 7 days",
        timestamp: "2024-01-13T16:45:00.000Z",
        read: true,
        priority: "high",
        actionUrl: "/billing",
        metadata: {
          planName: "Professional",
          expiryDate: "2024-01-20T00:00:00.000Z",
        },
      },
      {
        id: "notif-5",
        type: "system_update",
        title: "System Update",
        message: "New features have been added to the platform",
        timestamp: "2024-01-12T09:00:00.000Z",
        read: false,
        priority: "low",
        actionUrl: "/updates",
        metadata: {
          version: "2.1.0",
          features: ["Enhanced search", "Improved analytics"],
        },
      },
    ],
    mockSetNotifications,
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
}));

describe("NotificationDropdown Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("should render notification trigger button", () => {
      render(<NotificationDropdown user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /notifications/i }),
      ).toBeInTheDocument();
    });

    it("should display unread count badge", () => {
      render(<NotificationDropdown user={mockUser} />);

      expect(screen.getByText("3")).toBeInTheDocument(); // 3 unread notifications
    });

    it("should hide badge when no unread notifications", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentNotifications,
      ).mockReturnValue([
        [
          {
            id: "notif-1",
            read: true,
          },
        ],
        vi.fn(),
        true,
      ]);

      render(<NotificationDropdown user={mockUser} />);

      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });

    it("should show loading state when notifications are loading", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentNotifications,
      ).mockReturnValue([[], vi.fn(), false]);

      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      fireEvent.click(triggerButton);

      expect(screen.getByText(/loading notifications/i)).toBeInTheDocument();
    });
  });

  describe("Dropdown Content", () => {
    it("should open dropdown on button click", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      expect(
        screen.getByRole("menu", { name: /notifications/i }),
      ).toBeInTheDocument();
    });

    it("should display notification items", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      expect(screen.getByText(/new application/i)).toBeInTheDocument();
      expect(screen.getByText(/interview scheduled/i)).toBeInTheDocument();
      expect(screen.getByText(/job published/i)).toBeInTheDocument();
    });

    it("should show notification messages", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      expect(
        screen.getByText(/john doe applied for senior frontend developer/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/interview with jane smith scheduled/i),
      ).toBeInTheDocument();
    });

    it("should display timestamps", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
      expect(screen.getByText(/3 days ago/i)).toBeInTheDocument();
    });

    it("should show priority indicators", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      expect(screen.getByTestId("high-priority-indicator")).toBeInTheDocument();
      expect(
        screen.getByTestId("medium-priority-indicator"),
      ).toBeInTheDocument();
    });

    it("should display unread indicators", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const unreadIndicators = screen.getAllByTestId("unread-indicator");
      expect(unreadIndicators).toHaveLength(3); // 3 unread notifications
    });

    it("should show notification type icons", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      expect(screen.getByTestId("application-icon")).toBeInTheDocument();
      expect(screen.getByTestId("interview-icon")).toBeInTheDocument();
      expect(screen.getByTestId("job-icon")).toBeInTheDocument();
      expect(screen.getByTestId("subscription-icon")).toBeInTheDocument();
      expect(screen.getByTestId("system-icon")).toBeInTheDocument();
    });
  });

  describe("Notification Actions", () => {
    it("should mark notification as read on click", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const notificationItem = screen.getByText(/new application/i);
      await user.click(notificationItem);

      expect(mockSetNotifications).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/applications/app-1");
    });

    it("should handle notification click navigation", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const interviewNotification = screen.getByText(/interview scheduled/i);
      await user.click(interviewNotification);

      expect(mockNavigate).toHaveBeenCalledWith("/interviews/interview-1");
    });

    it("should mark individual notification as read", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const markReadButtons = screen.getAllByRole("button", {
        name: /mark as read/i,
      });
      await user.click(markReadButtons[0]);

      expect(mockSetNotifications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Notification marked as read",
        }),
      );
    });

    it("should delete notification", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete/i,
      });
      await user.click(deleteButtons[0]);

      expect(mockSetNotifications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Notification deleted",
        }),
      );
    });
  });

  describe("Bulk Actions", () => {
    it("should display mark all as read button", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      expect(
        screen.getByRole("button", { name: /mark all as read/i }),
      ).toBeInTheDocument();
    });

    it("should mark all notifications as read", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const markAllButton = screen.getByRole("button", {
        name: /mark all as read/i,
      });
      await user.click(markAllButton);

      expect(mockSetNotifications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "All notifications marked as read",
        }),
      );
    });

    it("should clear all notifications", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const clearAllButton = screen.getByRole("button", {
        name: /clear all/i,
      });
      await user.click(clearAllButton);

      // Should show confirmation
      expect(
        screen.getByRole("dialog", { name: /clear notifications/i }),
      ).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", {
        name: /clear all/i,
      });
      await user.click(confirmButton);

      expect(mockSetNotifications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "All notifications cleared",
        }),
      );
    });
  });

  describe("Filtering and Sorting", () => {
    it("should display filter options", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      expect(screen.getByText(/all notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/unread only/i)).toBeInTheDocument();
      expect(screen.getByText(/high priority/i)).toBeInTheDocument();
    });

    it("should filter by unread notifications", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const unreadFilter = screen.getByRole("button", { name: /unread only/i });
      await user.click(unreadFilter);

      expect(screen.getByText(/new application/i)).toBeInTheDocument();
      expect(screen.getByText(/interview scheduled/i)).toBeInTheDocument();
      expect(screen.queryByText(/job published/i)).not.toBeInTheDocument();
    });

    it("should filter by priority", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const priorityFilter = screen.getByRole("button", {
        name: /high priority/i,
      });
      await user.click(priorityFilter);

      expect(screen.getByText(/new application/i)).toBeInTheDocument();
      expect(screen.getByText(/subscription expiring/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/interview scheduled/i),
      ).not.toBeInTheDocument();
    });

    it("should sort notifications by date", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      // Notifications should be sorted by newest first by default
      const notificationItems = screen.getAllByRole("menuitem");
      expect(notificationItems[0]).toHaveTextContent(/new application/i);
      expect(notificationItems[1]).toHaveTextContent(/interview scheduled/i);
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no notifications", async () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentNotifications,
      ).mockReturnValue([[], vi.fn(), true]);

      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/you're all caught up/i)).toBeInTheDocument();
    });

    it("should display empty state when all filtered out", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      // Filter to show only notifications that don't exist
      const priorityFilter = screen.getByRole("combobox", {
        name: /priority/i,
      });
      await user.click(priorityFilter);
      await user.click(screen.getByText(/critical/i));

      expect(screen.getByText(/no notifications match/i)).toBeInTheDocument();
    });
  });

  describe("Real-time Updates", () => {
    it("should update notification count when new notifications arrive", () => {
      const { rerender } = render(<NotificationDropdown user={mockUser} />);

      // Simulate new notification
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentNotifications,
      ).mockReturnValue([
        [
          {
            id: "notif-new",
            title: "New Notification",
            read: false,
          },
          ...require("../../hooks/usePersistentState").usePersistentNotifications()[0],
        ],
        vi.fn(),
        true,
      ]);

      rerender(<NotificationDropdown user={mockUser} />);

      expect(screen.getByText("4")).toBeInTheDocument(); // Updated count
    });

    it("should show notification animation for new items", async () => {
      render(<NotificationDropdown user={mockUser} />);

      // Simulate new notification with animation
      const newNotification = {
        id: "notif-new",
        title: "Just Arrived",
        timestamp: new Date().toISOString(),
        read: false,
        isNew: true,
      };

      // Should have animation class
      expect(screen.getByTestId("notification-item-new")).toHaveClass(
        "animate-bounce",
      );
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support keyboard navigation through notifications", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      // Tab through notifications
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("menuitem");

      // Arrow key navigation
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement?.getAttribute("role")).toBe("menuitem");
    });

    it("should handle escape key to close dropdown", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      await user.keyboard("{Escape}");

      expect(
        screen.queryByRole("menu", { name: /notifications/i }),
      ).not.toBeInTheDocument();
    });

    it("should handle enter key to activate notification", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      await user.tab(); // Focus first notification
      await user.keyboard("{Enter}");

      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle notification loading errors", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentNotifications,
      ).mockImplementation(() => {
        throw new Error("Failed to load notifications");
      });

      expect(() =>
        render(<NotificationDropdown user={mockUser} />),
      ).not.toThrow();
    });

    it("should handle notification action errors", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      // Mock setter to throw
      mockSetNotifications.mockImplementation(() => {
        throw new Error("Failed to update notification");
      });

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

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
      render(<NotificationDropdown user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /notifications/i }),
      ).toHaveAttribute("aria-label", "Notifications");
    });

    it("should announce unread count to screen readers", () => {
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      expect(triggerButton).toHaveAttribute(
        "aria-label",
        "Notifications, 3 unread",
      );
    });

    it("should have proper focus management", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      // Focus should be on first notification item
      expect(document.activeElement?.getAttribute("role")).toBe("menuitem");
    });

    it("should announce notification updates", async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      const markAllButton = screen.getByRole("button", {
        name: /mark all as read/i,
      });
      await user.click(markAllButton);

      // Should have live region for announcements
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle large notification lists efficiently", () => {
      // Mock large notification list
      const largeNotificationList = Array.from({ length: 1000 }, (_, i) => ({
        id: `notif-${i}`,
        title: `Notification ${i}`,
        message: `Message ${i}`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: "medium",
      }));

      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentNotifications,
      ).mockReturnValue([largeNotificationList, vi.fn(), true]);

      render(<NotificationDropdown user={mockUser} />);

      // Should show badge with correct count
      expect(screen.getByText("999+")).toBeInTheDocument();
    });

    it("should virtualize long notification lists", async () => {
      const user = userEvent.setup();

      // Mock large notification list
      const largeNotificationList = Array.from({ length: 100 }, (_, i) => ({
        id: `notif-${i}`,
        title: `Notification ${i}`,
        message: `Message ${i}`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: "medium",
      }));

      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentNotifications,
      ).mockReturnValue([largeNotificationList, vi.fn(), true]);

      render(<NotificationDropdown user={mockUser} />);

      const triggerButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(triggerButton);

      // Should not render all 100 notifications at once
      const renderedNotifications = screen.getAllByRole("menuitem");
      expect(renderedNotifications.length).toBeLessThan(50);
    });

    it("should handle memory cleanup", () => {
      const { unmount } = render(<NotificationDropdown user={mockUser} />);

      expect(() => unmount()).not.toThrow();
    });
  });
});
