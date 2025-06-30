import express from "express";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const router = express.Router();

// Mock applications data
const mockApplications = [
  {
    id: "1",
    jobId: "1",
    candidateId: "1",
    candidateName: "John Doe",
    candidateEmail: "john.doe@email.com",
    status: "applied",
    appliedAt: new Date(Date.now() - 86400000).toISOString(),
    resumeUrl: "/files/resume-john-doe.pdf",
    coverLetter: "I am excited to apply for this position...",
    score: 85,
    notes: [],
    lastActivity: new Date().toISOString(),
  },
  {
    id: "2",
    jobId: "1",
    candidateId: "2",
    candidateName: "Jane Smith",
    candidateEmail: "jane.smith@email.com",
    status: "screening",
    appliedAt: new Date(Date.now() - 172800000).toISOString(),
    resumeUrl: "/files/resume-jane-smith.pdf",
    coverLetter: "With 5 years of experience...",
    score: 92,
    notes: [
      {
        id: "1",
        content: "Strong technical background",
        author: "Recruiter",
        createdAt: new Date().toISOString(),
      },
    ],
    lastActivity: new Date().toISOString(),
  },
  {
    id: "3",
    jobId: "2",
    candidateId: "3",
    candidateName: "Mike Johnson",
    candidateEmail: "mike.johnson@email.com",
    status: "interview",
    appliedAt: new Date(Date.now() - 259200000).toISOString(),
    resumeUrl: "/files/resume-mike-johnson.pdf",
    coverLetter: "I'm passionate about backend development...",
    score: 78,
    notes: [],
    lastActivity: new Date().toISOString(),
  },
];

// GET /api/applications - Get all applications
router.get("/", async (req, res) => {
  try {
    assert(res, "Response object must exist");

    const { jobId, status, page = 1, limit = 10 } = req.query;
    let filteredApplications = [...mockApplications];

    // Filter by job ID if provided
    if (jobId) {
      filteredApplications = filteredApplications.filter(
        (app) => app.jobId === jobId,
      );
    }

    // Filter by status if provided
    if (status) {
      filteredApplications = filteredApplications.filter(
        (app) => app.status === status,
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedApplications = filteredApplications.slice(
      startIndex,
      endIndex,
    );

    res.json({
      success: true,
      data: paginatedApplications,
      meta: {
        total: filteredApplications.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredApplications.length / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch applications",
      message: error.message,
    });
  }
});

// GET /api/applications/:id - Get single application
router.get("/:id", async (req, res) => {
  try {
    assert(req.params.id, "Application ID must be provided");

    const application = mockApplications.find(
      (app) => app.id === req.params.id,
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch application",
      message: error.message,
    });
  }
});

// POST /api/applications - Create new application
router.post("/", async (req, res) => {
  try {
    assert(req.body, "Request body must be provided");

    const newApplication = {
      id: String(mockApplications.length + 1),
      ...req.body,
      status: "applied",
      appliedAt: new Date().toISOString(),
      score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
      notes: [],
      lastActivity: new Date().toISOString(),
    };

    mockApplications.push(newApplication);

    res.status(201).json({
      success: true,
      data: newApplication,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create application",
      message: error.message,
    });
  }
});

// PUT /api/applications/:id - Update application
router.put("/:id", async (req, res) => {
  try {
    assert(req.params.id, "Application ID must be provided");
    assert(req.body, "Request body must be provided");

    const applicationIndex = mockApplications.findIndex(
      (app) => app.id === req.params.id,
    );

    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    mockApplications[applicationIndex] = {
      ...mockApplications[applicationIndex],
      ...req.body,
      lastActivity: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: mockApplications[applicationIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update application",
      message: error.message,
    });
  }
});

// PUT /api/applications/:id/status - Update application status
router.put("/:id/status", async (req, res) => {
  try {
    assert(req.params.id, "Application ID must be provided");
    assert(req.body.status, "Status must be provided");

    const applicationIndex = mockApplications.findIndex(
      (app) => app.id === req.params.id,
    );

    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    mockApplications[applicationIndex].status = req.body.status;
    mockApplications[applicationIndex].lastActivity = new Date().toISOString();

    // Add a note about status change
    if (req.body.note) {
      mockApplications[applicationIndex].notes.push({
        id: String(Date.now()),
        content: req.body.note,
        author: req.user?.name || "System",
        createdAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: mockApplications[applicationIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update application status",
      message: error.message,
    });
  }
});

// POST /api/applications/:id/notes - Add note to application
router.post("/:id/notes", async (req, res) => {
  try {
    assert(req.params.id, "Application ID must be provided");
    assert(req.body.content, "Note content must be provided");

    const applicationIndex = mockApplications.findIndex(
      (app) => app.id === req.params.id,
    );

    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    const newNote = {
      id: String(Date.now()),
      content: req.body.content,
      author: req.user?.name || "Recruiter",
      createdAt: new Date().toISOString(),
    };

    mockApplications[applicationIndex].notes.push(newNote);
    mockApplications[applicationIndex].lastActivity = new Date().toISOString();

    res.status(201).json({
      success: true,
      data: newNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to add note",
      message: error.message,
    });
  }
});

export default router;
