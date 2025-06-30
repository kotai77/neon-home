import express from "express";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const router = express.Router();

// Mock analytics data
const mockAnalytics = {
  dashboard: {
    totalJobs: 156,
    totalApplications: 892,
    totalCandidates: 1247,
    activeJobs: 23,
    pendingApplications: 45,
    interviewsScheduled: 12,
    hireRate: 0.15,
    averageTimeToHire: 18,
    topSources: [
      { name: "LinkedIn", applications: 234 },
      { name: "Indeed", applications: 189 },
      { name: "Company Website", applications: 156 },
      { name: "Referrals", applications: 98 },
    ],
    applicationTrends: [
      { date: "2024-01-01", applications: 45 },
      { date: "2024-01-02", applications: 52 },
      { date: "2024-01-03", applications: 38 },
      { date: "2024-01-04", applications: 61 },
      { date: "2024-01-05", applications: 49 },
      { date: "2024-01-06", applications: 44 },
      { date: "2024-01-07", applications: 56 },
    ],
    statusBreakdown: {
      applied: 456,
      screening: 234,
      interview: 123,
      offer: 45,
      hired: 34,
    },
  },
  performance: {
    jobPerformance: [
      {
        jobId: "1",
        title: "Senior Frontend Developer",
        views: 234,
        applications: 45,
        conversionRate: 0.19,
      },
      {
        jobId: "2",
        title: "Backend Engineer",
        views: 189,
        applications: 32,
        conversionRate: 0.17,
      },
    ],
    recruiterStats: {
      totalJobsPosted: 23,
      totalApplicationsReceived: 456,
      averageResponseTime: 2.5,
      interviewCompletionRate: 0.85,
    },
  },
};

// GET /api/analytics/dashboard - Get dashboard analytics
router.get("/dashboard", async (req, res) => {
  try {
    assert(res, "Response object must exist");

    res.json({
      success: true,
      data: mockAnalytics.dashboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard analytics",
      message: error.message,
    });
  }
});

// GET /api/analytics/performance - Get performance analytics
router.get("/performance", async (req, res) => {
  try {
    assert(res, "Response object must exist");

    res.json({
      success: true,
      data: mockAnalytics.performance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch performance analytics",
      message: error.message,
    });
  }
});

// GET /api/analytics/jobs/:id - Get job-specific analytics
router.get("/jobs/:id", async (req, res) => {
  try {
    assert(req.params.id, "Job ID must be provided");

    const jobAnalytics = {
      jobId: req.params.id,
      views: Math.floor(Math.random() * 500) + 100,
      applications: Math.floor(Math.random() * 100) + 20,
      conversionRate: (Math.random() * 0.3 + 0.1).toFixed(2),
      averageScore: (Math.random() * 40 + 60).toFixed(1),
      sourcesBreakdown: [
        { source: "LinkedIn", count: Math.floor(Math.random() * 50) + 10 },
        { source: "Indeed", count: Math.floor(Math.random() * 40) + 5 },
        { source: "Direct", count: Math.floor(Math.random() * 30) + 3 },
      ],
      timeToApply: (Math.random() * 10 + 2).toFixed(1),
      qualityScore: (Math.random() * 30 + 70).toFixed(1),
    };

    res.json({
      success: true,
      data: jobAnalytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch job analytics",
      message: error.message,
    });
  }
});

// GET /api/analytics/trends - Get trending data
router.get("/trends", async (req, res) => {
  try {
    const { period = "week", metric = "applications" } = req.query;

    // Generate mock trend data based on period
    const days = period === "month" ? 30 : period === "year" ? 365 : 7;
    const trends = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      trends.unshift({
        date: date.toISOString().split("T")[0],
        value: Math.floor(Math.random() * 100) + 20,
      });
    }

    res.json({
      success: true,
      data: {
        period,
        metric,
        trends,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch trends",
      message: error.message,
    });
  }
});

export default router;
