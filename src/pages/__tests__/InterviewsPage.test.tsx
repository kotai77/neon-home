import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InterviewsPage from "../InterviewsPage";
import { createMockUser } from "../../__tests__/test-utils";

// Mock the persistent state hooks
const mockSetInterviews = vi.fn();
const mockSetApplications = vi.fn();

vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentInterviews: vi.fn(() => [
    [
      {
        id: "interview-1",
        candidateId: "candidate-1",
        candidateName: "John Doe",
        candidateEmail: "john.doe@example.com",
        jobId: "job-1",
        jobTitle: "Senior Frontend Developer",
        type: "technical",
        status: "scheduled",
        scheduledDate: "2024-01-25T10:00:00.000Z",
        duration: 60,
        location: "Office",
        interviewer: "Sarah Johnson",
        interviewerEmail: "sarah@techcorp.com",
        notes: "Technical assessment for React skills",
        feedback: null,
        rating: null,
        createdDate: "2024-01-20T14:00:00.000Z",
        reminders: ["24h", "2h"],
        meetingLink: "https://meet.google.com/abc-def-ghi",
        questions: [
          "Explain React hooks",
          "How do you handle state management?",
          "Experience with TypeScript?",
        ],
      },
      {
        id: "interview-2",
        candidateId: "candidate-2",
        candidateName: "Jane Smith",
        candidateEmail: "jane.smith@example.com",
        jobId: "job-2",
        jobTitle: "UX Designer",
        type: "behavioral",
        status: "completed",
        scheduledDate: "2024-01-22T14:00:00.000Z",
        duration: 45,
        location: "Remote",
        interviewer: "Mike Wilson",
        interviewerEmail: "mike@designcorp.com",
        notes: "Cultural fit assessment",
        feedback:
          "Great communication skills, good portfolio, fits well with team culture",
        rating: 4,
        createdDate: "2024-01-18T09:00:00.000Z",
        reminders: ["24h"],
        meetingLink: "https://zoom.us/j/123456789",
        questions: [
          "Tell me about yourself",
          "Why are you interested in this role?",
          "Describe a challenging project",
        ],
      },
      {
        id: "interview-3",
        candidateId: "candidate-3",
        candidateName: "Bob Johnson",
        candidateEmail: "bob.johnson@example.com",
        jobId: "job-1",
        jobTitle: "Senior Frontend Developer",
        type: "final",
        status: "cancelled",
        scheduledDate: "2024-01-28T16:00:00.000Z",
        duration: 30,
        location: "Office",
        interviewer: "David Brown",
        interviewerEmail: "david@techcorp.com",
        notes: "Final round interview",
        feedback: null,
        rating: null,
        createdDate: "2024-01-23T11:00:00.000Z",
        reminders: ["24h", "2h"],
        meetingLink: null,
        questions: ["Salary expectations", "Start date availability"],
        cancellationReason: "Candidate accepted another offer",
      },
    ],
    mockSetInterviews,
    true,
  ]),
  usePersistentApplications: vi.fn(() => [
    [
      {
        id: "app-1",
        candidateId: "candidate-1",
        jobId: "job-1",
        status: "interviewed",
      },
      {
        id: "app-2",
        candidateId: "candidate-2",
        jobId: "job-2",
        status: "interviewed",
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

// Mock calendar
vi.mock("react-big-calendar", () => ({
  Calendar: ({ events, onSelectEvent, ...props }: any) => (
    <div data-testid="calendar" {...props}>
      {events?.map((event: any) => (
        <div
          key={event.id}
          data-testid="calendar-event"
          onClick={() => onSelectEvent?.(event)}
        >
          {event.title}
        </div>
      ))}
    </div>
  ),
  momentLocalizer: vi.fn(),
}));

// Mock moment
vi.mock("moment", () => ({
  default: vi.fn(() => ({
    format: vi.fn(() => "2024-01-25 10:00"),
    isSame: vi.fn(() => false),
    startOf: vi.fn(),
    endOf: vi.fn(),
  })),
}));

describe("InterviewsPage Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("should render interviews page header correctly", () => {
      render(<InterviewsPage user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /interviews/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/schedule and manage interviews/i),
      ).toBeInTheDocument();
    });

    it("should render view toggle buttons", () => {
      render(<InterviewsPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /calendar view/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /list view/i }),
      ).toBeInTheDocument();
    });

    it("should render schedule interview button", () => {
      render(<InterviewsPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /schedule interview/i }),
      ).toBeInTheDocument();
    });

    it("should show loading state when data is not loaded", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentInterviews,
      ).mockReturnValue([[], vi.fn(), false]);

      render(<InterviewsPage user={mockUser} />);

      expect(screen.getByText(/loading interviews/i)).toBeInTheDocument();
    });
  });

  describe("Calendar View", () => {
    it("should display calendar component", () => {
      render(<InterviewsPage user={mockUser} />);

      expect(screen.getByTestId("calendar")).toBeInTheDocument();
    });

    it("should show interviews on calendar", () => {
      render(<InterviewsPage user={mockUser} />);

      const calendarEvents = screen.getAllByTestId("calendar-event");
      expect(calendarEvents).toHaveLength(3);
      expect(calendarEvents[0]).toHaveTextContent(/john doe/i);
      expect(calendarEvents[1]).toHaveTextContent(/jane smith/i);
    });

    it("should handle calendar event click", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const calendarEvents = screen.getAllByTestId("calendar-event");
      await user.click(calendarEvents[0]);

      expect(
        screen.getByRole("dialog", { name: /interview details/i }),
      ).toBeInTheDocument();
    });

    it("should switch to list view", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      expect(screen.queryByTestId("calendar")).not.toBeInTheDocument();
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  describe("List View", () => {
    it("should display interviews table", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText(/candidate/i)).toBeInTheDocument();
      expect(screen.getByText(/job/i)).toBeInTheDocument();
      expect(screen.getByText(/date & time/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });

    it("should show interview information in table", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(
        screen.getByText(/senior frontend developer/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/technical/i)).toBeInTheDocument();
      expect(screen.getByText(/behavioral/i)).toBeInTheDocument();
    });

    it("should display status badges", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
      expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    });

    it("should handle table row click", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const tableRows = screen.getAllByRole("row");
      await user.click(tableRows[1]); // First data row

      expect(
        screen.getByRole("dialog", { name: /interview details/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Interview Filtering", () => {
    it("should filter by status", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const statusFilter = screen.getByRole("combobox", { name: /status/i });
      await user.click(statusFilter);
      await user.click(screen.getByText(/scheduled/i));

      // Should show only scheduled interviews
      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
    });

    it("should filter by interview type", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const typeFilter = screen.getByRole("combobox", { name: /type/i });
      await user.click(typeFilter);
      await user.click(screen.getByText(/technical/i));

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
    });

    it("should filter by date range", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const dateFilter = screen.getByRole("button", { name: /this week/i });
      await user.click(dateFilter);
      await user.click(screen.getByText(/next week/i));

      // Should filter interviews by date range
      expect(screen.getByTestId("calendar")).toBeInTheDocument();
    });

    it("should search interviews", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/search interviews/i);
      await user.type(searchInput, "john");

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
    });
  });

  describe("Schedule Interview", () => {
    it("should open schedule interview modal", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const scheduleButton = screen.getByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(scheduleButton);

      expect(
        screen.getByRole("dialog", { name: /schedule interview/i }),
      ).toBeInTheDocument();
    });

    it("should handle interview form submission", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const scheduleButton = screen.getByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(scheduleButton);

      // Fill form
      await user.type(
        screen.getByLabelText(/candidate name/i),
        "New Candidate",
      );
      await user.type(
        screen.getByLabelText(/candidate email/i),
        "new@example.com",
      );

      const dateInput = screen.getByLabelText(/interview date/i);
      await user.type(dateInput, "2024-02-01");

      const timeInput = screen.getByLabelText(/interview time/i);
      await user.type(timeInput, "14:00");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(submitButton);

      expect(mockSetInterviews).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Interview Scheduled",
        }),
      );
    });

    it("should validate required fields", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const scheduleButton = screen.getByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(scheduleButton);

      // Try to submit without filling required fields
      const submitButton = screen.getByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText(/candidate name is required/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/interview date is required/i),
      ).toBeInTheDocument();
    });

    it("should handle interview type selection", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const scheduleButton = screen.getByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(scheduleButton);

      const typeSelect = screen.getByRole("combobox", { name: /type/i });
      await user.click(typeSelect);
      await user.click(screen.getByText(/technical/i));

      expect(typeSelect).toHaveValue("technical");
    });
  });

  describe("Interview Details Modal", () => {
    it("should display complete interview information", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const tableRows = screen.getAllByRole("row");
      await user.click(tableRows[1]);

      expect(screen.getByText(/technical interview/i)).toBeInTheDocument();
      expect(screen.getByText(/sarah johnson/i)).toBeInTheDocument();
      expect(screen.getByText(/office/i)).toBeInTheDocument();
      expect(screen.getByText(/60 minutes/i)).toBeInTheDocument();
    });

    it("should show interview questions", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const tableRows = screen.getAllByRole("row");
      await user.click(tableRows[1]);

      expect(screen.getByText(/explain react hooks/i)).toBeInTheDocument();
      expect(
        screen.getByText(/how do you handle state management/i),
      ).toBeInTheDocument();
    });

    it("should display meeting link for remote interviews", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const tableRows = screen.getAllByRole("row");
      await user.click(tableRows[1]);

      expect(
        screen.getByText(/https:\/\/meet\.google\.com/i),
      ).toBeInTheDocument();
    });

    it("should handle interview actions", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const tableRows = screen.getAllByRole("row");
      await user.click(tableRows[1]);

      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reschedule/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Interview Actions", () => {
    it("should handle interview completion", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const completeButtons = screen.getAllByRole("button", {
        name: /complete/i,
      });
      await user.click(completeButtons[0]);

      expect(
        screen.getByRole("dialog", { name: /complete interview/i }),
      ).toBeInTheDocument();
    });

    it("should handle feedback submission", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const completeButtons = screen.getAllByRole("button", {
        name: /complete/i,
      });
      await user.click(completeButtons[0]);

      const feedbackTextarea = screen.getByLabelText(/feedback/i);
      await user.type(feedbackTextarea, "Great interview, strong candidate");

      const ratingSelect = screen.getByLabelText(/rating/i);
      await user.click(ratingSelect);
      await user.click(screen.getByText(/5 stars/i));

      const submitButton = screen.getByRole("button", {
        name: /submit feedback/i,
      });
      await user.click(submitButton);

      expect(mockSetInterviews).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Interview Completed",
        }),
      );
    });

    it("should handle interview cancellation", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const cancelButtons = screen.getAllByRole("button", {
        name: /cancel/i,
      });
      await user.click(cancelButtons[0]);

      expect(
        screen.getByRole("dialog", { name: /cancel interview/i }),
      ).toBeInTheDocument();

      const reasonTextarea = screen.getByLabelText(/reason/i);
      await user.type(reasonTextarea, "Candidate is no longer available");

      const confirmButton = screen.getByRole("button", {
        name: /cancel interview/i,
      });
      await user.click(confirmButton);

      expect(mockSetInterviews).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Interview Cancelled",
        }),
      );
    });

    it("should handle interview rescheduling", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const rescheduleButtons = screen.getAllByRole("button", {
        name: /reschedule/i,
      });
      await user.click(rescheduleButtons[0]);

      expect(
        screen.getByRole("dialog", { name: /reschedule interview/i }),
      ).toBeInTheDocument();

      const newDateInput = screen.getByLabelText(/new date/i);
      await user.type(newDateInput, "2024-02-01");

      const newTimeInput = screen.getByLabelText(/new time/i);
      await user.type(newTimeInput, "15:00");

      const confirmButton = screen.getByRole("button", {
        name: /reschedule/i,
      });
      await user.click(confirmButton);

      expect(mockSetInterviews).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Interview Rescheduled",
        }),
      );
    });
  });

  describe("Interview Statistics", () => {
    it("should display interview metrics", () => {
      render(<InterviewsPage user={mockUser} />);

      expect(screen.getByText(/total interviews/i)).toBeInTheDocument();
      expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
      expect(screen.getByText(/completion rate/i)).toBeInTheDocument();
    });

    it("should calculate metrics correctly", () => {
      render(<InterviewsPage user={mockUser} />);

      expect(screen.getByText("3")).toBeInTheDocument(); // total
      expect(screen.getByText("1")).toBeInTheDocument(); // scheduled
      expect(screen.getByText("1")).toBeInTheDocument(); // completed
      expect(screen.getByText("33%")).toBeInTheDocument(); // completion rate
    });
  });

  describe("Reminders and Notifications", () => {
    it("should display upcoming interviews", () => {
      render(<InterviewsPage user={mockUser} />);

      expect(screen.getByText(/upcoming interviews/i)).toBeInTheDocument();
      expect(screen.getByText(/today/i)).toBeInTheDocument();
      expect(screen.getByText(/this week/i)).toBeInTheDocument();
    });

    it("should handle reminder settings", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const scheduleButton = screen.getByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(scheduleButton);

      const reminderCheckbox = screen.getByRole("checkbox", {
        name: /24 hour reminder/i,
      });
      await user.click(reminderCheckbox);

      expect(reminderCheckbox).toBeChecked();
    });
  });

  describe("Error Handling", () => {
    it("should handle interview loading errors", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentInterviews,
      ).mockImplementation(() => {
        throw new Error("Failed to load interviews");
      });

      expect(() => render(<InterviewsPage user={mockUser} />)).not.toThrow();
    });

    it("should handle interview action errors", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      // Mock setter to throw
      mockSetInterviews.mockImplementation(() => {
        throw new Error("Failed to update interview");
      });

      const scheduleButton = screen.getByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(scheduleButton);

      // Fill and submit form
      await user.type(
        screen.getByLabelText(/candidate name/i),
        "Test Candidate",
      );
      await user.type(
        screen.getByLabelText(/candidate email/i),
        "test@example.com",
      );

      const submitButton = screen.getByRole("button", {
        name: /schedule interview/i,
      });
      await user.click(submitButton);

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
      render(<InterviewsPage user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(expect.any(Number));
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      // Switch to list view for keyboard testing
      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      // Tab through table rows
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("row");

      // Enter to view details
      await user.keyboard("{Enter}");
      expect(
        screen.getByRole("dialog", { name: /interview details/i }),
      ).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      render(<InterviewsPage user={mockUser} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        expect.any(Number),
      );
    });

    it("should announce status changes", async () => {
      const user = userEvent.setup();
      render(<InterviewsPage user={mockUser} />);

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      const completeButtons = screen.getAllByRole("button", {
        name: /complete/i,
      });
      await user.click(completeButtons[0]);

      // Should have live region for announcements
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle large interview lists efficiently", () => {
      // Mock large interview list
      const largeInterviewList = Array.from({ length: 1000 }, (_, i) => ({
        id: `interview-${i}`,
        candidateName: `Candidate ${i}`,
        jobTitle: `Job ${i}`,
        scheduledDate: new Date().toISOString(),
        status: "scheduled",
        type: "technical",
      }));

      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentInterviews,
      ).mockReturnValue([largeInterviewList, vi.fn(), true]);

      render(<InterviewsPage user={mockUser} />);

      // Should handle large datasets without performance issues
      expect(screen.getByTestId("calendar")).toBeInTheDocument();
    });

    it("should handle memory cleanup", () => {
      const { unmount } = render(<InterviewsPage user={mockUser} />);

      expect(() => unmount()).not.toThrow();
    });
  });
});
