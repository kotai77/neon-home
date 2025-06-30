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
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
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
} from "lucide-react";
import { User, Application, assert, assertExists } from "@/lib/types";
import { apiService, logger } from "@/lib/api";
import { aiService } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";

interface ApplicationManagementProps {
  user: User;
}

interface ApplicationWithDetails extends Application {
  applicantName: string;
  applicantEmail: string;
  applicantAvatar?: string;
  applicantPhone?: string;
  applicantLocation?: string;
  applicantExperience?: string;
  applicantSkills: string[];
  jobTitle: string;
  company: string;
  jobLocation?: string;
}

export default function ApplicationManagement({
  user,
}: ApplicationManagementProps) {
  assertExists(user, "User");

  const [applications, setApplications] = useState<ApplicationWithDetails[]>(
    [],
  );
  const [filteredApplications, setFilteredApplications] = useState<
    ApplicationWithDetails[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationWithDetails | null>(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    interview: 0,
    offered: 0,
    rejected: 0,
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, [user.id]);

  useEffect(() => {
    filterAndSortApplications();
  }, [applications, searchQuery, statusFilter, sortBy]);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      logger.info("Loading applications", { userId: user.id, role: user.role });

      const response = await apiService.getApplications();

      if (response.success && response.data) {
        // For demo purposes, always use mock applications to ensure Sarah Chen appears
        const applicationsData = generateMockApplications();
        const enrichedApplications =
          await enrichApplicationsData(applicationsData);
        setApplications(enrichedApplications);
        calculateStats(enrichedApplications);
        logger.info("Applications loaded successfully", {
          count: enrichedApplications.length,
        });
      } else {
        throw new Error(response.error || "Failed to load applications");
      }
    } catch (error) {
      logger.error("Failed to load applications", { error });
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive",
      });
      // Set mock data as fallback
      const mockApplications = await enrichApplicationsData(
        generateMockApplications(),
      );
      setApplications(mockApplications);
      calculateStats(mockApplications);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockApplications = (): Application[] => {
    const baseDate = new Date();

    // For applicants, show only their own applications
    if (user.role === "applicant") {
      // Get applications from localStorage (newly applied jobs)
      const applicationsKey = `applications_${user.id}`;
      const storedApplications = JSON.parse(
        localStorage.getItem(applicationsKey) || "[]",
      );

      // Convert stored applications to proper format
      const newApplications = storedApplications.map((app: any) => ({
        ...app,
        appliedAt: new Date(app.appliedAt),
        updatedAt: new Date(app.updatedAt),
      }));

      // Combine with existing mock applications
      const mockApplications = [
        {
          id: "app-my-1",
          jobId: "job-1",
          applicantId: user.id, // Use actual user ID
          status: "pending",
          coverLetter:
            "I am excited to apply for the Senior Frontend Developer position at TechCorp. With my experience in React and TypeScript, I am confident I can contribute significantly to your team. I have worked on several large-scale applications and am passionate about creating exceptional user experiences.",
          resumeUrl: "https://example.com/my-resume.pdf",
          aiScore: 85,
          aiAnalysis:
            "Strong technical background with relevant experience in React and TypeScript. Candidate shows excellent problem-solving skills and has worked on projects of similar scale.",
          notes: [],
          appliedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: "app-my-2",
          jobId: "job-2",
          applicantId: user.id,
          status: "interview",
          coverLetter:
            "I would love to transition into product management. My technical background gives me a unique perspective on product development, and I have been working closely with product teams in my current role to understand user needs and prioritize features.",
          resumeUrl: "https://example.com/my-pm-resume.pdf",
          aiScore: 72,
          aiAnalysis:
            "Interesting career transition candidate with strong technical background. Interview scheduled to assess product thinking and leadership potential.",
          notes: [
            {
              id: "note-my-1",
              authorId: "recruiter-1",
              content: "Product sense interview scheduled for Monday 10AM",
              createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
            },
          ],
          appliedAt: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: "app-my-3",
          jobId: "job-4",
          applicantId: user.id,
          status: "reviewing",
          coverLetter:
            "I am applying for the UX/UI Designer position at DesignStudio. With my background in both technical development and design thinking, I can bridge the gap between design and implementation to create beautiful and functional user experiences.",
          resumeUrl: "https://example.com/my-design-resume.pdf",
          aiScore: 79,
          aiAnalysis:
            "Unique candidate with both technical and design background. Portfolio shows promising design work with good understanding of implementation constraints.",
          notes: [
            {
              id: "note-my-2",
              authorId: "recruiter-2",
              content:
                "Portfolio review in progress, strong technical background noted",
              createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
            },
          ],
          appliedAt: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: "app-my-4",
          jobId: "job-5",
          applicantId: user.id,
          status: "rejected",
          coverLetter:
            "I am interested in the DevOps Engineer position at CloudTech Solutions. While my background is primarily in frontend development, I have been learning cloud infrastructure and DevOps practices and am eager to transition into this field.",
          resumeUrl: "https://example.com/my-devops-resume.pdf",
          aiScore: 45,
          aiAnalysis:
            "Candidate has strong software development background but lacks relevant DevOps experience and cloud infrastructure knowledge required for this position.",
          notes: [
            {
              id: "note-my-3",
              authorId: "recruiter-3",
              content:
                "Skills don't align with DevOps requirements. Suggested to gain more cloud experience first.",
              createdAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
            },
          ],
          appliedAt: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: "app-my-5",
          jobId: "job-6",
          applicantId: user.id,
          status: "offered",
          coverLetter:
            "I am thrilled to apply for the Data Scientist position at Analytics Pro. My experience with Python, machine learning, and data analysis, combined with my software development background, makes me well-suited for building data-driven solutions that solve real-world problems.",
          resumeUrl: "https://example.com/my-data-resume.pdf",
          aiScore: 91,
          aiAnalysis:
            "Excellent candidate with strong technical foundation and demonstrated experience with data science tools and methodologies. Offer extended based on outstanding interview performance.",
          notes: [
            {
              id: "note-my-4",
              authorId: "recruiter-4",
              content:
                "Offer extended - $125k base salary + equity package. Waiting for response.",
              createdAt: new Date(),
            },
          ],
          appliedAt: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];

      // Combine new applications with mock applications, with new applications first
      return [...newApplications, ...mockApplications];
    }

    // For recruiters, show applications to their jobs
    return [
      {
        id: "app-1",
        jobId: "job-1",
        applicantId: "applicant-1",
        status: "pending",
        coverLetter:
          "I am excited to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience in React and TypeScript, I am confident I can contribute significantly to your team. I have worked on several large-scale applications and am passionate about creating exceptional user experiences.",
        resumeUrl: "https://example.com/sarah-chen-resume.pdf",
        aiScore: 85,
        aiAnalysis:
          "Strong technical background with relevant experience in React and TypeScript. Candidate shows excellent problem-solving skills and has worked on projects of similar scale.",
        notes: [],
        appliedAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago to match dashboard
        updatedAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        id: "app-2",
        jobId: "job-2",
        applicantId: "applicant-2",
        status: "reviewing",
        coverLetter:
          "Your company's mission to revolutionize fintech aligns perfectly with my career goals. As a seasoned Product Manager with 7+ years of experience, I have successfully launched multiple products that generated millions in revenue. I would love to bring my expertise in agile methodologies and data-driven decision making to StartupXYZ.",
        resumeUrl: "https://example.com/michael-rodriguez-resume.pdf",
        aiScore: 92,
        aiAnalysis:
          "Excellent candidate with strong leadership experience and technical skills. Has successfully managed cross-functional teams and delivered complex products on time.",
        notes: [
          {
            id: "note-1",
            authorId: user.id,
            content:
              "Great portfolio, scheduling initial interview for next week",
            createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
        appliedAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: "app-3",
        jobId: "job-3",
        applicantId: "applicant-3",
        status: "interview",
        coverLetter:
          "I am thrilled to apply for the Backend Engineer position at DataFlow Inc. My experience with Python, machine learning, and data analysis makes me an ideal fit for building scalable backend systems that power data analytics platforms. I am particularly excited about working with cloud infrastructure and designing robust architectures.",
        resumeUrl: "https://example.com/emily-johnson-resume.pdf",
        aiScore: 78,
        aiAnalysis:
          "Good technical background with relevant Python and data experience. Interview scheduled to assess problem-solving approach and system design skills.",
        notes: [
          {
            id: "note-2",
            authorId: user.id,
            content: "Technical interview scheduled for Friday 2PM",
            createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
        appliedAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: "app-4",
        jobId: "job-4",
        applicantId: "applicant-4",
        status: "offered",
        coverLetter:
          "This UX/UI Designer role at DesignStudio represents the perfect next step in my career. With 6+ years of experience in user-centered design and a strong portfolio of successful mobile and web applications, I am excited to collaborate with your product and engineering teams to create beautiful and intuitive user experiences.",
        resumeUrl: "https://example.com/david-kim-resume.pdf",
        aiScore: 95,
        aiAnalysis:
          "Outstanding candidate with exceptional design portfolio and strong user research background. Offer extended based on excellent interview performance.",
        notes: [
          {
            id: "note-3",
            authorId: user.id,
            content: "Offer extended - $120k base salary + equity package",
            createdAt: new Date(),
          },
        ],
        appliedAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "app-5",
        jobId: "job-5",
        applicantId: "applicant-5",
        status: "reviewing",
        coverLetter:
          "I am excited to apply for the DevOps Engineer position at CloudTech Solutions. My experience with AWS, Docker, and Kubernetes aligns perfectly with your requirements. I have successfully managed cloud infrastructure for high-traffic applications and implemented CI/CD pipelines that improved deployment efficiency by 70%.",
        resumeUrl: "https://example.com/jessica-park-resume.pdf",
        aiScore: 88,
        aiAnalysis:
          "Strong DevOps background with relevant cloud infrastructure experience. Candidate demonstrates good understanding of modern deployment practices.",
        notes: [
          {
            id: "note-4",
            authorId: user.id,
            content:
              "Resume looks promising, need to verify AWS certifications",
            createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
        appliedAt: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: "app-6",
        jobId: "job-6",
        applicantId: "applicant-6",
        status: "reviewing",
        coverLetter:
          "I am passionate about data science and excited to apply for the Data Scientist position at Analytics Pro. My strong background in statistics, machine learning, and data visualization, combined with my experience in Python and SQL, positions me well to extract valuable insights from complex datasets and drive data-informed business decisions.",
        resumeUrl: "https://example.com/alex-thompson-resume.pdf",
        aiScore: 83,
        aiAnalysis:
          "Solid data science background with relevant technical skills. Experience in business analytics could be valuable for understanding stakeholder requirements.",
        notes: [
          {
            id: "note-5",
            authorId: user.id,
            content: "Technical assessment completed, reviewing results",
            createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
        appliedAt: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: "app-7",
        jobId: "job-7",
        applicantId: "applicant-7",
        status: "rejected",
        coverLetter:
          "I am interested in applying for your Marketing Manager position. While my background is primarily in technical roles, I have been developing marketing skills through online courses and side projects. I believe my analytical mindset and understanding of technology products could bring a unique perspective to your marketing team.",
        resumeUrl: "https://example.com/candidate-resume.pdf",
        aiScore: 42,
        aiAnalysis:
          "Candidate shows interest in career transition but lacks relevant marketing experience and demonstrated skills required for this senior-level position.",
        notes: [
          {
            id: "note-6",
            authorId: user.id,
            content:
              "Insufficient marketing experience for this role. Suggested entry-level positions to gain experience.",
            createdAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
          },
        ],
        appliedAt: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: "app-8",
        jobId: "job-8",
        applicantId: "applicant-8",
        status: "interview",
        coverLetter:
          "I am excited to apply for the Customer Support Specialist position at HelpDesk Pro. My strong communication skills, technical background, and passion for helping others make me an ideal candidate. I have experience troubleshooting technical issues and explaining complex concepts in simple terms to users of all technical levels.",
        resumeUrl: "https://example.com/support-candidate-resume.pdf",
        aiScore: 76,
        aiAnalysis:
          "Good candidate with relevant communication skills and technical aptitude. Phone interview scheduled to assess customer service approach and problem-solving abilities.",
        notes: [
          {
            id: "note-7",
            authorId: user.id,
            content: "Phone interview scheduled for Wednesday 3PM",
            createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
        appliedAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ];
  };

  const enrichApplicationsData = async (
    applications: Application[],
  ): Promise<ApplicationWithDetails[]> => {
    // In a real app, this would fetch applicant and job details from APIs
    const mockApplicants = [
      {
        id: "applicant-1",
        name: "Sarah Chen",
        email: "sarah.chen@email.com",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        experience: "5+ years",
        skills: ["React", "TypeScript", "Node.js", "GraphQL"],
      },
      {
        id: "applicant-2",
        name: "Michael Rodriguez",
        email: "m.rodriguez@email.com",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        phone: "+1 (555) 234-5678",
        location: "New York, NY",
        experience: "7+ years",
        skills: ["Product Management", "Agile", "Analytics", "Strategy"],
      },
      {
        id: "applicant-3",
        name: "Emily Johnson",
        email: "emily.j@email.com",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        phone: "+1 (555) 345-6789",
        location: "Austin, TX",
        experience: "4+ years",
        skills: ["Python", "Machine Learning", "Data Analysis", "SQL"],
      },
      {
        id: "applicant-4",
        name: "David Kim",
        email: "david.kim@email.com",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        phone: "+1 (555) 456-7890",
        location: "Seattle, WA",
        experience: "6+ years",
        skills: ["UX/UI Design", "Figma", "User Research", "Prototyping"],
      },
      {
        id: "applicant-5",
        name: "Jessica Park",
        email: "jessica.park@email.com",
        avatar:
          "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face",
        phone: "+1 (555) 567-8901",
        location: "Los Angeles, CA",
        experience: "3+ years",
        skills: ["DevOps", "AWS", "Docker", "Kubernetes"],
      },
      {
        id: "applicant-6",
        name: "Alex Thompson",
        email: "alex.thompson@email.com",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        phone: "+1 (555) 678-9012",
        location: "Boston, MA",
        experience: "8+ years",
        skills: ["Full Stack", "React", "Node.js", "PostgreSQL"],
      },
    ];

    const mockJobs = [
      {
        id: "job-1",
        title: "Senior Frontend Developer",
        company: "TechCorp",
        location: "San Francisco, CA",
      },
      {
        id: "job-2",
        title: "Product Manager",
        company: "StartupXYZ",
        location: "New York, NY",
      },
      {
        id: "job-3",
        title: "Backend Engineer",
        company: "DataFlow Inc",
        location: "Remote",
      },
      {
        id: "job-4",
        title: "UX/UI Designer",
        company: "DesignStudio",
        location: "Los Angeles, CA",
      },
      {
        id: "job-5",
        title: "DevOps Engineer",
        company: "CloudTech Solutions",
        location: "Seattle, WA",
      },
      {
        id: "job-6",
        title: "Data Scientist",
        company: "Analytics Pro",
        location: "Boston, MA",
      },
    ];

    return applications.map((app) => {
      const applicant = mockApplicants.find((a) => a.id === app.applicantId);
      const job = mockJobs.find((j) => j.id === app.jobId);

      // For applicants viewing their own applications, use their actual user data
      const isOwnApplication =
        user.role === "applicant" && app.applicantId === user.id;

      // Enhanced applicant data with better fallback names
      let applicantName = "Unknown Applicant";
      let applicantEmail = "unknown@email.com";
      let applicantAvatar = undefined;
      let applicantPhone = undefined;
      let applicantLocation = undefined;
      let applicantExperience = undefined;
      let applicantSkills: string[] = [];

      if (isOwnApplication) {
        // Use actual user data for their own applications
        applicantName = `${user.firstName} ${user.lastName}`;
        applicantEmail = user.email;
        applicantAvatar = user.avatar;
        applicantPhone = "+1 (555) 123-4567"; // Demo phone
        applicantLocation = "San Francisco, CA"; // Demo location
        applicantExperience = "5+ years"; // Demo experience
        applicantSkills = [
          "React",
          "TypeScript",
          "JavaScript",
          "Node.js",
          "HTML/CSS",
        ];
      } else if (applicant) {
        applicantName = applicant.name;
        applicantEmail = applicant.email;
        applicantAvatar = applicant.avatar;
        applicantPhone = applicant.phone;
        applicantLocation = applicant.location;
        applicantExperience = applicant.experience;
        applicantSkills = applicant.skills;
      } else {
        // Generate realistic fallback names based on application ID for consistency
        const fallbackNames = [
          "Sarah Chen",
          "Michael Rodriguez",
          "Emily Johnson",
          "David Kim",
          "Jessica Park",
          "Alex Thompson",
          "Rachel Williams",
          "James Brown",
          "Lisa Davis",
          "Kevin Wilson",
        ];
        const nameIndex =
          parseInt(app.id.replace(/[^0-9]/g, "") || "0") % fallbackNames.length;
        applicantName = fallbackNames[nameIndex];
        applicantEmail = `${applicantName
          .toLowerCase()
          .replace(" ", ".")}@email.com`;
        applicantSkills = ["JavaScript", "HTML", "CSS"];
      }

      // Enhanced job data with better fallback
      let jobTitle = "Unknown Position";
      let company = "Unknown Company";
      let jobLocation = undefined;

      if (job) {
        jobTitle = job.title;
        company = job.company;
        jobLocation = job.location;
      } else if (app.jobTitle && app.company) {
        // For localStorage applications that have embedded job details
        jobTitle = app.jobTitle;
        company = app.company;
        jobLocation = app.jobLocation;
      } else {
        // Generate realistic fallback job data
        const fallbackJobs = [
          { title: "Frontend Developer", company: "TechCorp" },
          { title: "Product Manager", company: "StartupXYZ" },
          { title: "Backend Engineer", company: "DataFlow Inc" },
          { title: "UX Designer", company: "DesignStudio" },
          { title: "DevOps Engineer", company: "CloudTech" },
        ];
        const jobIndex =
          parseInt(app.jobId?.replace(/[^0-9]/g, "") || "0") %
          fallbackJobs.length;
        jobTitle = fallbackJobs[jobIndex].title;
        company = fallbackJobs[jobIndex].company;
      }

      return {
        ...app,
        applicantName,
        applicantEmail,
        applicantAvatar,
        applicantPhone,
        applicantLocation,
        applicantExperience,
        applicantSkills,
        jobTitle,
        company,
        jobLocation,
      };
    });
  };

  const calculateStats = (applications: ApplicationWithDetails[]) => {
    const stats = {
      total: applications.length,
      pending: applications.filter((app) => app.status === "pending").length,
      reviewing: applications.filter((app) => app.status === "reviewing")
        .length,
      interview: applications.filter((app) => app.status === "interview")
        .length,
      offered: applications.filter((app) => app.status === "offered").length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    };
    setStats(stats);
  };

  const filterAndSortApplications = () => {
    let filtered = applications;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.applicantEmail
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.company.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => {
          const dateA = new Date(a.appliedAt).getTime();
          const dateB = new Date(b.appliedAt).getTime();
          return dateB - dateA;
        });
        break;
      case "oldest":
        filtered.sort((a, b) => {
          const dateA = new Date(a.appliedAt).getTime();
          const dateB = new Date(b.appliedAt).getTime();
          return dateA - dateB;
        });
        break;
      case "score":
        filtered.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
        break;
      case "name":
        filtered.sort((a, b) => a.applicantName.localeCompare(b.applicantName));
        break;
    }

    setFilteredApplications(filtered);
  };

  const handleUpdateStatus = async (
    applicationId: string,
    newStatus: string,
  ) => {
    try {
      logger.info("Updating application status", { applicationId, newStatus });

      const response = await apiService.updateApplication(applicationId, {
        status: newStatus,
      });

      if (response.success && response.data) {
        toast({
          title: "Status Updated",
          description: `Application status changed to ${newStatus}.`,
        });

        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? { ...app, status: newStatus as any }
              : app,
          ),
        );

        logger.info("Application status updated successfully", {
          applicationId,
          newStatus,
        });
      } else {
        throw new Error(
          response.error || "Failed to update application status",
        );
      }
    } catch (error) {
      logger.error("Failed to update application status", {
        error,
        applicationId,
        newStatus,
      });
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAIAnalysis = async (applicationId: string) => {
    try {
      toast({
        title: "AI Analysis",
        description: "Analyzing application with AI...",
      });

      const response = await apiService.scoreApplication(applicationId);

      if (response.success && response.data) {
        toast({
          title: "AI Analysis Complete",
          description: `AI Score: ${response.data}/100`,
        });

        // Update local state with new AI score
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, aiScore: response.data } : app,
          ),
        );
      }
    } catch (error) {
      logger.error("AI analysis failed", { error });
      toast({
        title: "AI Analysis Failed",
        description: "Unable to analyze application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (application: ApplicationWithDetails) => {
    setSelectedApplication(application);
    setShowApplicationDetails(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "reviewing":
        return (
          <Badge className="bg-info text-info-foreground">Reviewing</Badge>
        );
      case "interview":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Interview
          </Badge>
        );
      case "offered":
        return (
          <Badge className="bg-success text-success-foreground">Offered</Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "withdrawn":
        return <Badge variant="outline">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreBadge = (score?: number) => {
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
              <p className="text-muted-foreground">Loading applications...</p>
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
          <h1 className="text-3xl font-bold text-foreground">
            {user.role === "recruiter"
              ? "Application Management"
              : "My Applications"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {user.role === "recruiter"
              ? "Review and manage candidate applications"
              : "Track and manage your job applications"}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {stats.total}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.role === "applicant" ? "Applied" : "Total"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {stats.pending}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.role === "applicant" ? "Awaiting Review" : "Pending"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {stats.reviewing}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.role === "applicant" ? "Under Review" : "Reviewing"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {stats.interview}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.role === "applicant" ? "Interviews" : "Interview"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {stats.offered}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.role === "applicant" ? "Offers" : "Offered"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {stats.rejected}
              </div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder={
                user.role === "applicant"
                  ? "Search my applications by company or position..."
                  : "Search applications by name, email, or position..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue
                placeholder={
                  user.role === "applicant"
                    ? "Filter my applications"
                    : "Filter by status"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {user.role === "applicant"
                  ? "All My Applications"
                  : "All Applications"}
              </SelectItem>
              <SelectItem value="pending">
                {user.role === "applicant" ? "Pending Review" : "Pending"}
              </SelectItem>
              <SelectItem value="reviewing">
                {user.role === "applicant" ? "Under Review" : "Reviewing"}
              </SelectItem>
              <SelectItem value="interview">
                {user.role === "applicant"
                  ? "Interview Scheduled"
                  : "Interview"}
              </SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                {user.role === "applicant"
                  ? "Recently Applied"
                  : "Newest First"}
              </SelectItem>
              <SelectItem value="oldest">
                {user.role === "applicant" ? "First Applied" : "Oldest First"}
              </SelectItem>
              <SelectItem value="score">
                {user.role === "applicant" ? "Match Score" : "AI Score"}
              </SelectItem>
              <SelectItem value="name">
                {user.role === "applicant" ? "Company Name" : "Name"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {user.role === "applicant"
                  ? "No Applications Found"
                  : "No Applications Found"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {user.role === "applicant"
                  ? statusFilter !== "all"
                    ? `No applications found with status "${statusFilter}". Try adjusting your filters.`
                    : "You haven't applied to any jobs yet. Start building your career today!"
                  : searchQuery
                    ? "No applications match your search criteria. Try adjusting your filters."
                    : "No applications have been received yet."}
              </p>
              {user.role === "applicant" && statusFilter === "all" && (
                <Button onClick={() => navigate("/jobs")} className="mt-4">
                  Browse Jobs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                user={user}
                onStatusUpdate={handleUpdateStatus}
                onAIAnalysis={handleAIAnalysis}
                onViewDetails={handleViewDetails}
                getStatusBadge={getStatusBadge}
                getScoreBadge={getScoreBadge}
              />
            ))}
          </div>
        )}

        {/* AI Insights for Recruiters */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {user.role === "recruiter" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-brand" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">High-Quality Candidates</p>
                      <p className="text-sm text-muted-foreground">
                        3 applications scored above 85% this week
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">Pending Reviews</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.pending} applications need initial review
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-info mt-0.5" />
                    <div>
                      <p className="font-medium">Response Time</p>
                      <p className="text-sm text-muted-foreground">
                        Average response time: 2.3 days
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.role === "recruiter" ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate("/jobs/new")}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Post New Job
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate("/search")}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search Candidates
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate("/analytics")}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate("/jobs")}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Browse Jobs
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate("/profile")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Update Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate("/search")}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI Job Matches
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <Dialog
          open={showApplicationDetails}
          onOpenChange={setShowApplicationDetails}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>
                  {user.role === "applicant"
                    ? `${selectedApplication.jobTitle} at ${selectedApplication.company}`
                    : `${selectedApplication.applicantName} - ${selectedApplication.jobTitle}`}
                </span>
              </DialogTitle>
              <DialogDescription>
                Application submitted on{" "}
                {new Date(selectedApplication.appliedAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Application Status & Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(selectedApplication.status)}
                </div>
                {selectedApplication.aiScore && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">AI Score:</span>
                    {getScoreBadge(selectedApplication.aiScore)}
                  </div>
                )}
              </div>

              {/* Application Stages */}
              <ApplicationStages
                currentStatus={selectedApplication.status}
                onStatusChange={(newStatus) =>
                  handleUpdateStatus(selectedApplication.id, newStatus)
                }
                user={user}
              />

              {user.role === "recruiter" && (
                <>
                  {/* Candidate Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Candidate Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={selectedApplication.applicantAvatar}
                          />
                          <AvatarFallback>
                            {selectedApplication.applicantName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {selectedApplication.applicantName}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="w-4 h-4 mr-2" />
                              {selectedApplication.applicantEmail}
                            </div>
                            {selectedApplication.applicantPhone && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="w-4 h-4 mr-2" />
                                {selectedApplication.applicantPhone}
                              </div>
                            )}
                            {selectedApplication.applicantLocation && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 mr-2" />
                                {selectedApplication.applicantLocation}
                              </div>
                            )}
                            {selectedApplication.applicantExperience && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Briefcase className="w-4 h-4 mr-2" />
                                {selectedApplication.applicantExperience}
                              </div>
                            )}
                          </div>
                          {selectedApplication.applicantSkills.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">
                                Skills:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {selectedApplication.applicantSkills.map(
                                  (skill) => (
                                    <Badge
                                      key={skill}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {skill}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Position Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Position Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold">
                    {selectedApplication.jobTitle}
                  </h4>
                  <p className="text-muted-foreground">
                    {selectedApplication.company}
                  </p>
                  {selectedApplication.jobLocation && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4 mr-2" />
                      {selectedApplication.jobLocation}
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Cover Letter</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    {selectedApplication.coverLetter}
                  </p>
                </div>
              </div>

              {/* AI Analysis */}
              {selectedApplication.aiAnalysis && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-brand" />
                    AI Analysis
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm leading-relaxed">
                      {selectedApplication.aiAnalysis}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedApplication.notes &&
                selectedApplication.notes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notes</h3>
                    <div className="space-y-3">
                      {selectedApplication.notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {note.authorId === user.id ? "You" : "Recruiter"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowApplicationDetails(false)}
                >
                  Close
                </Button>
                {user.role === "recruiter" &&
                  selectedApplication.status !== "rejected" &&
                  selectedApplication.status !== "offered" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleUpdateStatus(selectedApplication.id, "rejected")
                        }
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          const nextStatus =
                            selectedApplication.status === "pending"
                              ? "reviewing"
                              : selectedApplication.status === "reviewing"
                                ? "interview"
                                : "offered";
                          handleUpdateStatus(
                            selectedApplication.id,
                            nextStatus,
                          );
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {selectedApplication.status === "pending"
                          ? "Start Review"
                          : selectedApplication.status === "reviewing"
                            ? "Schedule Interview"
                            : "Make Offer"}
                      </Button>
                    </>
                  )}
                {user.role === "applicant" &&
                  selectedApplication.status === "offered" && (
                    <Button
                      onClick={() =>
                        toast({
                          title: "Offer Response",
                          description:
                            "This would typically allow you to accept or decline the offer.",
                        })
                      }
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Respond to Offer
                    </Button>
                  )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Application Card Component
function ApplicationCard({
  application,
  user,
  onStatusUpdate,
  onAIAnalysis,
  onViewDetails,
  getStatusBadge,
  getScoreBadge,
}: {
  application: ApplicationWithDetails;
  user: User;
  onStatusUpdate: (id: string, status: string) => void;
  onAIAnalysis: (id: string) => void;
  onViewDetails: (application: ApplicationWithDetails) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getScoreBadge: (score?: number) => React.ReactNode;
}) {
  const isNewApplication = () => {
    const now = new Date();
    const appliedDate = new Date(application.appliedAt);
    const diffInHours =
      (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24; // Consider "new" if applied within 24 hours
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {user.role === "recruiter" ? (
              <Avatar className="w-12 h-12">
                <AvatarImage src={application.applicantAvatar} />
                <AvatarFallback>
                  {application.applicantName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-brand" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold">
                  {user.role === "applicant"
                    ? `${application.jobTitle} at ${application.company}`
                    : application.applicantName}
                </h3>
                {isNewApplication() && (
                  <Badge variant="outline" className="text-xs">
                    New
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                {user.role === "applicant"
                  ? application.jobLocation || "Location not specified"
                  : `${application.jobTitle} • ${application.company}`}
              </p>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Applied {new Date(application.appliedAt).toLocaleDateString()}
                </div>
                {user.role === "recruiter" && application.applicantEmail && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {application.applicantEmail}
                  </div>
                )}
              </div>

              {user.role === "recruiter" &&
                application.applicantSkills.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {application.applicantSkills.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {application.applicantSkills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{application.applicantSkills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusBadge(application.status)}
                {application.aiScore && getScoreBadge(application.aiScore)}
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(application)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user.role === "recruiter" && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusUpdate(application.id, "reviewing")
                          }
                          disabled={application.status === "reviewing"}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Mark as Reviewing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusUpdate(application.id, "interview")
                          }
                          disabled={application.status === "interview"}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Interview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusUpdate(application.id, "offered")
                          }
                          disabled={application.status === "offered"}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Make Offer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusUpdate(application.id, "rejected")
                          }
                          disabled={application.status === "rejected"}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAIAnalysis(application.id)}
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          AI Analysis
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Download Resume
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Application Stages Component
function ApplicationStages({
  currentStatus,
  onStatusChange,
  user,
}: {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  user: User;
}) {
  const stages = [
    { key: "pending", label: "Application Received", icon: FileText },
    { key: "reviewing", label: "Under Review", icon: Eye },
    { key: "interview", label: "Interview Stage", icon: Calendar },
    { key: "offered", label: "Offer Extended", icon: CheckCircle },
  ];

  const getStageStatus = (stageKey: string) => {
    const stageOrder = ["pending", "reviewing", "interview", "offered"];
    const currentIndex = stageOrder.indexOf(currentStatus);
    const stageIndex = stageOrder.indexOf(stageKey);

    if (currentStatus === "rejected") {
      return stageIndex === 0 ? "completed" : "rejected";
    }

    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "current";
    return "pending";
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white border-green-500";
      case "current":
        return "bg-blue-500 text-white border-blue-500";
      case "rejected":
        return "bg-red-500 text-white border-red-500";
      default:
        return "bg-gray-200 text-gray-600 border-gray-200";
    }
  };

  const getLineColor = (fromStatus: string, toStatus: string) => {
    if (
      fromStatus === "completed" &&
      (toStatus === "completed" || toStatus === "current")
    ) {
      return "bg-green-500";
    }
    return "bg-gray-200";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Application Progress</h3>

      {currentStatus === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center text-red-700">
            <XCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Application Rejected</span>
          </div>
          <p className="text-sm text-red-600 mt-1">
            This application was not selected to move forward in the process.
          </p>
        </div>
      )}

      {currentStatus === "withdrawn" && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex items-center text-gray-700">
            <XCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Application Withdrawn</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            The applicant has withdrawn their application.
          </p>
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage.key);
            const isClickable = user.role === "recruiter";
            const IconComponent = stage.icon;

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center flex-1"
              >
                <div className="relative flex items-center w-full">
                  {/* Stage Circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center
                      transition-all duration-200 mx-auto
                      ${getStageColor(status)}
                      ${isClickable && status !== "completed" ? "cursor-pointer hover:scale-110" : ""}
                    `}
                    onClick={() => {
                      if (isClickable && status !== "completed") {
                        onStatusChange(stage.key);
                      }
                    }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Connecting Line */}
                  {index < stages.length - 1 && (
                    <div className="absolute left-[calc(50%+20px)] right-0 top-1/2 -translate-y-1/2 h-0.5">
                      <div
                        className={`
                          w-full h-full transition-all duration-300
                          ${getLineColor(status, getStageStatus(stages[index + 1].key))}
                        `}
                      />
                    </div>
                  )}
                </div>

                {/* Stage Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      status === "current"
                        ? "text-blue-600"
                        : status === "completed"
                          ? "text-green-600"
                          : status === "rejected"
                            ? "text-red-600"
                            : "text-gray-500"
                    }`}
                  >
                    {stage.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      {user.role === "recruiter" &&
        currentStatus !== "rejected" &&
        currentStatus !== "withdrawn" &&
        currentStatus !== "offered" && (
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange("rejected")}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Application
            </Button>
            {currentStatus === "pending" && (
              <Button size="sm" onClick={() => onStatusChange("reviewing")}>
                <Eye className="w-4 h-4 mr-2" />
                Start Review
              </Button>
            )}
            {currentStatus === "reviewing" && (
              <Button size="sm" onClick={() => onStatusChange("interview")}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Interview
              </Button>
            )}
            {currentStatus === "interview" && (
              <Button size="sm" onClick={() => onStatusChange("offered")}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Make Offer
              </Button>
            )}
          </div>
        )}
    </div>
  );
}
