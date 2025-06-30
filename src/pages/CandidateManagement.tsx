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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  Star,
  Brain,
  Download,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users,
  TrendingUp,
  AlertCircle,
  FileText,
  ExternalLink,
  Heart,
  UserPlus,
  Send,
  Calendar,
  Clock,
  Target,
  Zap,
  BookmarkPlus,
  Share2,
  UserCheck,
  UserX,
  GraduationCap,
  Code,
} from "lucide-react";
import { User, assert, assertExists } from "@/lib/types";
import { apiService, logger } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CandidateManagementProps {
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
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year?: string;
  }>;
  aiScore?: number;
  matchReasons?: string[];
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  status: "available" | "interviewing" | "hired" | "not_interested";
  lastActive: Date;
  createdAt: Date;
  tags: string[];
  notes: Array<{
    id: string;
    content: string;
    authorId: string;
    createdAt: Date;
  }>;
  salaryExpectation?: {
    min: number;
    max: number;
    currency: string;
  };
  workType: "full-time" | "part-time" | "contract" | "freelance";
  remotePreference: "remote" | "hybrid" | "onsite";
}

interface CandidateWithMatch extends CandidateProfile {
  matchedJobs?: Array<{
    jobId: string;
    jobTitle: string;
    company: string;
    matchScore: number;
    matchReasons: string[];
  }>;
}

