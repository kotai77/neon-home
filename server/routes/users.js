import express from "express";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const router = express.Router();

// Mock user data
const mockUsers = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    role: "applicant",
    avatar: "/avatars/john-doe.jpg",
    isDemo: false,
    profile: {
      phone: "+1-555-0123",
      location: "San Francisco, CA",
      experience: "5+ years",
      skills: ["React", "TypeScript", "Node.js"],
      bio: "Passionate frontend developer with a focus on user experience.",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@email.com",
    role: "recruiter",
    avatar: "/avatars/jane-smith.jpg",
    isDemo: false,
    profile: {
      phone: "+1-555-0456",
      location: "New York, NY",
      company: "Tech Corp",
      department: "Human Resources",
      bio: "Experienced talent acquisition specialist.",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/users/profile - Get current user profile
router.get("/profile", async (req, res) => {
  try {
    assert(req.user, "User must be authenticated");

    const user = mockUsers.find((u) => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch user profile",
      message: error.message,
    });
  }
});

// PUT /api/users/profile - Update current user profile
router.put("/profile", async (req, res) => {
  try {
    assert(req.user, "User must be authenticated");
    assert(req.body, "Request body must be provided");

    const userIndex = mockUsers.findIndex((u) => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: mockUsers[userIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
      message: error.message,
    });
  }
});

// GET /api/users/:id - Get user by ID (for recruiters)
router.get("/:id", async (req, res) => {
  try {
    assert(req.params.id, "User ID must be provided");

    const user = mockUsers.find((u) => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Remove sensitive information
    const publicUser = {
      ...user,
      email: user.role === "applicant" ? undefined : user.email,
    };

    res.json({
      success: true,
      data: publicUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch user",
      message: error.message,
    });
  }
});

// GET /api/users - Get users list (for admin/recruiters)
router.get("/", async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    let filteredUsers = [...mockUsers];

    // Filter by role if provided
    if (role) {
      filteredUsers = filteredUsers.filter((user) => user.role === role);
    }

    // Search by name or email
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower),
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedUsers,
      meta: {
        total: filteredUsers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredUsers.length / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message: error.message,
    });
  }
});

export default router;
