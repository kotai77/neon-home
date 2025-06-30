import express from "express";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const router = express.Router();

// Mock data generators
const generateMockJobs = (query = "", filters = {}) => {
  const allJobs = [
    {
      id: "job-1",
      recruiterId: "recruiter-1",
      title: "Senior React Developer",
      company: "TechFlow Inc",
      description:
        "Join our team building cutting-edge web applications with React, TypeScript, and modern development practices. We're looking for someone passionate about creating exceptional user experiences.",
      requirements: ["React", "TypeScript", "5+ years experience", "GraphQL"],
      location: "San Francisco, CA",
      salary: { min: 130000, max: 180000, currency: "USD" },
      type: "full-time",
      remote: true,
      skills: [
        "React",
        "TypeScript",
        "JavaScript",
        "Node.js",
        "GraphQL",
        "AWS",
      ],
      status: "published",
      createdAt: new Date("2024-01-10").toISOString(),
      updatedAt: new Date("2024-01-10").toISOString(),
      matchScore: 95,
      aiReasons: [
        "Perfect React expertise match",
        "Senior experience level",
        "Remote-friendly",
      ],
    },
    {
      id: "job-2",
      recruiterId: "recruiter-2",
      title: "Frontend Engineer",
      company: "StartupXYZ",
      description:
        "Build the future of digital products with our innovative team. Work with React, Vue.js, and cutting-edge frontend technologies in a fast-paced startup environment.",
      requirements: ["React", "Vue.js", "3+ years experience", "CSS/SASS"],
      location: "Remote",
      salary: { min: 110000, max: 150000, currency: "USD" },
      type: "full-time",
      remote: true,
      skills: ["React", "Vue.js", "JavaScript", "CSS", "Git", "Figma"],
      status: "published",
      createdAt: new Date("2024-01-08").toISOString(),
      updatedAt: new Date("2024-01-08").toISOString(),
      matchScore: 87,
      aiReasons: [
        "Strong frontend skills",
        "Startup experience preferred",
        "100% remote",
      ],
    },
    {
      id: "job-3",
      recruiterId: "recruiter-3",
      title: "Full-Stack Software Engineer",
      company: "InnovateCorp",
      description:
        "Join our engineering team to build scalable web applications. Work across the full stack with React, Node.js, and cloud technologies.",
      requirements: [
        "React",
        "Node.js",
        "Python",
        "AWS",
        "4+ years experience",
      ],
      location: "Austin, TX",
      salary: { min: 120000, max: 160000, currency: "USD" },
      type: "full-time",
      remote: false,
      skills: ["React", "Node.js", "Python", "PostgreSQL", "AWS", "Docker"],
      status: "published",
      createdAt: new Date("2024-01-05").toISOString(),
      updatedAt: new Date("2024-01-05").toISOString(),
      matchScore: 82,
      aiReasons: [
        "Full-stack capabilities",
        "Strong backend skills",
        "Growth opportunity",
      ],
    },
    {
      id: "job-4",
      recruiterId: "recruiter-4",
      title: "Product Manager",
      company: "DataTech Solutions",
      description:
        "Lead product strategy and development for our AI-powered analytics platform. Work closely with engineering and design teams to deliver user-centric products.",
      requirements: [
        "Product Management",
        "Data Analytics",
        "5+ years experience",
        "Agile",
      ],
      location: "New York, NY",
      salary: { min: 140000, max: 190000, currency: "USD" },
      type: "full-time",
      remote: true,
      skills: [
        "Product Management",
        "Analytics",
        "SQL",
        "Figma",
        "Jira",
        "Agile",
      ],
      status: "published",
      createdAt: new Date("2024-01-12").toISOString(),
      updatedAt: new Date("2024-01-12").toISOString(),
      matchScore: 78,
      aiReasons: [
        "Product leadership experience",
        "Data-driven approach",
        "Remote option available",
      ],
    },
    {
      id: "job-5",
      recruiterId: "recruiter-5",
      title: "DevOps Engineer",
      company: "CloudFirst Inc",
      description:
        "Build and maintain our cloud infrastructure using AWS, Kubernetes, and modern DevOps practices. Help scale our platform to serve millions of users.",
      requirements: [
        "AWS",
        "Kubernetes",
        "Docker",
        "Python",
        "3+ years experience",
      ],
      location: "Seattle, WA",
      salary: { min: 125000, max: 170000, currency: "USD" },
      type: "full-time",
      remote: true,
      skills: ["AWS", "Kubernetes", "Docker", "Python", "Terraform", "Jenkins"],
      status: "published",
      createdAt: new Date("2024-01-07").toISOString(),
      updatedAt: new Date("2024-01-07").toISOString(),
      matchScore: 90,
      aiReasons: [
        "DevOps expertise match",
        "Cloud-native experience",
        "Scalability focus",
      ],
    },
  ];

  // Filter jobs based on query and filters
  let filteredJobs = allJobs;

  if (query) {
    const searchTerm = query.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchTerm) ||
        job.company.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm) ||
        job.skills.some((skill) => skill.toLowerCase().includes(searchTerm)),
    );
  }

  if (filters.location) {
    filteredJobs = filteredJobs.filter((job) =>
      job.location.toLowerCase().includes(filters.location.toLowerCase()),
    );
  }

  if (filters.remote !== undefined) {
    filteredJobs = filteredJobs.filter((job) => job.remote === filters.remote);
  }

  if (filters.type) {
    filteredJobs = filteredJobs.filter((job) => job.type === filters.type);
  }

  return filteredJobs.sort((a, b) => b.matchScore - a.matchScore);
};

