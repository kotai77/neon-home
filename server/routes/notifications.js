import express from "express";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const router = express.Router();

// Mock notifications data
const mockNotifications = new Map();

// Sample notifications for different user types
const generateMockNotifications = (userId, userRole) => {
  const baseNotifications = [
    {
      id: `notif_${Date.now()}_1`,
      userId,
      type: "system",
      priority: "medium",
      title: "Welcome to Skillmatch!",
      message:
        "Your account has been successfully created. Complete your profile to get better job matches.",
      actionUrl: "/profile",
      actionLabel: "Complete Profile",
      metadata: { source: "onboarding" },
      read: false,
      archived: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      readAt: null,
    },
    {
      id: `notif_${Date.now()}_2`,
      userId,
      type: "ai_insight",
      priority: "low",
      title: "AI Profile Analysis Complete",
      message:
        "Your profile has been analyzed by our AI. We found 3 skill recommendations to improve your match score.",
      actionUrl: "/profile",
      actionLabel: "View Insights",
      metadata: { skillSuggestions: ["React", "TypeScript", "Node.js"] },
      read: true,
      archived: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      readAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: `notif_${Date.now()}_3`,
      userId,
      type: "billing",
      priority: "high",
      title: "Payment Method Update Required",
      message:
        "Your payment method will expire soon. Please update your billing information to avoid service interruption.",
      actionUrl: "/billing",
      actionLabel: "Update Payment",
      metadata: { expiryDate: "2024-02-28" },
      read: false,
      archived: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      readAt: null,
    },
  ];

  if (userRole === "recruiter") {
    return [
      ...baseNotifications,
      {
        id: `notif_${Date.now()}_4`,
        userId,
        type: "job_application",
        priority: "high",
        title: "New Application Received",
        message:
          "Sarah Johnson applied for Senior React Developer position. AI match score: 94%",
        actionUrl: "/jobs/123/applications",
        actionLabel: "Review Application",
        metadata: {
          jobTitle: "Senior React Developer",
          applicantName: "Sarah Johnson",
          matchScore: 94,
          applicationId: "app_123",
        },
        read: false,
        archived: false,
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        readAt: null,
      },
      {
        id: `notif_${Date.now()}_5`,
        userId,
        type: "interview_scheduled",
        priority: "medium",
        title: "Interview Scheduled",
        message:
          "Interview with Mike Chen for Frontend Developer role scheduled for tomorrow at 2:00 PM.",
        actionUrl: "/interviews",
        actionLabel: "View Details",
        metadata: {
          candidateName: "Mike Chen",
          jobTitle: "Frontend Developer",
          interviewDate: "2024-01-26T14:00:00Z",
          interviewType: "video",
        },
        read: false,
        archived: false,
        createdAt: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
        readAt: null,
      },
      {
        id: `notif_${Date.now()}_6`,
        userId,
        type: "ai_insight",
        priority: "low",
        title: "Job Performance Analytics",
        message:
          "Your Senior React Developer job post is performing 23% better than similar positions. Consider posting similar roles.",
        actionUrl: "/analytics",
        actionLabel: "View Analytics",
        metadata: {
          jobId: "job_123",
          performanceIncrease: 23,
          suggestedActions: ["post_similar", "increase_budget"],
        },
        read: true,
        archived: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        readAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  } else {
    return [
      ...baseNotifications,
      {
        id: `notif_${Date.now()}_4`,
        userId,
        type: "job_match",
        priority: "high",
        title: "New Job Match Found!",
        message:
          "We found a perfect match: Senior Frontend Developer at TechCorp. 96% compatibility with your profile.",
        actionUrl: "/jobs/456",
        actionLabel: "View Job",
        metadata: {
          jobTitle: "Senior Frontend Developer",
          company: "TechCorp",
          matchScore: 96,
          jobId: "job_456",
        },
        read: false,
        archived: false,
        createdAt: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        readAt: null,
      },
      {
        id: `notif_${Date.now()}_5`,
        userId,
        type: "application_status",
        priority: "medium",
        title: "Application Status Update",
        message:
          "Your application for UX Designer at Creative Co. has been moved to the interview stage.",
        actionUrl: "/applications/789",
        actionLabel: "View Application",
        metadata: {
          jobTitle: "UX Designer",
          company: "Creative Co.",
          status: "interview",
          applicationId: "app_789",
        },
        read: false,
        archived: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        readAt: null,
      },
      {
        id: `notif_${Date.now()}_6`,
        userId,
        type: "profile_view",
        priority: "low",
        title: "Profile Viewed",
        message:
          "3 recruiters viewed your profile this week. Your profile is getting good visibility!",
        actionUrl: "/analytics",
        actionLabel: "View Profile Analytics",
        metadata: {
          viewCount: 3,
          period: "week",
          trend: "increasing",
        },
        read: false,
        archived: false,
        createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        readAt: null,
      },
    ];
  }
};

// Initialize mock data for a sample user
const sampleUserId = "user_demo_123";
const sampleUserRole = "applicant";
mockNotifications.set(
  sampleUserId,
  generateMockNotifications(sampleUserId, sampleUserRole),
);

// GET /api/notifications - Get user notifications
router.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "user_demo_123"; // Mock user ID
    const {
      read,
      archived = "false",
      type,
      priority,
      limit = "20",
      offset = "0",
    } = req.query;

    let notifications = mockNotifications.get(userId) || [];

    // Apply filters
    if (read !== undefined) {
      const isRead = read === "true";
      notifications = notifications.filter((n) => n.read === isRead);
    }

    if (archived !== undefined) {
      const isArchived = archived === "true";
      notifications = notifications.filter((n) => n.archived === isArchived);
    }

    if (type) {
      notifications = notifications.filter((n) => n.type === type);
    }

    if (priority) {
      notifications = notifications.filter((n) => n.priority === priority);
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const paginatedNotifications = notifications.slice(
      offsetNum,
      offsetNum + limitNum,
    );

    // Calculate unread count
    const unreadCount = notifications.filter(
      (n) => !n.read && !n.archived,
    ).length;

    res.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        pagination: {
          total: notifications.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < notifications.length,
        },
        unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
      message: error.message,
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] || "user_demo_123";

    assert(id, "Notification ID is required");

    const notifications = mockNotifications.get(userId) || [];
    const notification = notifications.find((n) => n.id === id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    notification.read = true;
    notification.readAt = new Date().toISOString();

    res.json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
      message: error.message,
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put("/read-all", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "user_demo_123";
    const notifications = mockNotifications.get(userId) || [];

    const updatedCount = notifications.filter((n) => !n.read).length;

    notifications.forEach((notification) => {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
      }
    });

    res.json({
      success: true,
      data: { updatedCount },
      message: `${updatedCount} notifications marked as read`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read",
      message: error.message,
    });
  }
});

