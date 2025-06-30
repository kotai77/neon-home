import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  TrendingUp,
} from "lucide-react";
import { User, JobPosting, assert, assertExists } from "@/lib/types";
import { apiService, logger } from "@/lib/api";
import { aiService } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";

interface JobManagementProps {
  user: User;
}

export default function JobManagement({ user }: JobManagementProps) {
  assertExists(user, "User");
  assert(
    user.role === "recruiter" || user.role === "applicant",
    "Invalid user role",
  );

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [remoteFilter, setRemoteFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [newJob, setNewJob] = useState({
    title: "",
    company: user.company || "",
    description: "",
    requirements: [""],
    location: "",
    salary: { min: 0, max: 0, currency: "USD" },
    type: "full-time" as "full-time" | "part-time" | "contract" | "internship",
    remote: false,
    skills: [""],
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
  }, [user.id]);

  useEffect(() => {
    filterJobs();
  }, [
    jobs,
    searchQuery,
    statusFilter,
    typeFilter,
    remoteFilter,
    locationFilter,
  ]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      logger.info("Loading jobs", { userId: user.id, role: user.role });

      // Always use mock data for demo purposes
      const mockJobs = generateMockJobs();
      setJobs(mockJobs);
      logger.info("Demo jobs loaded successfully", { count: mockJobs.length });
    } catch (error) {
      logger.error("Failed to load jobs", { error });
      toast({
        title: "Error",
        description: "Failed to load jobs. Please try again.",
        variant: "destructive",
      });
      // Set mock data as fallback
      setJobs(generateMockJobs());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockJobs = (): JobPosting[] => {
    // Get newly created jobs from localStorage
    const existingJobsKey = `jobs_${user.id}`;
    const storedJobs = JSON.parse(
      localStorage.getItem(existingJobsKey) || "[]",
    );

    // Convert stored jobs to proper format with Date objects
    const newJobs = storedJobs.map((job: any) => ({
      ...job,
      createdAt: new Date(job.createdAt),
      updatedAt: new Date(job.updatedAt),
      applicationDeadline: job.applicationDeadline
        ? new Date(job.applicationDeadline)
        : undefined,
    }));

    const mockJobs: JobPosting[] = [
      {
        id: "job-1",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Senior Frontend Developer",
        company: "TechCorp",
        description:
          "We are looking for an experienced Frontend Developer to join our team and build cutting-edge user interfaces for our SaaS platform. You'll work with modern technologies and collaborate with a passionate team to deliver exceptional user experiences.",
        requirements: [
          "React",
          "TypeScript",
          "5+ years experience",
          "Redux/Zustand",
          "Testing frameworks",
        ],
        location: "San Francisco, CA",
        salary: { min: 120000, max: 180000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: [
          "React",
          "TypeScript",
          "JavaScript",
          "HTML/CSS",
          "Jest",
          "Cypress",
        ],
        status: "published",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: "job-2",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Product Manager",
        company: "StartupXYZ",
        description:
          "Drive product strategy and roadmap for our growing fintech platform. Lead cross-functional teams, analyze market trends, and deliver features that delight our customers while achieving business objectives.",
        requirements: [
          "Product Management",
          "5+ years experience",
          "Agile",
          "Data analysis",
          "User research",
        ],
        location: "New York, NY",
        salary: { min: 140000, max: 200000, currency: "USD" },
        type: "full-time",
        remote: false,
        skills: [
          "Product Management",
          "Agile",
          "Analytics",
          "Strategy",
          "SQL",
          "Figma",
        ],
        status: "published",
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-01-12"),
      },
      {
        id: "job-3",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Backend Engineer",
        company: "DataFlow Inc",
        description:
          "Build scalable backend systems and APIs that power our data analytics platform. Work with cloud infrastructure, design robust architectures, and ensure high availability systems.",
        requirements: [
          "Node.js",
          "Python",
          "3+ years experience",
          "Database design",
          "Cloud platforms",
        ],
        location: "Remote",
        salary: { min: 100000, max: 150000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: [
          "Node.js",
          "Python",
          "PostgreSQL",
          "AWS",
          "Docker",
          "Kubernetes",
        ],
        status: "published",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
      {
        id: "job-4",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "UX/UI Designer",
        company: "DesignStudio",
        description:
          "Create beautiful and intuitive user experiences for our mobile and web applications. Collaborate with product and engineering teams to bring designs from concept to reality.",
        requirements: [
          "UI/UX Design",
          "3+ years experience",
          "Figma",
          "User research",
          "Prototyping",
        ],
        location: "Los Angeles, CA",
        salary: { min: 85000, max: 125000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: [
          "Figma",
          "Sketch",
          "Adobe Creative Suite",
          "User Research",
          "Prototyping",
        ],
        status: "published",
        createdAt: new Date("2024-01-14"),
        updatedAt: new Date("2024-01-14"),
      },
      {
        id: "job-5",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "DevOps Engineer",
        company: "CloudTech Solutions",
        description:
          "Manage and optimize our cloud infrastructure, implement CI/CD pipelines, and ensure system reliability and security across our development and production environments.",
        requirements: [
          "AWS/Azure",
          "Docker",
          "4+ years experience",
          "Kubernetes",
          "Infrastructure as Code",
        ],
        location: "Seattle, WA",
        salary: { min: 130000, max: 180000, currency: "USD" },
        type: "full-time",
        remote: false,
        skills: [
          "AWS",
          "Docker",
          "Kubernetes",
          "Terraform",
          "Jenkins",
          "Monitoring",
        ],
        status: "published",
        createdAt: new Date("2024-01-11"),
        updatedAt: new Date("2024-01-11"),
      },
      {
        id: "job-6",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Data Scientist",
        company: "Analytics Pro",
        description:
          "Extract insights from large datasets, build predictive models, and help drive data-informed business decisions. Work with machine learning algorithms and statistical analysis.",
        requirements: [
          "Python",
          "Machine Learning",
          "3+ years experience",
          "Statistics",
          "SQL",
        ],
        location: "Boston, MA",
        salary: { min: 110000, max: 160000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: [
          "Python",
          "R",
          "Machine Learning",
          "SQL",
          "Pandas",
          "Scikit-learn",
        ],
        status: "published",
        createdAt: new Date("2024-01-13"),
        updatedAt: new Date("2024-01-13"),
      },
      {
        id: "job-7",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Marketing Coordinator",
        company: "Growth Agency",
        description:
          "Support marketing campaigns, manage social media presence, and help execute content marketing strategies to drive brand awareness and customer acquisition.",
        requirements: [
          "Marketing",
          "2+ years experience",
          "Social Media",
          "Content Creation",
          "Analytics",
        ],
        location: "Austin, TX",
        salary: { min: 45000, max: 65000, currency: "USD" },
        type: "full-time",
        remote: false,
        skills: [
          "Social Media",
          "Content Marketing",
          "Google Analytics",
          "Adobe Creative Suite",
        ],
        status: "published",
        createdAt: new Date("2024-01-09"),
        updatedAt: new Date("2024-01-09"),
      },
      {
        id: "job-8",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Software Engineering Intern",
        company: "TechCorp",
        description:
          "Join our summer internship program and gain hands-on experience in software development. Work on real projects alongside senior engineers and learn industry best practices.",
        requirements: [
          "Computer Science student",
          "Programming basics",
          "Eagerness to learn",
          "Problem solving",
        ],
        location: "San Francisco, CA",
        salary: { min: 6000, max: 8000, currency: "USD" },
        type: "internship",
        remote: true,
        skills: ["JavaScript", "Python", "Git", "Programming Fundamentals"],
        status: "published",
        createdAt: new Date("2024-01-08"),
        updatedAt: new Date("2024-01-08"),
      },
      {
        id: "job-9",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Freelance Content Writer",
        company: "Content Agency",
        description:
          "Create engaging blog posts, articles, and marketing copy for various clients across different industries. Flexible schedule and remote work opportunity.",
        requirements: [
          "Writing experience",
          "Portfolio",
          "SEO knowledge",
          "Research skills",
          "Adaptability",
        ],
        location: "Remote",
        salary: { min: 25, max: 75, currency: "USD" },
        type: "contract",
        remote: true,
        skills: ["Writing", "SEO", "Research", "Content Strategy", "WordPress"],
        status: "published",
        createdAt: new Date("2024-01-07"),
        updatedAt: new Date("2024-01-07"),
      },
      {
        id: "job-10",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Senior Full Stack Developer",
        company: "E-commerce Giant",
        description:
          "Lead development of our e-commerce platform, working across the entire technology stack. Mentor junior developers and architect scalable solutions for millions of users.",
        requirements: [
          "Full Stack",
          "7+ years experience",
          "Leadership",
          "React",
          "Node.js",
          "Database design",
        ],
        location: "Chicago, IL",
        salary: { min: 150000, max: 220000, currency: "USD" },
        type: "full-time",
        remote: false,
        skills: [
          "React",
          "Node.js",
          "PostgreSQL",
          "MongoDB",
          "Redis",
          "Microservices",
        ],
        status: "published",
        createdAt: new Date("2024-01-06"),
        updatedAt: new Date("2024-01-06"),
      },
      {
        id: "job-11",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Part-time Customer Support Specialist",
        company: "SaaS Startup",
        description:
          "Provide excellent customer support via chat, email, and phone. Help customers succeed with our platform and gather feedback for product improvements.",
        requirements: [
          "Customer service",
          "Communication skills",
          "Problem solving",
          "Tech-savvy",
          "Patience",
        ],
        location: "Denver, CO",
        salary: { min: 18, max: 25, currency: "USD" },
        type: "part-time",
        remote: true,
        skills: [
          "Customer Service",
          "Communication",
          "Zendesk",
          "Problem Solving",
        ],
        status: "published",
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-05"),
      },
      {
        id: "job-12",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Mobile App Developer",
        company: "App Studio",
        description:
          "Develop native iOS and Android applications for clients ranging from startups to enterprise companies. Stay current with mobile development trends and best practices.",
        requirements: [
          "Mobile Development",
          "4+ years experience",
          "iOS/Android",
          "App Store deployment",
          "UI/UX collaboration",
        ],
        location: "Miami, FL",
        salary: { min: 95000, max: 140000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: [
          "Swift",
          "Kotlin",
          "React Native",
          "Flutter",
          "iOS",
          "Android",
        ],
        status: "published",
        createdAt: new Date("2024-01-04"),
        updatedAt: new Date("2024-01-04"),
      },
      {
        id: "job-13",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Cybersecurity Analyst",
        company: "SecureNet Corp",
        description:
          "Monitor security systems, investigate incidents, and implement security measures to protect our organization's digital assets. Stay ahead of emerging cyber threats.",
        requirements: [
          "Cybersecurity",
          "3+ years experience",
          "Incident response",
          "Security tools",
          "Risk assessment",
        ],
        location: "Washington, DC",
        salary: { min: 85000, max: 130000, currency: "USD" },
        type: "full-time",
        remote: false,
        skills: [
          "Network Security",
          "SIEM",
          "Incident Response",
          "Risk Assessment",
          "Compliance",
        ],
        status: "published",
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-03"),
      },
      {
        id: "job-14",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "Business Analyst",
        company: "Consulting Group",
        description:
          "Analyze business processes, gather requirements, and help implement solutions that improve operational efficiency. Bridge the gap between business needs and technical solutions.",
        requirements: [
          "Business Analysis",
          "2+ years experience",
          "Requirements gathering",
          "Process improvement",
          "Documentation",
        ],
        location: "Atlanta, GA",
        salary: { min: 70000, max: 95000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: [
          "Business Analysis",
          "SQL",
          "Excel",
          "Process Mapping",
          "Documentation",
        ],
        status: "published",
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
      },
      {
        id: "job-15",
        recruiterId: user.role === "recruiter" ? user.id : "other-recruiter",
        title: "AI/ML Engineer",
        company: "AI Innovations",
        description:
          "Build and deploy machine learning models, work with large datasets, and implement AI solutions that solve real-world problems. Join our cutting-edge research team.",
        requirements: [
          "Machine Learning",
          "4+ years experience",
          "Deep Learning",
          "MLOps",
          "Python/TensorFlow",
        ],
        location: "San Jose, CA",
        salary: { min: 160000, max: 250000, currency: "USD" },
        type: "full-time",
        remote: true,
        skills: [
          "Python",
          "TensorFlow",
          "PyTorch",
          "MLOps",
          "Deep Learning",
          "Computer Vision",
        ],
        status: "published",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    // Combine new jobs with mock jobs, with new jobs first (most recent)
    return [...newJobs, ...mockJobs];
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.skills.some((skill) =>
            skill.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    // Status filter (only for recruiters)
    if (user.role === "recruiter" && statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Job type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((job) => job.type === typeFilter);
    }

    // Remote filter
    if (remoteFilter !== "all") {
      const isRemote = remoteFilter === "remote";
      filtered = filtered.filter((job) => job.remote === isRemote);
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase()),
      );
    }

    setFilteredJobs(filtered);
  };

  const checkIfAlreadyApplied = (jobId: string): boolean => {
    const applicationsKey = `applications_${user.id}`;
    const existingApplications = JSON.parse(
      localStorage.getItem(applicationsKey) || "[]",
    );
    return existingApplications.some((app: any) => app.jobId === jobId);
  };

  const handleApplyToJob = async (job: JobPosting) => {
    try {
      logger.info("Applying to job", { jobId: job.id, applicantId: user.id });

      // Create new application
      const newApplication = {
        id: `app-new-${Date.now()}`,
        jobId: job.id,
        applicantId: user.id,
        status: "pending" as const,
        coverLetter: `I am excited to apply for the ${job.title} position at ${job.company}. I believe my skills and experience make me a great fit for this role, and I look forward to contributing to your team.`,
        resumeUrl: "https://example.com/my-resume.pdf",
        aiScore: Math.floor(Math.random() * 20) + 75, // Random score between 75-95
        aiAnalysis: `Good candidate match for ${job.title}. Skills align well with job requirements.`,
        notes: [],
        appliedAt: new Date(),
        updatedAt: new Date(),
        // Additional job info for display
        jobTitle: job.title,
        company: job.company,
        jobLocation: job.location,
      };

      // Get existing applications from localStorage
      const existingApplicationsKey = `applications_${user.id}`;
      const existingApplications = JSON.parse(
        localStorage.getItem(existingApplicationsKey) || "[]",
      );

      // Check if already applied to this job
      const alreadyApplied = existingApplications.some(
        (app: any) => app.jobId === job.id,
      );

      if (alreadyApplied) {
        toast({
          title: "Already Applied",
          description: `You have already applied for ${job.title} at ${job.company}.`,
          variant: "destructive",
        });
        return;
      }

      // Add new application to the list
      const updatedApplications = [newApplication, ...existingApplications];
      localStorage.setItem(
        existingApplicationsKey,
        JSON.stringify(updatedApplications),
      );

      toast({
        title: "Application Submitted",
        description: `Your application for ${job.title} at ${job.company} has been submitted successfully!`,
      });

      // Simulate a small delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to applications page to show the new application
      navigate("/applications");
    } catch (error) {
      logger.error("Failed to apply to job", { error, jobId: job.id });
      toast({
        title: "Application Failed",
        description: "Unable to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {user.role === "recruiter" ? "Job Management" : "Browse Jobs"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {user.role === "recruiter"
                  ? "Create and manage your job postings"
                  : "Find your perfect job opportunity"}
              </p>
            </div>
            {user.role === "recruiter" && (
              <Button onClick={() => navigate("/jobs/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {user.role === "recruiter" && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>

              {/* Expanded Filters */}
              {showMoreFilters && (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type-filter">Job Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger id="type-filter">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remote-filter">Work Type</Label>
                    <Select
                      value={remoteFilter}
                      onValueChange={setRemoteFilter}
                    >
                      <SelectTrigger id="remote-filter">
                        <SelectValue placeholder="All locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-filter">Location</Label>
                    <Input
                      id="location-filter"
                      placeholder="Filter by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-3 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTypeFilter("all");
                        setRemoteFilter("all");
                        setLocationFilter("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
                <p className="text-muted-foreground text-center">
                  {user.role === "recruiter"
                    ? "Start by creating your first job posting."
                    : "Try adjusting your search criteria."}
                </p>
                {user.role === "recruiter" && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Job
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                user={user}
                onApply={handleApplyToJob}
                hasApplied={
                  user.role === "applicant"
                    ? checkIfAlreadyApplied(job.id)
                    : false
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Job Card Component
function JobCard({
  job,
  user,
  onApply,
  hasApplied = false,
}: {
  job: JobPosting;
  user: User;
  onApply?: (job: JobPosting) => void;
  hasApplied?: boolean;
}) {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "closed":
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatSalary = (salary: {
    min: number;
    max: number;
    currency: string;
  }) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency,
      maximumFractionDigits: 0,
    });

    if (job.type === "contract" || job.type === "part-time") {
      return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}/hr`;
    }

    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-semibold text-foreground">
                {job.title}
              </h3>
              {user.role === "recruiter" && getStatusBadge(job.status)}
            </div>
            <p className="text-lg text-muted-foreground">{job.company}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {job.location}
                {job.remote && " (Remote)"}
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                {formatSalary(job.salary)}
              </div>
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                {job.type}
              </div>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-2">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
          {job.skills.slice(0, 4).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{job.skills.length - 4} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Posted {job.createdAt.toLocaleDateString()}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>

            {user.role === "applicant" && (
              <Button
                size="sm"
                onClick={() => onApply?.(job)}
                disabled={hasApplied}
                variant={hasApplied ? "outline" : "default"}
              >
                {hasApplied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Applied
                  </>
                ) : (
                  "Apply Now"
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
