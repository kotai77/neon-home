import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePersistentSearchFilters } from "@/hooks/usePersistentState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  Star,
  MessageSquare,
  ExternalLink,
  Filter,
  SlidersHorizontal,
  Heart,
  Share2,
  BookmarkPlus,
  Target,
  Zap,
  TrendingUp,
  Bot,
  Eye,
} from "lucide-react";
import {
  User,
  JobPosting,
  SearchFilters,
  assert,
  assertExists,
} from "@/lib/types";
import { apiService, logger } from "@/lib/api";
import { aiService } from "@/lib/ai";
import { toast } from "sonner";

interface SearchPageProps {
  user: User;
}

interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  avatar?: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    duration: string;
    current: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
  }>;
  aiScore?: number;
  matchReasons?: string[];
  portfolioUrl?: string;
  linkedinUrl?: string;
}

export default function SearchPage({ user }: SearchPageProps) {
  assertExists(user, "User");

  const [searchQuery, setSearchQuery] = useState("");

  // Use persistent search filters
  const [filtersData, setFiltersData, isFiltersLoaded] =
    usePersistentSearchFilters(user);

  // Map persistent data to component state - memoized to prevent infinite loops
  const filters = useMemo(
    () => ({
      skills: filtersData.skills,
      location: filtersData.location,
      salaryMin: filtersData.salaryRange.min || 0,
      salaryMax: filtersData.salaryRange.max || 200000,
      jobType: filtersData.jobType ? [filtersData.jobType] : [],
      remote: filtersData.remote,
    }),
    [
      filtersData.skills,
      filtersData.location,
      filtersData.salaryRange.min,
      filtersData.salaryRange.max,
      filtersData.jobType,
      filtersData.remote,
    ],
  );

  const setFilters = useMemo(
    () => (newFilters: any) => {
      setFiltersData((prev) => ({
        ...prev,
        skills: newFilters.skills || [],
        location: newFilters.location || "",
        salaryRange: {
          min: newFilters.salaryMin || 0,
          max: newFilters.salaryMax || 200000,
        },
        jobType: Array.isArray(newFilters.jobType)
          ? newFilters.jobType[0] || ""
          : "",
        remote: newFilters.remote || false,
      }));
    },
    [setFiltersData],
  );
  const [results, setResults] = useState<(JobPosting | CandidateProfile)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<"jobs" | "candidates">(() => {
    const initialMode = user.role === "recruiter" ? "candidates" : "jobs";
    logger.info("Initializing search mode", {
      userRole: user.role,
      initialMode,
    });
    return initialMode;
  });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const navigate = useNavigate();

  const initializeDemoJobs = () => {
    // Only initialize demo jobs for recruiters
    if (user.role === "recruiter") {
      const existingJobsKey = `jobs_${user.id}`;
      const existingJobs = JSON.parse(
        localStorage.getItem(existingJobsKey) || "[]",
      );

      // Debug log current state
      console.log("Checking demo jobs initialization", {
        recruiterId: user.id,
        existingJobsCount: existingJobs.length,
        existingJobs: existingJobs,
      });

      // Force re-creation for debugging - check if demo jobs already exist
      const hasDemoJobs = existingJobs.some(
        (job) => job.id && job.id.includes("job-demo-"),
      );

      // If recruiter has no jobs OR no demo jobs, add demo jobs
      if (existingJobs.length === 0 || !hasDemoJobs) {
        const demoJobs = [
          {
            id: `job-demo-${Date.now()}-1`,
            recruiterId: user.id,
            title: "Senior React Developer",
            company: user.company || "My Company",
            description:
              "We're looking for an experienced React developer to join our frontend team. You'll be working on cutting-edge web applications using React, TypeScript, and modern development practices. This role offers great opportunities for growth and working with the latest technologies.",
            requirements: [
              "5+ years of React experience",
              "Strong TypeScript skills",
              "Experience with modern state management",
              "Knowledge of testing frameworks",
              "Excellent communication skills",
            ],
            location: "San Francisco, CA",
            salary: { min: 120000, max: 180000, currency: "USD" },
            type: "full-time" as const,
            remote: true,
            skills: [
              "React",
              "TypeScript",
              "JavaScript",
              "Redux",
              "Jest",
              "CSS",
            ],
            status: "published" as const,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            benefits: [
              "Health Insurance",
              "401(k) Retirement Plan",
              "Remote Work Options",
              "Professional Development",
            ],
          },
          {
            id: `job-demo-${Date.now()}-2`,
            recruiterId: user.id,
            title: "Product Manager",
            company: user.company || "My Company",
            description:
              "Join our product team to drive strategy and execution for our flagship product. You'll work closely with engineering, design, and stakeholders to deliver features that delight our customers and drive business growth.",
            requirements: [
              "3+ years product management experience",
              "Experience with agile methodologies",
              "Strong analytical skills",
              "Excellent stakeholder management",
              "Tech product background preferred",
            ],
            location: "New York, NY",
            salary: { min: 140000, max: 200000, currency: "USD" },
            type: "full-time" as const,
            remote: false,
            skills: [
              "Product Management",
              "Agile",
              "Analytics",
              "Strategy",
              "SQL",
            ],
            status: "published" as const,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            benefits: [
              "Health Insurance",
              "Dental Insurance",
              "Vision Insurance",
              "Flexible Working Hours",
            ],
          },
          {
            id: `job-demo-${Date.now()}-3`,
            recruiterId: user.id,
            title: "UX/UI Designer",
            company: user.company || "My Company",
            description:
              "We're seeking a talented designer to create beautiful and intuitive user experiences. You'll collaborate with product and engineering teams to design user-centered solutions that solve real problems.",
            requirements: [
              "4+ years UX/UI design experience",
              "Proficiency in Figma and design tools",
              "Portfolio showcasing design process",
              "Experience with user research",
              "Understanding of design systems",
            ],
            location: "Remote",
            salary: { min: 95000, max: 140000, currency: "USD" },
            type: "full-time" as const,
            remote: true,
            skills: [
              "Figma",
              "Sketch",
              "Prototyping",
              "User Research",
              "Design Systems",
            ],
            status: "draft" as const,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            benefits: [
              "Health Insurance",
              "Remote Work Options",
              "Professional Development",
              "Flexible PTO",
            ],
          },
        ];

        // Combine existing jobs with demo jobs (in case user had some jobs already)
        const allJobs = hasDemoJobs
          ? existingJobs
          : [...existingJobs, ...demoJobs];

        // Store the jobs in localStorage
        localStorage.setItem(existingJobsKey, JSON.stringify(allJobs));
        console.log("Initialized demo jobs for recruiter", {
          recruiterId: user.id,
          demoJobCount: demoJobs.length,
          totalJobCount: allJobs.length,
          allJobs: allJobs,
        });
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      // Initialize demo jobs for recruiters if they don't have any
      initializeDemoJobs();

      // Load saved searches and AI suggestions
      loadSavedSearches();
      generateAISuggestions();

      // Load initial demo data for better UX (after demo jobs are initialized)
      await loadInitialDemoData();

      // Mark as initialized to prevent infinite loops
      setIsInitialized(true);
    };

    initializeData();
  }, [user.id]);

  // Trigger search when filters change (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      console.log("Filters changed, triggering search:", filters);
      handleSearch();
    }
  }, [filters, isInitialized]);

  // Trigger search when search mode changes (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      if (searchQuery) {
        handleSearch();
      } else {
        // Load demo data for the new search mode
        loadInitialDemoData();
      }
    }
  }, [searchMode, isInitialized]);

  const loadInitialDemoData = async () => {
    // Load demo data based on user role
    if (user.role === "recruiter") {
      // For recruiters, show all their jobs without a specific search query
      setSearchQuery("");
      await handleSearch("");
    } else {
      // For applicants, search for frontend developer positions
      const demoQuery = "Frontend Developer";
      setSearchQuery(demoQuery);
      await handleSearch(demoQuery);
    }

    // This ensures the search page is never empty
  };

  const loadSavedSearches = async () => {
    try {
      const existingSearchesKey = `savedSearches_${user.id}`;
      const existingSearches = JSON.parse(
        localStorage.getItem(existingSearchesKey) || "[]",
      );

      if (existingSearches.length > 0) {
        setSavedSearches(existingSearches);
      } else {
        // Create demo saved searches
        const demoSearches = [
          {
            id: "search-1",
            name: "Senior React Developers",
            query: "Senior React Developer",
            filters: { skills: ["React", "TypeScript"], remote: true },
            createdAt: new Date(),
            resultsCount: 12,
          },
          {
            id: "search-2",
            name: "Frontend Engineers",
            query: "Frontend Engineer",
            filters: { location: "San Francisco", salaryMin: 100000 },
            createdAt: new Date(),
            resultsCount: 8,
          },
        ];
        setSavedSearches(demoSearches);
      }
    } catch (error) {
      logger.error("Failed to load saved searches", { error });
    }
  };

  const handleSearch = async (query: string = searchQuery) => {
    setIsLoading(true);
    logger.info("Starting search", { query, mode: searchMode, filters });

    try {
      // For demo purposes, we'll use mock data with realistic filtering
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

      const mockResults = generateMockResults();
      const searchTerm = query.toLowerCase();

      // Log filtering details for debugging
      console.log("Search filters being applied:", {
        query,
        filters,
        mockResultsCount: mockResults.length,
      });

      // Filter results based on search query and filters
      const filteredResults = mockResults.filter((result) => {
        if (!result || result === null || result === undefined) return false;

        if (searchMode === "jobs") {
          const job = result as JobPosting;
          if (!job.title || !job.company || !job.description) return false;

          // Text search filter
          const matchesSearch =
            !query ||
            job.title.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm) ||
            (job.skills &&
              job.skills.some((skill) =>
                skill.toLowerCase().includes(searchTerm),
              ));

          // Location filter
          const matchesLocation =
            !filters.location ||
            job.location.toLowerCase().includes(filters.location.toLowerCase());

          // Remote filter
          const matchesRemote = !filters.remote || job.remote;

          // Job type filter
          const matchesJobType =
            filters.jobType.length === 0 || filters.jobType.includes(job.type);

          // Salary filter - job salary range should overlap with filter range
          const matchesSalary =
            !job.salary ||
            (job.salary.max >= filters.salaryMin &&
              job.salary.min <= filters.salaryMax);

          // Skills filter - job must have at least one of the selected skills
          const matchesSkills =
            filters.skills.length === 0 ||
            (job.skills &&
              filters.skills.some((filterSkill) =>
                job.skills.some((jobSkill) =>
                  jobSkill.toLowerCase().includes(filterSkill.toLowerCase()),
                ),
              ));

          const passes =
            matchesSearch &&
            matchesLocation &&
            matchesRemote &&
            matchesJobType &&
            matchesSalary &&
            matchesSkills;

          // Debug individual job filtering
          if (job.id === "job-search-1") {
            console.log("Debug job filtering for", job.title, {
              matchesSearch,
              matchesLocation,
              matchesRemote,
              matchesJobType,
              matchesSalary,
              matchesSkills,
              passes,
              job: {
                location: job.location,
                remote: job.remote,
                type: job.type,
                salary: job.salary,
                skills: job.skills,
              },
              filters,
            });
          }

          return passes;
        } else {
          const candidate = result as CandidateProfile;
          if (!candidate.name || !candidate.headline) return false;

          // Text search filter
          const matchesSearch =
            !query ||
            candidate.name.toLowerCase().includes(searchTerm) ||
            candidate.headline.toLowerCase().includes(searchTerm) ||
            candidate.summary?.toLowerCase().includes(searchTerm) ||
            (candidate.skills &&
              candidate.skills.some((skill) =>
                skill.toLowerCase().includes(searchTerm),
              ));

          // Location filter for candidates
          const matchesLocation =
            !filters.location ||
            candidate.location
              .toLowerCase()
              .includes(filters.location.toLowerCase());

          // Skills filter - candidate must have at least one of the selected skills
          const matchesSkills =
            filters.skills.length === 0 ||
            (candidate.skills &&
              filters.skills.some((filterSkill) =>
                candidate.skills.some((candidateSkill) =>
                  candidateSkill
                    .toLowerCase()
                    .includes(filterSkill.toLowerCase()),
                ),
              ));

          // For candidates we can filter by remote preference (assume some candidates prefer remote)
          const candidatePreferRemote =
            candidate.location.toLowerCase().includes("remote") ||
            candidate.headline?.toLowerCase().includes("remote") ||
            candidate.summary?.toLowerCase().includes("remote");
          const matchesRemote = !filters.remote || candidatePreferRemote;

          // Salary expectation filter (we'll add this to candidate data)
          const candidateSalaryExpectation = (candidate as any)
            .salaryExpectation;
          const matchesSalary =
            !candidateSalaryExpectation ||
            (candidateSalaryExpectation.min <= filters.salaryMax &&
              candidateSalaryExpectation.max >= filters.salaryMin);

          const passes =
            matchesSearch &&
            matchesLocation &&
            matchesSkills &&
            matchesRemote &&
            matchesSalary;

          // Debug individual candidate filtering
          if (candidate.id === "candidate-1") {
            console.log("Debug candidate filtering for", candidate.name, {
              matchesSearch,
              matchesLocation,
              matchesSkills,
              matchesRemote,
              matchesSalary,
              passes,
              candidate: {
                location: candidate.location,
                skills: candidate.skills,
                salaryExpectation: candidateSalaryExpectation,
              },
              filters,
            });
          }

          return passes;
        }
      });

      // FIXED: Always use filtered results, even if empty (this shows filters actually work)
      const safeResults = filteredResults.filter(
        (result) => result !== null && result !== undefined,
      );
      setResults(safeResults);

      console.log("Filter results:", {
        originalCount: mockResults.length,
        filteredCount: safeResults.length,
        query: query,
        filters,
      });

      logger.info("Search completed with filtered demo data", {
        originalCount: mockResults.length,
        filteredCount: safeResults.length,
        query: query,
      });

      // Mock results are already loaded above, so search always shows results
      setIsLoading(false);
    } catch (error) {
      logger.error("Search failed", { error, query, mode: searchMode });
      setIsLoading(false);
      toast.error("Search failed. Please try again.");
    }
  };

  const generateAISuggestions = async () => {
    try {
      // Simulate AI-powered suggestions based on user profile and search history
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (user.role === "recruiter") {
        setAiSuggestions([
          "Senior React Developer with TypeScript experience",
          "Full-stack engineers proficient in Node.js and Python",
          "Product designers with B2B SaaS experience",
          "DevOps engineers experienced with AWS and Kubernetes",
          "Data scientists with machine learning expertise",
        ]);
      } else {
        setAiSuggestions([
          "Frontend Developer positions at tech startups",
          "Remote React jobs with competitive salary",
          "Software engineering roles in fintech companies",
          "UI/UX design opportunities with growth potential",
          "Positions with opportunities for career growth",
          "Jobs that match your JavaScript and React skills",
        ]);
      }

      logger.info("AI suggestions generated", {
        mode: searchMode,
        count: aiSuggestions.length,
      });
    } catch (error) {
      logger.error("Failed to generate AI suggestions", { error });
    }
  };

  const generateMockResults = (): (JobPosting | CandidateProfile)[] => {
    if (searchMode === "jobs") {
      return generateMockJobs();
    } else {
      return generateMockCandidates();
    }
  };

  const generateMockJobs = (): JobPosting[] => {
    // Get jobs from localStorage (newly created jobs by current user)
    const existingJobsKey = `jobs_${user.id}`;
    const storedJobs = JSON.parse(
      localStorage.getItem(existingJobsKey) || "[]",
    );
    const newJobs = storedJobs.map((job: any) => ({
      ...job,
      createdAt: new Date(job.createdAt),
      updatedAt: new Date(job.updatedAt),
      applicationDeadline: job.applicationDeadline
        ? new Date(job.applicationDeadline)
        : undefined,
    }));

    // Generate mock jobs - these represent jobs from other recruiters (when user is applicant)
    const mockJobs: JobPosting[] = [
      {
        id: "job-search-1",
        recruiterId: "other-recruiter-1",
        title: "Senior React Developer",
        company: "TechFlow Inc",
        description:
          "Join our team building cutting-edge web applications with React, TypeScript, and modern frontend technologies. Work on challenging projects that impact millions of users.",
        requirements: [
          "React",
          "TypeScript",
          "5+ years experience",
          "Redux",
          "Testing",
        ],
        location: "San Francisco, CA",
        salary: { min: 130000, max: 180000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: ["React", "TypeScript", "JavaScript", "Node.js", "Redux"],
        status: "published",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
      {
        id: "job-search-2",
        recruiterId: "other-recruiter-2",
        title: "Frontend Engineer",
        company: "StartupXYZ",
        description:
          "Build the future of digital products with our team. Create beautiful, responsive user interfaces using modern frontend frameworks.",
        requirements: [
          "React",
          "HTML/CSS",
          "3+ years experience",
          "Responsive Design",
        ],
        location: "Remote",
        salary: { min: 110000, max: 150000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: ["React", "JavaScript", "CSS", "Git", "Figma"],
        status: "published",
        createdAt: new Date("2024-01-08"),
        updatedAt: new Date("2024-01-08"),
      },
      {
        id: "job-search-3",
        recruiterId: "other-recruiter-3",
        title: "Full Stack Developer",
        company: "InnovateTech",
        description:
          "Work across the entire stack building scalable web applications. Collaborate with product and design teams to deliver high-quality features.",
        requirements: [
          "React",
          "Node.js",
          "4+ years experience",
          "Database Design",
        ],
        location: "New York, NY",
        salary: { min: 120000, max: 170000, currency: "USD" },
        type: "full-time",
        remote: false,
        skills: ["React", "Node.js", "PostgreSQL", "AWS", "Docker"],
        status: "published",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: "job-search-4",
        recruiterId: "other-recruiter-4",
        title: "Product Designer",
        company: "DesignStudio Pro",
        description:
          "Design beautiful and intuitive user experiences for our B2B SaaS platform. Work closely with engineering to bring designs to life.",
        requirements: [
          "UI/UX Design",
          "Figma",
          "3+ years experience",
          "User Research",
        ],
        location: "Los Angeles, CA",
        salary: { min: 95000, max: 140000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: [
          "Figma",
          "Sketch",
          "Prototyping",
          "User Research",
          "Design Systems",
        ],
        status: "published",
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-01-12"),
      },
      {
        id: "job-search-5",
        recruiterId: "other-recruiter-5",
        title: "DevOps Engineer",
        company: "CloudTech Solutions",
        description:
          "Build and maintain our cloud infrastructure. Implement CI/CD pipelines and ensure system reliability and security.",
        requirements: [
          "AWS/Azure",
          "Docker",
          "Kubernetes",
          "4+ years experience",
        ],
        location: "Austin, TX",
        salary: { min: 115000, max: 160000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Python"],
        status: "published",
        createdAt: new Date("2024-01-14"),
        updatedAt: new Date("2024-01-14"),
      },
      {
        id: "job-search-6",
        recruiterId: "other-recruiter-6",
        title: "Junior Python Developer",
        company: "DataTech Corp",
        description:
          "Entry-level position for a Python developer to work on data analysis and automation scripts.",
        requirements: [
          "Python",
          "1+ years experience",
          "SQL basics",
          "Problem solving",
        ],
        location: "Chicago, IL",
        salary: { min: 65000, max: 85000, currency: "USD" },
        type: "part-time",
        remote: false,
        skills: ["Python", "SQL", "Pandas", "NumPy", "Git"],
        status: "published",
        createdAt: new Date("2024-01-16"),
        updatedAt: new Date("2024-01-16"),
      },
      {
        id: "job-search-7",
        recruiterId: "other-recruiter-7",
        title: "Freelance Graphic Designer",
        company: "Creative Agency Hub",
        description:
          "Contract position for a graphic designer to work on various client projects and marketing materials.",
        requirements: [
          "Adobe Creative Suite",
          "2+ years experience",
          "Portfolio required",
          "Brand design",
        ],
        location: "Miami, FL",
        salary: { min: 40000, max: 60000, currency: "USD" },
        type: "contract",
        remote: true,
        skills: [
          "Photoshop",
          "Illustrator",
          "InDesign",
          "Branding",
          "Typography",
        ],
        status: "published",
        createdAt: new Date("2024-01-17"),
        updatedAt: new Date("2024-01-17"),
      },
      {
        id: "job-search-8",
        recruiterId: "other-recruiter-8",
        title: "Marketing Intern",
        company: "StartupXYZ",
        description:
          "Summer internship opportunity to work with our marketing team on social media and content creation.",
        requirements: [
          "Marketing student",
          "Social media skills",
          "Content creation",
          "No experience required",
        ],
        location: "Boston, MA",
        salary: { min: 20000, max: 25000, currency: "USD" },
        type: "internship",
        remote: false,
        skills: [
          "Social Media",
          "Content Writing",
          "Analytics",
          "Canva",
          "SEO",
        ],
        status: "published",
        createdAt: new Date("2024-01-18"),
        updatedAt: new Date("2024-01-18"),
      },
    ];

    // Combine stored jobs (created by user) with mock jobs
    let allJobs = [...newJobs, ...mockJobs];

    // If user is a recruiter, only show jobs they created
    if (user.role === "recruiter") {
      console.log("Before filtering - all jobs:", {
        recruiterId: user.id,
        newJobsCount: newJobs.length,
        mockJobsCount: mockJobs.length,
        totalJobs: [...newJobs, ...mockJobs].length,
        allJobIds: allJobs.map((job) => ({
          id: job.id,
          recruiterId: job.recruiterId,
        })),
      });

      allJobs = allJobs.filter((job) => job.recruiterId === user.id);

      console.log("After filtering jobs for recruiter:", {
        recruiterId: user.id,
        filteredJobs: allJobs.length,
        filteredJobIds: allJobs.map((job) => ({
          id: job.id,
          title: job.title,
        })),
      });
    }

    return allJobs;
  };

  const generateMockCandidates = (): CandidateProfile[] => {
    return [
      {
        id: "candidate-1",
        name: "Alex Chen",
        email: "alex.chen@email.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        headline: "Senior React Developer with 6+ years experience",
        summary:
          "Passionate frontend developer with expertise in React, TypeScript, and modern web technologies. Led multiple teams to deliver high-impact products.",
        skills: ["React", "TypeScript", "JavaScript", "Node.js", "GraphQL"],
        experience: [
          {
            company: "TechCorp",
            title: "Senior Frontend Developer",
            duration: "2021 - Present",
            current: true,
          },
          {
            company: "StartupXYZ",
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
        aiScore: 95,
        matchReasons: [
          "Strong React and TypeScript experience",
          "Previous work in similar company size",
          "Experience with desired tech stack",
        ],
        portfolioUrl: "https://alexchen.dev",
        linkedinUrl: "https://linkedin.com/in/alexchen",
        salaryExpectation: { min: 140000, max: 180000, currency: "USD" },
      },
      {
        id: "candidate-2",
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        location: "Remote (New York based)",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1e8?w=150&h=150&fit=crop&crop=face",
        headline:
          "Full Stack Developer with Backend Focus - Remote Work Preferred",
        summary:
          "Full stack developer with a passion for building scalable web applications. Experience with both frontend and backend technologies. Prefers remote work.",
        skills: ["React", "Node.js", "PostgreSQL", "AWS", "Docker"],
        experience: [
          {
            company: "DataFlow Inc",
            title: "Full Stack Developer",
            duration: "2020 - Present",
            current: true,
          },
        ],
        education: [
          {
            institution: "NYU",
            degree: "Master of Science",
            field: "Computer Science",
          },
        ],
        aiScore: 88,
        matchReasons: [
          "Full stack experience with modern technologies",
          "Backend expertise valuable for complex projects",
          "Experience with cloud technologies",
        ],
        salaryExpectation: { min: 120000, max: 160000, currency: "USD" },
      },
      {
        id: "candidate-3",
        name: "Michael Rodriguez",
        email: "michael.rodriguez@email.com",
        location: "Austin, TX",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        headline: "Product Designer with Development Background",
        summary:
          "Creative product designer focused on user-centered design. Experience designing for both web and mobile platforms with a strong understanding of user research.",
        skills: [
          "Figma",
          "Sketch",
          "Prototyping",
          "User Research",
          "Design Systems",
          "HTML/CSS",
        ],
        experience: [
          {
            company: "DesignStudio",
            title: "Senior Product Designer",
            duration: "2019 - Present",
            current: true,
          },
        ],
        education: [
          {
            institution: "Art Institute",
            degree: "Bachelor of Fine Arts",
            field: "Digital Design",
          },
        ],
        aiScore: 82,
        matchReasons: [
          "Design and frontend skills combination",
          "Experience with modern design tools",
          "Understanding of user experience principles",
        ],
      },
      {
        id: "candidate-4",
        name: "Emily Zhang",
        email: "emily.zhang@email.com",
        location: "Seattle, WA",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        headline: "DevOps Engineer with Cloud Expertise",
        summary:
          "DevOps engineer with strong background in cloud infrastructure and automation. Experienced in building and maintaining CI/CD pipelines.",
        skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Python"],
        experience: [
          {
            company: "CloudTech",
            title: "DevOps Engineer",
            duration: "2020 - Present",
            current: true,
          },
        ],
        education: [
          {
            institution: "University of Washington",
            degree: "Bachelor of Science",
            field: "Computer Engineering",
          },
        ],
        aiScore: 91,
        matchReasons: [
          "Strong cloud infrastructure experience",
          "Expertise in containerization and orchestration",
          "Experience with automation tools",
        ],
        salaryExpectation: { min: 130000, max: 170000, currency: "USD" },
      },
      {
        id: "candidate-5",
        name: "David Kim",
        email: "david.kim@email.com",
        location: "Boston, MA",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        headline: "Data Scientist with Machine Learning Focus",
        summary:
          "Data scientist with expertise in machine learning and statistical analysis. Experience building predictive models and data pipelines.",
        skills: ["Python", "SQL", "TensorFlow", "Pandas", "Jupyter"],
        experience: [
          {
            company: "Analytics Pro",
            title: "Senior Data Scientist",
            duration: "2018 - Present",
            current: true,
          },
        ],
        education: [
          {
            institution: "MIT",
            degree: "PhD",
            field: "Statistics",
          },
        ],
        aiScore: 86,
        matchReasons: [
          "Advanced degree in relevant field",
          "Machine learning expertise",
          "Strong analytical skills",
        ],
        salaryExpectation: { min: 110000, max: 150000, currency: "USD" },
      },
      // Add more candidates for better filtering variety
      {
        id: "candidate-6",
        name: "Jennifer Liu",
        email: "jennifer.liu@email.com",
        location: "Remote (California based)",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
        headline: "Junior Python Developer - Remote First",
        summary:
          "Entry-level Python developer eager to learn and grow. Strong foundation in Python and data analysis. Seeking remote opportunities.",
        skills: ["Python", "SQL", "Pandas", "Git", "HTML"],
        experience: [
          {
            company: "Bootcamp Graduate",
            title: "Python Developer Intern",
            duration: "2023 - Present",
            current: true,
          },
        ],
        education: [
          {
            institution: "UC San Diego",
            degree: "Bachelor of Science",
            field: "Mathematics",
          },
        ],
        aiScore: 72,
        matchReasons: [
          "Strong Python fundamentals",
          "Eager to learn and grow",
          "Mathematical background",
        ],
        salaryExpectation: { min: 60000, max: 85000, currency: "USD" },
      },
      {
        id: "candidate-7",
        name: "Mark Thompson",
        email: "mark.thompson@email.com",
        location: "Chicago, IL",
        avatar:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
        headline: "Marketing Specialist with Social Media Expertise",
        summary:
          "Creative marketing professional with expertise in social media campaigns and content creation. Experience with analytics and growth strategies.",
        skills: [
          "Social Media",
          "Content Writing",
          "Analytics",
          "SEO",
          "Photoshop",
        ],
        experience: [
          {
            company: "Marketing Solutions Inc",
            title: "Marketing Specialist",
            duration: "2021 - Present",
            current: true,
          },
        ],
        education: [
          {
            institution: "Northwestern University",
            degree: "Bachelor of Arts",
            field: "Marketing",
          },
        ],
        aiScore: 79,
        matchReasons: [
          "Strong marketing campaign experience",
          "Social media expertise",
          "Analytics and measurement skills",
        ],
        salaryExpectation: { min: 55000, max: 75000, currency: "USD" },
      },
    ];
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      logger.info("Applying to job", { jobId, applicantId: user.id });

      // Create new application
      const newApplication = {
        id: `app-search-${Date.now()}`,
        jobId: jobId,
        applicantId: user.id,
        status: "pending" as const,
        coverLetter: "Applied via search - detailed cover letter pending",
        resumeUrl: "https://example.com/resume.pdf",
        aiScore: Math.floor(Math.random() * 20) + 75,
        aiAnalysis: "Good candidate match based on search criteria",
        notes: [],
        appliedAt: new Date(),
        updatedAt: new Date(),
      };

      // Get existing applications from localStorage
      const existingApplicationsKey = `applications_${user.id}`;
      const existingApplications = JSON.parse(
        localStorage.getItem(existingApplicationsKey) || "[]",
      );

      // Add new application to the list
      const updatedApplications = [newApplication, ...existingApplications];
      localStorage.setItem(
        existingApplicationsKey,
        JSON.stringify(updatedApplications),
      );

      toast.success("Application submitted successfully!");

      // Navigate to applications page after a short delay
      setTimeout(() => {
        navigate("/applications");
      }, 2000);
    } catch (error) {
      logger.error("Failed to apply to job", { error, jobId });
      toast.error("Failed to submit application. Please try again.");
    }
  };

  const handleContactCandidate = async (candidate: CandidateProfile) => {
    try {
      logger.info("Contacting candidate", { candidateId: candidate.id });

      toast.success(`Contact request sent to ${candidate.name}`);
    } catch (error) {
      logger.error("Failed to contact candidate", { error, candidate });
      toast.error("Failed to send contact request. Please try again.");
    }
  };

  const handleViewJobDetails = (jobId: string) => {
    const job = results.find(
      (r) => r?.id === jobId && "title" in r,
    ) as JobPosting;
    if (job) {
      setSelectedJob(job);
      setShowJobDetails(true);
    }
  };

  const handleSaveSearch = async () => {
    try {
      const searchName = prompt("Enter a name for this search:");
      if (!searchName) return;

      const newSearch = {
        id: `search-${Date.now()}`,
        name: searchName,
        query: searchQuery,
        filters,
        createdAt: new Date(),
        resultsCount: results.length,
      };

      const updatedSearches = [...savedSearches, newSearch];
      setSavedSearches(updatedSearches);
      localStorage.setItem(
        `savedSearches_${user.id}`,
        JSON.stringify(updatedSearches),
      );

      toast.success("Search saved successfully!");
    } catch (error) {
      logger.error("Failed to save search", { error });
      toast.error("Failed to save search. Please try again.");
    }
  };

  // Show loading state if filters aren't loaded yet
  if (!isFiltersLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading search filters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            AI-Powered {searchMode === "jobs" ? "Job" : "Candidate"} Search
          </h1>
          <p className="text-muted-foreground mt-2">
            {searchMode === "jobs"
              ? "Find your perfect job with AI assistance"
              : "Discover top talent with intelligent matching"}
          </p>
        </div>

        {/* Search Mode Toggle */}
        <div className="mb-6">
          <Tabs
            value={searchMode}
            onValueChange={(value) => {
              const newMode = value as "jobs" | "candidates";
              logger.info("Switching search mode", {
                from: searchMode,
                to: newMode,
              });
              setSearchMode(newMode);

              // Clear current results when switching modes
              setResults([]);

              // Reset relevant filters when switching modes
              if (newMode === "candidates") {
                setFilters((prev) => ({
                  ...prev,
                  jobType: [],
                  salaryMin: 0,
                  salaryMax: 200000,
                }));
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="jobs">
                <Briefcase className="w-4 h-4 mr-2" />
                {user.role === "recruiter" ? "My Jobs" : "Job Search"}
              </TabsTrigger>
              <TabsTrigger value="candidates">
                <Users className="w-4 h-4 mr-2" />
                Candidate Search
                {user.role === "applicant" && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Limited)
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-brand" />
                  AI Suggestions
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full text-left justify-start h-auto p-3 text-sm"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                  >
                    <Target className="w-3 h-3 mr-2 text-brand flex-shrink-0" />
                    <span className="line-clamp-2">{suggestion}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    placeholder="Enter location..."
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({ ...filters, location: e.target.value })
                    }
                  />
                </div>

                {/* Job Type Filter */}
                {searchMode === "jobs" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Type</label>
                    <div className="space-y-2">
                      {["full-time", "part-time", "contract", "internship"].map(
                        (type) => (
                          <div
                            key={type}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={type}
                              checked={filters.jobType.includes(type)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters({
                                    ...filters,
                                    jobType: [...filters.jobType, type],
                                  });
                                } else {
                                  setFilters({
                                    ...filters,
                                    jobType: filters.jobType.filter(
                                      (t) => t !== type,
                                    ),
                                  });
                                }
                              }}
                            />
                            <label
                              htmlFor={type}
                              className="text-sm capitalize"
                            >
                              {type.replace("-", " ")}
                            </label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Remote Work Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote"
                    checked={filters.remote}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, remote: !!checked })
                    }
                  />
                  <label htmlFor="remote" className="text-sm">
                    Remote Work
                  </label>
                </div>

                {/* Salary Range */}
                {searchMode === "jobs" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Salary Range: ${filters.salaryMin.toLocaleString()} - $
                      {filters.salaryMax.toLocaleString()}
                    </label>
                    <Slider
                      value={[filters.salaryMin, filters.salaryMax]}
                      onValueChange={([min, max]) =>
                        setFilters({
                          ...filters,
                          salaryMin: min,
                          salaryMax: max,
                        })
                      }
                      max={300000}
                      min={30000}
                      step={5000}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Skills Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Skills</label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Add skill (press Enter)..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          const skill = e.currentTarget.value.trim();
                          if (!filters.skills.includes(skill)) {
                            setFilters({
                              ...filters,
                              skills: [...filters.skills, skill],
                            });
                          }
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    {filters.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {filters.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="cursor-pointer text-xs"
                            onClick={() =>
                              setFilters({
                                ...filters,
                                skills: filters.skills.filter(
                                  (s) => s !== skill,
                                ),
                              })
                            }
                          >
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Suggested: React, TypeScript, Python, AWS, Design
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Saved Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookmarkPlus className="w-5 h-5 mr-2" />
                  Saved Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedSearches.map((search) => (
                  <Button
                    key={search.id}
                    variant="ghost"
                    className="w-full text-left justify-start h-auto p-3"
                    onClick={() => {
                      setSearchQuery(search.query);
                      setFilters(search.filters || {});
                      handleSearch(search.query);
                    }}
                  >
                    <div>
                      <div className="font-medium text-sm">{search.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {search.resultsCount} results
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Bar */}
            <Card>
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={
                        searchMode === "jobs"
                          ? "Search for jobs, companies, or skills..."
                          : "Search for candidates, skills, or experience..."
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={() => handleSearch()} disabled={isLoading}>
                    {isLoading ? "Searching..." : "Search"}
                  </Button>
                  <Button variant="outline" onClick={handleSaveSearch}>
                    <BookmarkPlus className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {results.length}{" "}
                    {searchMode === "jobs" ? "jobs" : "candidates"} found
                    {searchQuery && ` for "${searchQuery}"`}
                  </span>
                  {results.length > 0 && (
                    <Select defaultValue="relevance">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="date">Date Posted</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Searching...</p>
                    </div>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Results Found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search terms or filters to find more
                      results.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setFilters({
                          skills: [],
                          location: "",
                          salaryMin: 0,
                          salaryMax: 200000,
                          jobType: [],
                          remote: false,
                        });
                      }}
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <div>
                    {searchMode === "jobs" ? (
                      <JobResults
                        jobs={results as JobPosting[]}
                        onViewDetails={handleViewJobDetails}
                        onApply={handleApplyToJob}
                        userRole={user.role}
                      />
                    ) : (
                      <CandidateResults
                        candidates={results as CandidateProfile[]}
                        onViewDetails={() => {}}
                        onContact={handleContactCandidate}
                        userRole={user.role}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <Dialog open={showJobDetails} onOpenChange={setShowJobDetails}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedJob.title}</DialogTitle>
              <DialogDescription>{selectedJob.company}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Job Header */}
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {selectedJob.title} at {selectedJob.company}
                </h2>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-success text-success-foreground">
                    {selectedJob.status === "published"
                      ? "Active"
                      : selectedJob.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedJob.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>
                    ${selectedJob.salary.min.toLocaleString()} - $
                    {selectedJob.salary.max.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedJob.type}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills &&
                    selectedJob.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Requirements */}
              {selectedJob.requirements && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t">
                {user.role === "applicant" && (
                  <Button
                    onClick={() => {
                      handleApplyToJob(selectedJob.id);
                      setShowJobDetails(false);
                    }}
                  >
                    Apply Now
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowJobDetails(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Job Results Component
function JobResults({
  jobs,
  onViewDetails,
  onApply,
  userRole,
}: {
  jobs: JobPosting[];
  onViewDetails: (jobId: string) => void;
  onApply: (jobId: string) => void;
  userRole: string;
}) {
  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {job.title}
                </h3>
                <p className="text-muted-foreground mb-2">{job.company}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {job.location}
                  </div>
                  {job.salary && (
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />$
                      {job.salary.min.toLocaleString()} - $
                      {job.salary.max.toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {job.type}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-4 line-clamp-2">
              {job.description}
            </p>

            <div className="flex items-center space-x-2 mb-4">
              {job.skills &&
                job.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              {job.skills && job.skills.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills.length - 5} more
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Posted{" "}
                {job.createdAt && job.createdAt instanceof Date
                  ? job.createdAt.toLocaleDateString()
                  : "Date not available"}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(job.id)}
                >
                  View Details
                </Button>
                {userRole === "applicant" && (
                  <Button size="sm" onClick={() => onApply(job.id)}>
                    Apply Now
                  </Button>
                )}
                {userRole === "recruiter" && (
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Candidate Results Component
function CandidateResults({
  candidates,
  onViewDetails,
  onContact,
  userRole,
}: {
  candidates: CandidateProfile[];
  onViewDetails: (candidateId: string) => void;
  onContact: (candidate: CandidateProfile) => void;
  userRole: string;
}) {
  return (
    <div className="space-y-4">
      {candidates.map((candidate) => (
        <Card key={candidate.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={candidate.avatar} alt={candidate.name} />
                <AvatarFallback>
                  {candidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{candidate.name}</h3>
                    <p className="text-muted-foreground">
                      {candidate.headline}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {candidate.location}
                    </div>
                  </div>
                  {candidate.aiScore && (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      {candidate.aiScore}% Match
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {candidate.summary}
                </p>

                <div className="flex items-center space-x-2 mb-4">
                  {candidate.skills.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{candidate.skills.length - 5} more
                    </Badge>
                  )}
                </div>

                {candidate.matchReasons && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Why this candidate matches:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {candidate.matchReasons
                        .slice(0, 2)
                        .map((reason, index) => (
                          <li key={index}>• {reason}</li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(candidate.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Profile
                  </Button>
                  {userRole === "recruiter" && (
                    <Button size="sm" onClick={() => onContact(candidate)}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