const generateMockCandidates = (query = "", filters = {}) => {
  const allCandidates = [
    {
      id: "candidate-1",
      name: "Alex Thompson",
      email: "alex.thompson@email.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      avatar: null,
      headline: "Senior Frontend Developer",
      summary:
        "Experienced React developer with 6+ years building scalable web applications. Passionate about user experience and modern development practices. Led frontend teams at 2 successful startups.",
      skills: [
        "React",
        "TypeScript",
        "JavaScript",
        "HTML/CSS",
        "Node.js",
        "GraphQL",
        "AWS",
        "Docker",
      ],
      experience: [
        {
          company: "TechCorp",
          title: "Senior Frontend Developer",
          duration: "2021 - Present",
          current: true,
        },
        {
          company: "WebSolutions",
          title: "Frontend Developer",
          duration: "2019 - 2021",
          current: false,
        },
      ],
      education: [
        {
          institution: "UC Berkeley",
          degree: "Bachelor of Science",
          field: "Computer Science",
        },
      ],
      aiScore: 92,
      matchReasons: [
        "Strong React and TypeScript experience",
        "Located in target area",
        "Senior-level experience matches requirements",
        "Proven track record at tech companies",
      ],
      portfolioUrl: "https://alexthompson.dev",
      linkedinUrl: "https://linkedin.com/in/alexthompson",
    },
    {
      id: "candidate-2",
      name: "Sarah Martinez",
      email: "sarah.martinez@email.com",
      location: "Austin, TX",
      avatar: null,
      headline: "Full-Stack Developer",
      summary:
        "Versatile developer with expertise in both frontend and backend technologies. Strong problem-solving skills and team collaboration experience. Specialized in React and Node.js ecosystems.",
      skills: [
        "React",
        "Node.js",
        "Python",
        "PostgreSQL",
        "AWS",
        "Docker",
        "GraphQL",
        "TypeScript",
      ],
      experience: [
        {
          company: "DevAgency",
          title: "Full-Stack Developer",
          duration: "2020 - Present",
          current: true,
        },
        {
          company: "StartupABC",
          title: "Junior Developer",
          duration: "2018 - 2020",
          current: false,
        },
      ],
      education: [
        {
          institution: "UT Austin",
          degree: "Bachelor of Science",
          field: "Computer Science",
        },
      ],
      aiScore: 87,
      matchReasons: [
        "Full-stack experience with React",
        "Strong backend skills complement team needs",
        "Proven startup experience",
        "Growing expertise in modern stack",
      ],
      portfolioUrl: "https://sarahmartinez.io",
    },
    {
      id: "candidate-3",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1 (555) 987-6543",
      location: "Seattle, WA",
      avatar: null,
      headline: "DevOps Engineer & Cloud Architect",
      summary:
        "DevOps engineer with 5+ years experience building scalable cloud infrastructure. Expert in AWS, Kubernetes, and CI/CD pipelines. Passionate about automation and reliable systems.",
      skills: [
        "AWS",
        "Kubernetes",
        "Docker",
        "Python",
        "Terraform",
        "Jenkins",
        "React",
        "Go",
      ],
      experience: [
        {
          company: "CloudFirst Inc",
          title: "Senior DevOps Engineer",
          duration: "2022 - Present",
          current: true,
        },
        {
          company: "ScaleTech",
          title: "DevOps Engineer",
          duration: "2020 - 2022",
          current: false,
        },
      ],
      education: [
        {
          institution: "University of Washington",
          degree: "Bachelor of Science",
          field: "Computer Engineering",
        },
      ],
      aiScore: 94,
      matchReasons: [
        "Expert DevOps and cloud skills",
        "Strong AWS and Kubernetes experience",
        "Perfect location match",
        "Infrastructure automation expertise",
      ],
      portfolioUrl: "https://michaelchen.dev",
      linkedinUrl: "https://linkedin.com/in/michaelchen",
    },
    {
      id: "candidate-4",
      name: "Emily Rodriguez",
      email: "emily.rodriguez@email.com",
      location: "Remote (Based in Denver, CO)",
      avatar: null,
      headline: "Product Manager & UX Strategist",
      summary:
        "Product manager with 4+ years experience leading cross-functional teams to deliver user-centric digital products. Strong background in data analytics and user research.",
      skills: [
        "Product Management",
        "Analytics",
        "SQL",
        "Figma",
        "Jira",
        "Agile",
        "A/B Testing",
        "User Research",
      ],
      experience: [
        {
          company: "DataTech Solutions",
          title: "Senior Product Manager",
          duration: "2022 - Present",
          current: true,
        },
        {
          company: "GrowthCorp",
          title: "Product Manager",
          duration: "2020 - 2022",
          current: false,
        },
      ],
      education: [
        {
          institution: "Stanford University",
          degree: "Master of Business Administration",
          field: "Product Management",
        },
      ],
      aiScore: 89,
      matchReasons: [
        "Strong product management experience",
        "Data-driven decision making",
        "Cross-functional team leadership",
        "Remote work experience",
      ],
      portfolioUrl: "https://emilyrodriguez.com",
      linkedinUrl: "https://linkedin.com/in/emilyrodriguez",
    },
  ];

  // Filter candidates based on query and filters
  let filteredCandidates = allCandidates;

  if (query) {
    const searchTerm = query.toLowerCase();
    filteredCandidates = filteredCandidates.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchTerm) ||
        candidate.headline.toLowerCase().includes(searchTerm) ||
        candidate.summary.toLowerCase().includes(searchTerm) ||
        candidate.skills.some((skill) =>
          skill.toLowerCase().includes(searchTerm),
        ) ||
        candidate.experience.some(
          (exp) =>
            exp.company.toLowerCase().includes(searchTerm) ||
            exp.title.toLowerCase().includes(searchTerm),
        ),
    );
  }

  if (filters.location) {
    filteredCandidates = filteredCandidates.filter((candidate) =>
      candidate.location.toLowerCase().includes(filters.location.toLowerCase()),
    );
  }

  return filteredCandidates.sort((a, b) => b.aiScore - a.aiScore);
};