// PUT /api/notifications/:id/archive - Archive notification
router.put("/:id/archive", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] || "user_demo_123";

    assert(id, "Notification ID is required");

    const notifications = mockNotifications.get(userId) || [];
    const notification = notifications.find((n) => n.id === id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    notification.archived = true;

    res.json({
      success: true,
      data: notification,
      message: "Notification archived",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to archive notification",
      message: error.message,
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] || "user_demo_123";

    assert(id, "Notification ID is required");

    const notifications = mockNotifications.get(userId) || [];
    const notificationIndex = notifications.findIndex((n) => n.id === id);

    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    notifications.splice(notificationIndex, 1);

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
      message: error.message,
    });
  }
});

// POST /api/notifications - Create new notification (for testing)
router.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "user_demo_123";
    const { type, priority, title, message, actionUrl, actionLabel, metadata } =
      req.body;

    assert(type, "Notification type is required");
    assert(title, "Notification title is required");
    assert(message, "Notification message is required");

    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      priority: priority || "medium",
      title,
      message,
      actionUrl,
      actionLabel,
      metadata: metadata || {},
      read: false,
      archived: false,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    let notifications = mockNotifications.get(userId) || [];
    notifications.unshift(notification); // Add to beginning for newest first
    mockNotifications.set(userId, notifications);

    res.json({
      success: true,
      data: notification,
      message: "Notification created",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create notification",
      message: error.message,
    });
  }
});

export default router;
