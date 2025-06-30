import express from "express";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const router = express.Router();

// Mock AI responses
const generateMockAIResponse = (type) => {
  switch (type) {
    case "resume_analysis":
      return {
        skills: ["JavaScript", "React", "Node.js", "TypeScript", "Python"],
        experience: "5+ years",
        education: "Bachelor's in Computer Science",
        strengths: [
          "Strong technical background",
          "Full-stack development experience",
          "Leadership experience",
        ],
        weaknesses: ["Limited mobile development experience"],
        score: Math.floor(Math.random() * 30) + 70,
        summary:
          "Experienced software developer with strong technical skills and proven track record.",
      };
    case "job_match":
      return [
        {
          candidateId: "1",
          name: "John Doe",
          matchScore: 92,
          reasons: ["Strong React experience", "Relevant project experience"],
        },
        {
          candidateId: "2",
          name: "Jane Smith",
          matchScore: 88,
          reasons: ["Full-stack skills", "Leadership experience"],
        },
      ];
    case "application_score":
      return {
        score: Math.floor(Math.random() * 40) + 60,
        factors: {
          skillsMatch: 0.85,
          experienceLevel: 0.78,
          educationFit: 0.92,
          culturalFit: 0.76,
        },
        recommendations: [
          "Strong technical fit for the role",
          "Consider for technical interview",
        ],
      };
    default:
      return { message: "AI analysis completed" };
  }
};

// POST /api/ai/analyze-resume - Analyze resume with AI
router.post("/analyze-resume", async (req, res) => {
  try {
    assert(req.body.fileUrl, "File URL must be provided");

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const analysis = generateMockAIResponse("resume_analysis");

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to analyze resume",
      message: error.message,
    });
  }
});

// POST /api/ai/match-candidates - Find matching candidates for a job
router.post("/match-candidates", async (req, res) => {
  try {
    assert(req.body.jobId, "Job ID must be provided");

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const matches = generateMockAIResponse("job_match");

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to match candidates",
      message: error.message,
    });
  }
});

// POST /api/ai/score-application - Score an application
router.post("/score-application", async (req, res) => {
  try {
    assert(req.body.applicationId, "Application ID must be provided");

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const scoring = generateMockAIResponse("application_score");

    res.json({
      success: true,
      data: scoring,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to score application",
      message: error.message,
    });
  }
});

// POST /api/ai/optimize-job - Optimize job posting with AI
router.post("/optimize-job", async (req, res) => {
  try {
    assert(req.body.jobDescription, "Job description must be provided");

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const optimization = {
      optimizedTitle: "Senior Full Stack Developer - React & Node.js",
      optimizedDescription: `We're looking for a talented Senior Full Stack Developer to join our growing team.

Key Responsibilities:
• Develop and maintain scalable web applications using React and Node.js
• Collaborate with cross-functional teams to deliver high-quality software
• Lead technical decisions and mentor junior developers
• Implement best practices for code quality and testing

Requirements:
• 5+ years of experience with JavaScript and modern frameworks
• Strong experience with React, Node.js, and TypeScript
• Experience with cloud platforms (AWS/Azure)
• Excellent communication and teamwork skills

What We Offer:
• Competitive salary and equity package
• Flexible work arrangements
• Professional development opportunities
• Comprehensive health benefits`,
      improvements: [
        "Added specific technology requirements",
        "Included clear responsibilities",
        "Enhanced benefits section",
        "Improved readability with bullet points",
      ],
      seoScore: 85,
      readabilityScore: 92,
    };

    res.json({
      success: true,
      data: optimization,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to optimize job posting",
      message: error.message,
    });
  }
});

// POST /api/ai/generate-questions - Generate interview questions
router.post("/generate-questions", async (req, res) => {
  try {
    assert(req.body.jobId, "Job ID must be provided");

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const questions = {
      technical: [
        "Explain the difference between server-side and client-side rendering in React.",
        "How would you optimize the performance of a Node.js application?",
        "Describe your approach to error handling in asynchronous JavaScript code.",
      ],
      behavioral: [
        "Tell me about a time when you had to learn a new technology quickly.",
        "Describe a challenging project you worked on and how you overcame obstacles.",
        "How do you prioritize tasks when working on multiple projects?",
      ],
      situational: [
        "How would you handle a situation where a client requests a feature that conflicts with best practices?",
        "What would you do if you discovered a critical bug in production?",
        "How would you approach code reviews with junior developers?",
      ],
    };

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to generate questions",
      message: error.message,
    });
  }
});

export default router;