export default function CandidateManagement({
  user,
}: CandidateManagementProps) {
  assertExists(user, "User");
  assert(user.role === "recruiter", "User must be recruiter");

  const [candidates, setCandidates] = useState<CandidateWithMatch[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<
    CandidateWithMatch[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateWithMatch | null>(null);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    interviewing: 0,
    hired: 0,
    notInterested: 0,
    newThisWeek: 0,
    avgAiScore: 0,
  });

  useEffect(() => {
    loadCandidates();
  }, [user.id]);

  useEffect(() => {
    filterAndSortCandidates();
  }, [
    candidates,
    searchQuery,
    statusFilter,
    locationFilter,
    skillsFilter,
    sortBy,
  ]);

  const loadCandidates = async () => {
    try {
      setIsLoading(true);
      logger.info("Loading candidates", { userId: user.id, role: user.role });

      // In a real app, this would fetch from an API
      const mockCandidates = generateMockCandidates();
      setCandidates(mockCandidates);
      calculateStats(mockCandidates);

      logger.info("Candidates loaded successfully", {
        count: mockCandidates.length,
      });
    } catch (error) {
      logger.error("Failed to load candidates", { error });
      toast({
        title: "Error",
        description: "Failed to load candidates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockCandidates = (): CandidateWithMatch[] => {
    const baseDate = new Date();

    return [
      {
        id: "candidate-1",
        name: "Sarah Chen",
        email: "sarah.chen@email.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        headline: "Senior React Developer with 6+ years experience",
        summary:
          "Passionate frontend developer with expertise in React, TypeScript, and modern web technologies. Led multiple teams to deliver high-impact products used by millions of users. Strong focus on performance optimization and user experience.",
        skills: [
          "React",
          "TypeScript",
          "JavaScript",
          "Node.js",
          "GraphQL",
          "Redux",
          "Jest",
          "CSS",
          "Webpack",
        ],
        experience: [
          {
            company: "TechCorp",
            title: "Senior Frontend Developer",
            duration: "2021 - Present",
            current: true,
            description:
              "Led frontend development for a React-based dashboard serving 2M+ users. Improved page load times by 40% through optimization.",
          },
          {
            company: "StartupXYZ",
            title: "Frontend Developer",
            duration: "2019 - 2021",
            current: false,
            description:
              "Built responsive web applications using React and TypeScript. Collaborated with design team to implement pixel-perfect UIs.",
          },
          {
            company: "WebSolutions",
            title: "Junior Frontend Developer",
            duration: "2017 - 2019",
            current: false,
            description:
              "Developed and maintained client websites using HTML, CSS, and JavaScript. Learned React and modern development practices.",
          },
        ],
        education: [
          {
            institution: "UC Berkeley",
            degree: "BS Computer Science",
            field: "Computer Science",
            year: "2017",
          },
        ],
        aiScore: 94,
        matchReasons: [
          "Strong React and TypeScript experience",
          "Leadership experience in similar roles",
          "Located in target market",
          "Relevant education background",
        ],
        portfolioUrl: "https://sarahchen.dev",
        linkedinUrl: "https://linkedin.com/in/sarahchen",
        githubUrl: "https://github.com/sarahchen",
        resumeUrl: "https://example.com/sarah-chen-resume.pdf",
        status: "available",
        lastActive: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        tags: ["frontend", "react", "senior", "team-lead"],
        notes: [
          {
            id: "note-1",
            content: "Excellent React portfolio, strong communication skills",
            authorId: user.id,
            createdAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
          },
        ],
        salaryExpectation: {
          min: 130000,
          max: 180000,
          currency: "USD",
        },
        workType: "full-time",
        remotePreference: "hybrid",
        matchedJobs: [
          {
            jobId: "job-1",
            jobTitle: "Senior Frontend Developer",
            company: "TechFlow Inc",
            matchScore: 94,
            matchReasons: [
              "Perfect React/TypeScript match",
              "Leadership experience required",
              "San Francisco location preference",
            ],
          },
          {
            jobId: "job-2",
            jobTitle: "Lead Frontend Engineer",
            company: "InnovateTech",
            matchScore: 89,
            matchReasons: [
              "Frontend leadership role",
              "React/TypeScript stack",
              "Team management experience",
            ],
          },
        ],
      },
      {
        id: "candidate-2",
        name: "Michael Rodriguez",
        email: "m.rodriguez@email.com",
        phone: "+1 (555) 234-5678",
        location: "New York, NY",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        headline: "Full Stack Engineer specializing in React and Node.js",
        summary:
          "Full stack developer with 5+ years of experience building scalable web applications. Proficient in both frontend and backend technologies with a strong understanding of system architecture and database design.",
        skills: [
          "React",
          "Node.js",
          "PostgreSQL",
          "AWS",
          "Docker",
          "TypeScript",
          "Express",
          "MongoDB",
          "Redis",
        ],
        experience: [
          {
            company: "DataFlow Inc",
            title: "Full Stack Engineer",
            duration: "2020 - Present",
            current: true,
            description:
              "Developed and maintained full-stack applications using React, Node.js, and PostgreSQL. Built scalable APIs serving 500K+ requests daily.",
          },
          {
            company: "WebSolutions",
            title: "Junior Developer",
            duration: "2018 - 2020",
            current: false,
            description:
              "Started as junior developer, quickly progressed to full-stack development. Built responsive web applications and RESTful APIs.",
          },
        ],
        education: [
          {
            institution: "NYU",
            degree: "BS Information Systems",
            field: "Information Systems",
            year: "2018",
          },
        ],
        aiScore: 89,
        matchReasons: [
          "Full stack capabilities",
          "Experience with desired tech stack",
          "Strong problem-solving skills",
          "API development experience",
        ],
        portfolioUrl: "https://michaelrod.io",
        linkedinUrl: "https://linkedin.com/in/michaelrodriguez",
        githubUrl: "https://github.com/mrodriguez",
        resumeUrl: "https://example.com/michael-rodriguez-resume.pdf",
        status: "interviewing",
        lastActive: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(baseDate.getTime() - 45 * 24 * 60 * 60 * 1000),
        tags: ["fullstack", "nodejs", "react", "experienced"],
        notes: [
          {
            id: "note-2",
            content: "Great technical interview, proceeding to final round",
            authorId: user.id,
            createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
        salaryExpectation: {
          min: 120000,
          max: 160000,
          currency: "USD",
        },
        workType: "full-time",
        remotePreference: "remote",
        matchedJobs: [
          {
            jobId: "job-3",
            jobTitle: "Full Stack Developer",
            company: "TechStartup",
            matchScore: 92,
            matchReasons: [
              "Perfect full-stack match",
              "Node.js expertise",
              "Remote work preference",
            ],
          },
        ],
      },
      {
        id: "candidate-3",
        name: "Emily Johnson",
        email: "emily.j@email.com",
        phone: "+1 (555) 345-6789",
        location: "Austin, TX",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        headline: "Product Designer with 5+ years in UX/UI",
        summary:
          "Creative product designer focused on user-centered design principles. Experienced in designing for both web and mobile platforms with strong skills in user research, prototyping, and design systems.",
        skills: [
          "Figma",
          "Sketch",
          "Prototyping",
          "User Research",
          "Design Systems",
          "Adobe Creative Suite",
          "InVision",
          "Miro",
          "Usability Testing",
        ],
        experience: [
          {
            company: "DesignStudio Pro",
            title: "Senior Product Designer",
            duration: "2021 - Present",
            current: true,
            description:
              "Lead design for B2B SaaS platform with 10K+ users. Conducted user research and created design systems that improved user satisfaction by 30%.",
          },
          {
            company: "CreativeAgency",
            title: "UX Designer",
            duration: "2019 - 2021",
            current: false,
            description:
              "Designed user experiences for various client projects including e-commerce platforms and mobile applications.",
          },
        ],
        education: [
          {
            institution: "Art Institute",
            degree: "BFA Graphic Design",
            field: "Graphic Design",
            year: "2019",
          },
        ],
        aiScore: 87,
        matchReasons: [
          "Strong design portfolio",
          "User research experience",
          "B2B SaaS experience",
          "Design systems expertise",
        ],
        portfolioUrl: "https://emilyj.design",
        linkedinUrl: "https://linkedin.com/in/emilyjohnson",
        resumeUrl: "https://example.com/emily-johnson-resume.pdf",
        status: "available",
        lastActive: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000),
        tags: ["design", "ux", "ui", "research"],
        notes: [],
        salaryExpectation: {
          min: 95000,
          max: 140000,
          currency: "USD",
        },
        workType: "full-time",
        remotePreference: "hybrid",
        matchedJobs: [
          {
            jobId: "job-4",
            jobTitle: "Senior UX Designer",
            company: "ProductCo",
            matchScore: 90,
            matchReasons: [
              "UX/UI expertise",
              "B2B SaaS experience",
              "User research skills",
            ],
          },
        ],
      },
      {
        id: "candidate-4",
        name: "David Park",
        email: "david.park@email.com",
        phone: "+1 (555) 456-7890",
        location: "Seattle, WA",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        headline: "DevOps Engineer with AWS and Kubernetes expertise",
        summary:
          "DevOps engineer with strong background in cloud infrastructure, automation, and CI/CD pipelines. Experienced in managing large-scale production environments and implementing best practices for reliability and security.",
        skills: [
          "AWS",
          "Docker",
          "Kubernetes",
          "Terraform",
          "Python",
          "Jenkins",
          "Ansible",
          "Prometheus",
          "Grafana",
        ],
        experience: [
          {
            company: "CloudTech Solutions",
            title: "Senior DevOps Engineer",
            duration: "2020 - Present",
            current: true,
            description:
              "Manage AWS infrastructure for multiple applications serving millions of users. Reduced deployment time by 70% through automation.",
          },
          {
            company: "TechStartup",
            title: "DevOps Engineer",
            duration: "2018 - 2020",
            current: false,
            description:
              "Built CI/CD pipelines and managed cloud infrastructure. Implemented monitoring and alerting systems.",
          },
        ],
        education: [
          {
            institution: "University of Washington",
            degree: "BS Computer Engineering",
            field: "Computer Engineering",
            year: "2018",
          },
        ],
        aiScore: 91,
        matchReasons: [
          "AWS certification",
          "Kubernetes expertise",
          "CI/CD pipeline experience",
          "Infrastructure automation",
        ],
        portfolioUrl: "https://davidpark.dev",
        linkedinUrl: "https://linkedin.com/in/davidpark",
        githubUrl: "https://github.com/dpark",
        resumeUrl: "https://example.com/david-park-resume.pdf",
        status: "available",
        lastActive: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(baseDate.getTime() - 15 * 24 * 60 * 60 * 1000),
        tags: ["devops", "aws", "kubernetes", "automation"],
        notes: [
          {
            id: "note-3",
            content: "Strong DevOps background, AWS certified",
            authorId: user.id,
            createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
        salaryExpectation: {
          min: 115000,
          max: 160000,
          currency: "USD",
        },
        workType: "full-time",
        remotePreference: "remote",
        matchedJobs: [
          {
            jobId: "job-5",
            jobTitle: "Senior DevOps Engineer",
            company: "ScaleTech",
            matchScore: 95,
            matchReasons: [
              "Perfect DevOps match",
              "AWS expertise",
              "Kubernetes experience",
            ],
          },
        ],
      },
      {
        id: "candidate-5",
        name: "Jessica Martinez",
        email: "jessica.martinez@email.com",
        phone: "+1 (555) 567-8901",
        location: "Boston, MA",
        avatar:
          "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face",
        headline: "Data Scientist with Machine Learning focus",
        summary:
          "Data scientist with expertise in machine learning, statistical analysis, and data visualization. Experienced in building predictive models and extracting insights from large datasets to drive business decisions.",
        skills: [
          "Python",
          "SQL",
          "TensorFlow",
          "Pandas",
          "Jupyter",
          "R",
          "Tableau",
          "Apache Spark",
          "scikit-learn",
        ],
        experience: [
          {
            company: "Analytics Pro",
            title: "Senior Data Scientist",
            duration: "2021 - Present",
            current: true,
            description:
              "Built ML models that increased customer retention by 25%. Led data science initiatives for product recommendations and fraud detection.",
          },
          {
            company: "DataCorp",
            title: "Data Analyst",
            duration: "2019 - 2021",
            current: false,
            description:
              "Analyzed business data to identify trends and opportunities. Created dashboards and reports for executive leadership.",
          },
        ],
        education: [
          {
            institution: "MIT",
            degree: "MS Data Science",
            field: "Data Science",
            year: "2019",
          },
          {
            institution: "Boston University",
            degree: "BS Mathematics",
            field: "Mathematics",
            year: "2017",
          },
        ],
        aiScore: 93,
        matchReasons: [
          "Advanced degree in data science",
          "Machine learning expertise",
          "Strong analytical skills",
          "Business impact experience",
        ],
        portfolioUrl: "https://jessicam.ai",
        linkedinUrl: "https://linkedin.com/in/jessicamartinez",
        githubUrl: "https://github.com/jmartinez",
        resumeUrl: "https://example.com/jessica-martinez-resume.pdf",
        status: "hired",
        lastActive: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000),
        tags: ["data-science", "ml", "python", "analytics"],
        notes: [
          {
            id: "note-4",
            content: "Hired for Data Scientist position at Analytics Pro",
            authorId: user.id,
            createdAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        ],
        salaryExpectation: {
          min: 125000,
          max: 175000,
          currency: "USD",
        },
        workType: "full-time",
        remotePreference: "hybrid",
        matchedJobs: [],
      },
      {
        id: "candidate-6",
        name: "Alex Thompson",
        email: "alex.thompson@email.com",
        phone: "+1 (555) 678-9012",
        location: "Los Angeles, CA",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        headline: "Backend Engineer with 4+ years experience",
        summary:
          "Backend engineer specializing in API development and microservices architecture. Strong experience with cloud platforms and database optimization for high-performance applications.",
        skills: [
          "Python",
          "Django",
          "PostgreSQL",
          "Redis",
          "AWS",
          "Docker",
          "FastAPI",
          "Celery",
          "GraphQL",
        ],
        experience: [
          {
            company: "APIWorks",
            title: "Backend Engineer",
            duration: "2020 - Present",
            current: true,
            description:
              "Developed and maintained RESTful APIs serving 1M+ requests daily. Optimized database queries reducing response time by 50%.",
          },
          {
            company: "StartupDev",
            title: "Junior Backend Developer",
            duration: "2019 - 2020",
            current: false,
            description:
              "Built backend services for mobile applications. Implemented authentication and payment processing systems.",
          },
        ],
        education: [
          {
            institution: "UCLA",
            degree: "BS Computer Science",
            field: "Computer Science",
            year: "2019",
          },
        ],
        aiScore: 82,
        matchReasons: [
          "Strong backend development skills",
          "API design experience",
          "Cloud platform knowledge",
          "Database optimization expertise",
        ],
        portfolioUrl: "https://alexthompson.dev",
        linkedinUrl: "https://linkedin.com/in/alexthompson",
        githubUrl: "https://github.com/athompson",
        resumeUrl: "https://example.com/alex-thompson-resume.pdf",
        status: "not_interested",
        lastActive: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000),
        tags: ["backend", "python", "api", "database"],
        notes: [
          {
            id: "note-5",
            content: "Not interested in relocating, prefers LA area only",
            authorId: user.id,
            createdAt: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000),
          },
        ],
        salaryExpectation: {
          min: 100000,
          max: 140000,
          currency: "USD",
        },
        workType: "full-time",
        remotePreference: "onsite",
        matchedJobs: [],
      },
    ];
  };

  const calculateStats = (candidateList: CandidateWithMatch[]) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const stats = {
      total: candidateList.length,
      available: candidateList.filter((c) => c.status === "available").length,
      interviewing: candidateList.filter((c) => c.status === "interviewing")
        .length,
      hired: candidateList.filter((c) => c.status === "hired").length,
      notInterested: candidateList.filter((c) => c.status === "not_interested")
        .length,
      newThisWeek: candidateList.filter((c) => c.createdAt > oneWeekAgo).length,
      avgAiScore:
        candidateList.reduce((sum, c) => sum + (c.aiScore || 0), 0) /
        candidateList.length,
    };
    setStats(stats);
  };

  const filterAndSortCandidates = () => {
    let filtered = candidates;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candidate.headline
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          candidate.skills.some((skill) =>
            skill.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (candidate) => candidate.status === statusFilter,
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter((candidate) =>
        candidate.location.toLowerCase().includes(locationFilter.toLowerCase()),
      );
    }

    // Skills filter
    if (skillsFilter.length > 0) {
      filtered = filtered.filter((candidate) =>
        skillsFilter.every((skill) =>
          candidate.skills.some((candidateSkill) =>
            candidateSkill.toLowerCase().includes(skill.toLowerCase()),
          ),
        ),
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "aiScore":
        filtered.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "lastActive":
        filtered.sort(
          (a, b) =>
            new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
        );
        break;
    }

    setFilteredCandidates(filtered);
  };

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates([...selectedCandidates, candidateId]);
    } else {
      setSelectedCandidates(
        selectedCandidates.filter((id) => id !== candidateId),
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(filteredCandidates.map((c) => c.id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      logger.info("Performing bulk action", {
        action,
        candidateIds: selectedCandidates,
      });

      switch (action) {
        case "contact":
          toast({
            title: "Bulk Contact",
            description: `Contact requests sent to ${selectedCandidates.length} candidates.`,
          });
          break;
        case "add_to_list":
          toast({
            title: "Added to List",
            description: `${selectedCandidates.length} candidates added to your list.`,
          });
          break;
        case "export":
          toast({
            title: "Export Started",
            description: `Exporting ${selectedCandidates.length} candidate profiles...`,
          });
          break;
        case "tag":
          const tag = prompt("Enter tag name:");
          if (tag) {
            toast({
              title: "Tags Added",
              description: `Tag "${tag}" added to ${selectedCandidates.length} candidates.`,
            });
          }
          break;
      }

      setSelectedCandidates([]);
    } catch (error) {
      logger.error("Bulk action failed", { error, action });
      toast({
        title: "Action Failed",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContactCandidate = async (candidate: CandidateWithMatch) => {
    setSelectedCandidate(candidate);
    setContactMessage(
      `Hi ${candidate.name.split(" ")[0]},\n\nI came across your profile and was impressed by your experience with ${candidate.skills.slice(0, 3).join(", ")}. We have an exciting opportunity that might be a great fit for your background.\n\nWould you be interested in learning more?\n\nBest regards,\n${user.firstName} ${user.lastName}`,
    );
    setShowContactModal(true);
  };

  const handleSendMessage = async () => {
    try {
      if (!selectedCandidate) return;

      logger.info("Sending message to candidate", {
        candidateId: selectedCandidate.id,
        message: contactMessage,
      });

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${selectedCandidate.name}.`,
      });

      setShowContactModal(false);
      setContactMessage("");
      setSelectedCandidate(null);
    } catch (error) {
      logger.error("Failed to send message", { error });
      toast({
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (candidate: CandidateWithMatch) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetails(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-success text-success-foreground">
            Available
          </Badge>
        );
      case "interviewing":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Interviewing
          </Badge>
        );
      case "hired":
        return <Badge className="bg-info text-info-foreground">Hired</Badge>;
      case "not_interested":
        return <Badge variant="secondary">Not Interested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAiScoreBadge = (score?: number) => {
    if (!score) return null;

    if (score >= 90) {
      return (
        <Badge className="bg-success text-success-foreground">
          Excellent ({score}%)
        </Badge>
      );
    } else if (score >= 80) {
      return (
        <Badge className="bg-info text-info-foreground">Good ({score}%)</Badge>
      );
    } else if (score >= 70) {
      return (
        <Badge className="bg-warning text-warning-foreground">
          Fair ({score}%)
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Poor ({score}%)</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading candidates...</p>
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
                Candidate Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Discover, manage, and track top talent with AI-powered matching
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => navigate("/search")}>
                <Search className="w-4 h-4 mr-2" />
                Find Candidates
              </Button>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Candidate
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {stats.total}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Candidates
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.available}
              </div>
              <div className="text-xs text-muted-foreground">Available</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.interviewing}
              </div>
              <div className="text-xs text-muted-foreground">Interviewing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.hired}
              </div>
              <div className="text-xs text-muted-foreground">Hired</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">
                {stats.notInterested}
              </div>
              <div className="text-xs text-muted-foreground">
                Not Interested
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-brand">
                {stats.newThisWeek}
              </div>
              <div className="text-xs text-muted-foreground">New This Week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(stats.avgAiScore)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg AI Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="aiScore">AI Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="lastActive">Last Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedCandidates.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {selectedCandidates.length} selected
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Actions
                    <MoreHorizontal className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkAction("contact")}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("add_to_list")}
                  >
                    <BookmarkPlus className="w-4 h-4 mr-2" />
                    Add to List
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("tag")}>
                    <Target className="w-4 h-4 mr-2" />
                    Add Tag
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Candidates List */}
        {filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Candidates Found
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || statusFilter !== "all" || locationFilter
                  ? "No candidates match your current filters. Try adjusting your search criteria."
                  : "Start building your candidate pipeline by searching for talent."}
              </p>
              <Button onClick={() => navigate("/search")}>
                <Search className="w-4 h-4 mr-2" />
                Find Candidates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All Header */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={
                        selectedCandidates.length === filteredCandidates.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      Select All ({filteredCandidates.length} candidates)
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredCandidates.length} of {candidates.length}{" "}
                    candidates
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Cards */}
            {filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidates.includes(candidate.id)}
                onSelect={handleSelectCandidate}
                onViewDetails={handleViewDetails}
                onContact={handleContactCandidate}
                getStatusBadge={getStatusBadge}
                getAiScoreBadge={getAiScoreBadge}
              />
            ))}
          </div>
        )}
      </div>

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <Dialog
          open={showCandidateDetails}
          onOpenChange={setShowCandidateDetails}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedCandidate.avatar} />
                  <AvatarFallback>
                    {selectedCandidate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedCandidate.name}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedCandidate.headline}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCandidate.email}</span>
                  </div>
                  {selectedCandidate.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCandidate.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedCandidate.location}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {getStatusBadge(selectedCandidate.status)}
                  {getAiScoreBadge(selectedCandidate.aiScore)}
                  <div className="text-sm text-muted-foreground">
                    Last active:{" "}
                    {selectedCandidate.lastActive.toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedCandidate.summary}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Experience</h3>
                <div className="space-y-4">
                  {selectedCandidate.experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-brand pl-4">
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-brand font-medium">{exp.company}</p>
                      <p className="text-sm text-muted-foreground">
                        {exp.duration}
                      </p>
                      {exp.description && (
                        <p className="text-sm mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Education</h3>
                <div className="space-y-2">
                  {selectedCandidate.education.map((edu, index) => (
                    <div key={index}>
                      <h4 className="font-semibold">{edu.degree}</h4>
                      <p className="text-brand font-medium">
                        {edu.institution}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {edu.field} {edu.year && `• ${edu.year}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Jobs */}
              {selectedCandidate.matchedJobs &&
                selectedCandidate.matchedJobs.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Matched Jobs ({selectedCandidate.matchedJobs.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedCandidate.matchedJobs.map((match, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{match.jobTitle}</h4>
                            <Badge className="bg-success text-success-foreground">
                              {match.matchScore}% Match
                            </Badge>
                          </div>
                          <p className="text-brand font-medium mb-2">
                            {match.company}
                          </p>
                          <div className="text-sm text-muted-foreground">
                            <strong>Match reasons:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {match.matchReasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCandidateDetails(false)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedCandidate.portfolioUrl) {
                      window.open(selectedCandidate.portfolioUrl, "_blank");
                    }
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Portfolio
                </Button>
                <Button
                  onClick={() => {
                    setShowCandidateDetails(false);
                    handleContactCandidate(selectedCandidate);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Contact {selectedCandidate?.name.split(" ")[0]}
            </DialogTitle>
            <DialogDescription>
              Send a personalized message to this candidate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                className="w-full mt-1 p-3 border rounded-md min-h-[200px]"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Write your message here..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowContactModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Candidate Card Component
function CandidateCard({
  candidate,
  isSelected,
  onSelect,
  onViewDetails,
  onContact,
  getStatusBadge,
  getAiScoreBadge,
}: {
  candidate: CandidateWithMatch;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onViewDetails: (candidate: CandidateWithMatch) => void;
  onContact: (candidate: CandidateWithMatch) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getAiScoreBadge: (score?: number) => React.ReactNode;
}) {
  const isNewCandidate = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return candidate.createdAt > oneWeekAgo;
  };

  const getActivityStatus = () => {
    const now = new Date();
    const diffInDays =
      (now.getTime() - candidate.lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays <= 1) return { status: "active", color: "text-green-600" };
    if (diffInDays <= 7) return { status: "recent", color: "text-yellow-600" };
    return { status: "inactive", color: "text-gray-400" };
  };

  const activityStatus = getActivityStatus();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(candidate.id, !!checked)}
            />
            <Avatar className="w-16 h-16">
              <AvatarImage src={candidate.avatar} />
              <AvatarFallback>
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {candidate.name}
                  </h3>
                  {isNewCandidate() && (
                    <Badge variant="outline" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-brand font-medium">{candidate.headline}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(candidate.status)}
                {getAiScoreBadge(candidate.aiScore)}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {candidate.location}
              </div>
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                {candidate.experience[0]?.title} at{" "}
                {candidate.experience[0]?.company}
              </div>
              <div className={`flex items-center ${activityStatus.color}`}>
                <Clock className="w-4 h-4 mr-1" />
                Last active {candidate.lastActive.toLocaleDateString()}
              </div>
            </div>

            <p className="text-muted-foreground mb-4 line-clamp-2">
              {candidate.summary}
            </p>

            <div className="flex items-center space-x-2 mb-4">
              {candidate.skills.slice(0, 6).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills.length - 6} more
                </Badge>
              )}
            </div>

            {candidate.matchedJobs && candidate.matchedJobs.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">
                  Matched Jobs ({candidate.matchedJobs.length}):
                </p>
                <div className="space-y-1">
                  {candidate.matchedJobs.slice(0, 2).map((match, index) => (
                    <div
                      key={index}
                      className="text-xs text-muted-foreground flex items-center justify-between"
                    >
                      <span>
                        {match.jobTitle} at {match.company}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {match.matchScore}%
                      </Badge>
                    </div>
                  ))}
                  {candidate.matchedJobs.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{candidate.matchedJobs.length - 2} more matches
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {candidate.portfolioUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={candidate.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Portfolio
                    </a>
                  </Button>
                )}
                {candidate.linkedinUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(candidate)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                <Button size="sm" onClick={() => onContact(candidate)}>
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