// GET /api/search/jobs - Search jobs
router.get("/jobs", async (req, res) => {
  try {
    const { q, location, type, remote, page = 1, limit = 10 } = req.query;

    const filters = {
      location,
      type,
      remote: remote === "true" ? true : remote === "false" ? false : undefined,
    };

    const mockResults = generateMockJobs(q, filters);

    // Paginate results
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = mockResults.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedResults,
      meta: {
        total: mockResults.length,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: endIndex < mockResults.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search jobs",
      message: error.message,
    });
  }
});

// POST /api/search/jobs - Advanced job search
router.post("/jobs", async (req, res) => {
  try {
    const { query, filters = {} } = req.body;

    const mockResults = generateMockJobs(query, filters);

    res.json({
      success: true,
      data: mockResults,
      meta: {
        total: mockResults.length,
        searchTime: Math.random() * 100 + 50, // Mock search time in ms
        aiEnhanced: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search jobs",
      message: error.message,
    });
  }
});

// POST /api/search/candidates - Search candidates
router.post("/candidates", async (req, res) => {
  try {
    const { query, filters = {} } = req.body;

    const mockResults = generateMockCandidates(query, filters);

    res.json({
      success: true,
      data: mockResults,
      meta: {
        total: mockResults.length,
        searchTime: Math.random() * 100 + 50, // Mock search time in ms
        aiEnhanced: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search candidates",
      message: error.message,
    });
  }
});

export default router;
