import express from "express";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const router = express.Router();

// Mock data for now - would normally come from database
const mockJobs = [
  {
    id: "1",
    recruiterId: "recruiter-1",
    title: "Senior Frontend Developer",
    company: "Tech Corp",
    location: "San Francisco, CA",
    type: "full-time",
    remote: true,
    status: "published",
    description: "Looking for an experienced frontend developer...",
    requirements: ["React", "TypeScript", "5+ years experience"],
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
    salary: { min: 120000, max: 180000, currency: "USD" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    recruiterId: "recruiter-2",
    title: "Backend Engineer",
    company: "Startup Inc",
    location: "Remote",
    type: "full-time",
    remote: true,
    status: "published",
    description: "Join our growing team...",
    requirements: ["Node.js", "Python", "3+ years experience"],
    skills: ["Node.js", "Python", "JavaScript", "MongoDB", "Express"],
    salary: { min: 100000, max: 150000, currency: "USD" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/jobs - Get all jobs
router.get("/", async (req, res) => {
  try {
    assert(res, "Response object must exist");

    res.json({
      success: true,
      data: mockJobs,
      meta: {
        total: mockJobs.length,
        page: 1,
        limit: 10,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch jobs",
      message: error.message,
    });
  }
});

// GET /api/jobs/:id - Get single job
router.get("/:id", async (req, res) => {
  try {
    assert(req.params.id, "Job ID must be provided");

    const job = mockJobs.find((j) => j.id === req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch job",
      message: error.message,
    });
  }
});

// POST /api/jobs - Create new job
router.post("/", async (req, res) => {
  try {
    assert(req.body, "Request body must be provided");

    const newJob = {
      id: String(mockJobs.length + 1),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockJobs.push(newJob);

    res.status(201).json({
      success: true,
      data: newJob,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create job",
      message: error.message,
    });
  }
});

// PUT /api/jobs/:id - Update job
router.put("/:id", async (req, res) => {
  try {
    assert(req.params.id, "Job ID must be provided");
    assert(req.body, "Request body must be provided");

    const jobIndex = mockJobs.findIndex((j) => j.id === req.params.id);

    if (jobIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    mockJobs[jobIndex] = {
      ...mockJobs[jobIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: mockJobs[jobIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update job",
      message: error.message,
    });
  }
});

// DELETE /api/jobs/:id - Delete job
router.delete("/:id", async (req, res) => {
  try {
    assert(req.params.id, "Job ID must be provided");

    const jobIndex = mockJobs.findIndex((j) => j.id === req.params.id);

    if (jobIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    mockJobs.splice(jobIndex, 1);

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete job",
      message: error.message,
    });
  }
});

export default router;
