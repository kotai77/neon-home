import express from "express";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const router = express.Router();

// GET /api/billing/subscription - Get subscription info
router.get("/subscription", async (req, res) => {
  try {
    const mockSubscription = {
      id: "sub_123",
      plan: "pro",
      status: "active",
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      cancelAtPeriodEnd: false,
    };

    res.json({
      success: true,
      data: mockSubscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch subscription",
      message: error.message,
    });
  }
});

export default router;
