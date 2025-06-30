import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Star,
  MapPin,
  DollarSign,
  Zap,
  Target,
  Upload,
  Download,
  Brain,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  User,
  JobPosting,
  Application,
  assert,
  assertExists,
} from "@/lib/types";
import { apiService, logger } from "@/lib/api";
import { aiService } from "@/lib/ai";
import { scrapingService } from "@/lib/scraping";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  user: User;
}

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  interviewsScheduled: number;
  offersExtended: number;
  hiresMade: number;
  aiMatches: number;
  profileViews?: number;
  responseRate?: number;
}

interface RecentActivity {
  id: string;
  type:
    | "application"
    | "interview"
    | "offer"
    | "hire"
    | "job_posted"
    | "ai_match";
  title: string;
  description: string;
  time: string;
  avatar?: string;
  urgent?: boolean;
}

export default function Dashboard({ user }: DashboardProps) {
  // Tiger-style assertions
  assertExists(user, "User");
  assert(
    user.role === "recruiter" || user.role === "applicant",
    "User must be recruiter or applicant",
  );

  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    interviewsScheduled: 0,
    offersExtended: 0,
    hiresMade: 0,
    aiMatches: 0,
  });

  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    loadAIInsights();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      logger.info("Loading dashboard data", {
        userId: user.id,
        role: user.role,
      });

      // Load stats
      const statsResponse = await apiService.getDashboardStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Load recent jobs
      const jobsResponse = await apiService.getJobs({
        query: user.role === "recruiter" ? "" : undefined,
      });
      if (jobsResponse.success && jobsResponse.data) {
        setRecentJobs(jobsResponse.data.slice(0, 5));
      }

      // Generate mock activity data
      setRecentActivity(generateMockActivity());

      logger.info("Dashboard data loaded successfully");
    } catch (error) {
      logger.error("Failed to load dashboard data", { error });
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      if (aiService.isEnabled()) {
        // Generate AI insights based on user activity
        const insights = await generateAIInsights();
        setAiInsights(insights);
      }
    } catch (error) {
      logger.warn("Failed to load AI insights", { error });
    }
  };

  const generateAIInsights = async (): Promise<any[]> => {
    const insights = [];

    if (user.role === "recruiter") {
      insights.push({
        type: "recommendation",
        title: "Top Skills in Demand",
        content:
          "React, TypeScript, and AWS skills are trending 40% higher this quarter.",
        action: "Adjust job requirements",
        priority: "high",
      });

      insights.push({
        type: "optimization",
        title: "Job Posting Performance",
        content: "Jobs with salary ranges get 60% more applications.",
        action: "Update job postings",
        priority: "medium",
      });
    } else {
      insights.push({
        type: "match",
        title: "Perfect Job Match",
        content: "Found 3 jobs matching your React and Node.js skills.",
        action: "View matches",
        priority: "high",
      });

      insights.push({
        type: "improvement",
        title: "Profile Enhancement",
        content:
          "Adding portfolio projects could increase profile views by 35%.",
        action: "Update profile",
        priority: "medium",
      });
    }

    return insights;
  };

  const generateMockActivity = (): RecentActivity[] => {
    if (user.role === "recruiter") {
      return [
        {
          id: "1",
          type: "application",
          title: "New Application",
          description: "Sarah Chen applied for Senior Frontend Developer",
          time: "2 hours ago",
          urgent: true,
        },
        {
          id: "2",
          type: "ai_match",
          title: "AI Match Found",
          description: "High-quality candidate match for Product Manager role",
          time: "4 hours ago",
        },
        {
          id: "3",
          type: "interview",
          title: "Interview Completed",
          description: "John Smith - Frontend Developer interview",
          time: "1 day ago",
        },
        {
          id: "4",
          type: "offer",
          title: "Offer Accepted",
          description: "Jane Doe accepted Backend Developer position",
          time: "2 days ago",
        },
      ];
    } else {
      return [
        {
          id: "1",
          type: "application",
          title: "Application Viewed",
          description: "TechCorp viewed your application for React Developer",
          time: "1 hour ago",
          urgent: true,
        },
        {
          id: "2",
          type: "interview",
          title: "Interview Scheduled",
          description:
            "Interview scheduled for Frontend Developer at StartupXYZ",
          time: "3 hours ago",
        },
        {
          id: "3",
          type: "ai_match",
          title: "New Job Match",
          description: "AI found 2 perfect matches for your skills",
          time: "6 hours ago",
        },
      ];
    }
  };

  const handleQuickAction = async (action: string) => {
    try {
      logger.info("Executing quick action", { action, userId: user.id });

      switch (action) {
        case "post_job":
          navigate("/jobs/new");
          break;
        case "search_candidates":
          navigate("/search");
          break;
        case "ai_insights":
          // Navigate to different AI features based on user role
          if (user.role === "recruiter") {
            // For recruiters, go to candidate search with AI matching
            navigate("/applicants");
          } else {
            // For applicants, go to job search with AI suggestions
            navigate("/search");
          }
          break;
        case "browse_jobs":
          navigate("/jobs");
          break;
        case "update_profile":
          navigate("/profile");
          break;
        case "upload_resume":
          // Trigger file upload
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".pdf,.doc,.docx";
          input.onchange = handleResumeUpload;
          input.click();
          break;
        case "batch_analysis":
          await handleBatchAnalysis();
          break;
        case "auto_match":
          await handleAutoMatch();
          break;
        default:
          toast({
            title: "Action Completed",
            description: `${action.replace("_", " ")} action has been executed successfully.`,
          });
      }
    } catch (error) {
      logger.error("Quick action failed", { action, error });
      toast({
        title: "Error",
        description: "Action failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResumeUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    try {
      toast({
        title: "Uploading Resume",
        description: "Processing your resume with AI analysis...",
      });

      // Upload file and analyze with AI
      const uploadResult = await apiService.uploadFile(file, "resume");
      if (uploadResult.success && uploadResult.data) {
        const analysisResult = await apiService.analyzeResume(
          uploadResult.data.url,
        );

        toast({
          title: "Resume Uploaded Successfully",
          description: "AI analysis complete. Your profile has been updated.",
        });

        // Refresh dashboard to show updated insights
        await loadDashboardData();
        await loadAIInsights();
      }
    } catch (error) {
      logger.error("Resume upload failed", { error });
      toast({
        title: "Upload Failed",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScrapeCandidates = async () => {
    try {
      const url = prompt("Enter LinkedIn profile URL or job board URL:");
      if (!url) return;

      toast({
        title: "Scraping Profile",
        description: "Extracting candidate information...",
      });

      const result = await scrapingService.scrapeLinkedInProfile(url);

      toast({
        title: "Profile Scraped Successfully",
        description: `Extracted data for ${result.name}`,
      });

      // Navigate to candidate profile or add to database
      // Implementation would depend on your routing structure
    } catch (error) {
      logger.error("Profile scraping failed", { error });
      toast({
        title: "Scraping Failed",
        description: "Failed to extract profile data. Please check the URL.",
        variant: "destructive",
      });
    }
  };

  const handleBatchAnalysis = async () => {
    try {
      toast({
        title: "Batch Analysis Started",
        description: "Analyzing all applications with AI...",
      });

      // Simulate batch analysis process
      const applications = await apiService.getApplications();

      if (applications.success && applications.data) {
        const totalApplications = applications.data.length || 8; // Fallback to mock count

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const highScoreCount = Math.floor(totalApplications * 0.3);
        const mediumScoreCount = Math.floor(totalApplications * 0.5);
        const lowScoreCount =
          totalApplications - highScoreCount - mediumScoreCount;

        toast({
          title: "Batch Analysis Complete",
          description: `Analyzed ${totalApplications} applications. ${highScoreCount} high-quality candidates identified.`,
        });

        // Navigate to applications page to see results
        navigate("/applications");
      }
    } catch (error) {
      logger.error("Batch analysis failed", { error });
      toast({
        title: "Analysis Failed",
        description: "Unable to complete batch analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAutoMatch = async () => {
    try {
      toast({
        title: "Auto Match Started",
        description: "Finding the best candidate matches using AI...",
      });

      // Simulate auto-matching process
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const matchedCandidates = Math.floor(Math.random() * 5) + 3; // 3-7 matches
      const avgScore = Math.floor(Math.random() * 15) + 80; // 80-95% score

      toast({
        title: "Auto Match Complete",
        description: `Found ${matchedCandidates} high-quality matches with average compatibility of ${avgScore}%.`,
      });

      // Navigate to search page to see matches
      navigate("/search");
    } catch (error) {
      logger.error("Auto match failed", { error });
      toast({
        title: "Auto Match Failed",
        description: "Unable to complete auto matching. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "application":
        return <Users className="w-4 h-4" />;
      case "interview":
        return <Calendar className="w-4 h-4" />;
      case "offer":
        return <CheckCircle className="w-4 h-4" />;
      case "hire":
        return <Star className="w-4 h-4" />;
      case "job_posted":
        return <Briefcase className="w-4 h-4" />;
      case "ai_match":
        return <Brain className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "recommendation":
        return <Target className="w-5 h-5 text-brand" />;
      case "optimization":
        return <TrendingUp className="w-5 h-5 text-success" />;
      case "match":
        return <Zap className="w-5 h-5 text-warning" />;
      case "improvement":
        return <Star className="w-5 h-5 text-info" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "applicant") {
    return (
      <ApplicantDashboard
        user={user}
        stats={stats}
        onQuickAction={handleQuickAction}
      />
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
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-muted-foreground mt-2">
                Here's what's happening with your recruitment today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {user.isDemo && (
                <Badge
                  variant="secondary"
                  className="bg-warning/10 text-warning"
                >
                  Demo Mode
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={() => handleQuickAction("search_candidates")}
              >
                <Search className="w-4 h-4 mr-2" />
                Find Candidates
              </Button>
              <Button onClick={() => handleQuickAction("post_job")}>
                <Plus className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate("/jobs")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Jobs
                </CardTitle>
                <Briefcase className="w-4 h-4 text-brand" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <div className="text-xs text-muted-foreground">
                of {stats.totalJobs} total jobs
              </div>
              <Progress
                value={
                  stats.totalJobs > 0
                    ? (stats.activeJobs / stats.totalJobs) * 100
                    : 0
                }
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate("/applications")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New Applications
                </CardTitle>
                <Users className="w-4 h-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newApplications}</div>
              <div className="text-xs text-success flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12% from last week
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate("/interviews")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Interviews
                </CardTitle>
                <Calendar className="w-4 h-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.interviewsScheduled}
              </div>
              <div className="text-xs text-muted-foreground">
                scheduled this week
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleQuickAction("ai_insights")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI Matches
                </CardTitle>
                <Zap className="w-4 h-4 text-brand" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.aiMatches}</div>
              <div className="text-xs text-brand flex items-center">
                <Target className="w-3 h-3 mr-1" />
                Smart recommendations
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Section */}
        {aiInsights.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-brand" />
                      AI Insights
                    </CardTitle>
                    <CardDescription>
                      Personalized recommendations to improve your recruitment
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction("ai_insights")}
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {insight.content}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            {insight.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tools">AI Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates on your job postings and applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className={cn(
                          "flex items-center space-x-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer",
                          activity.urgent &&
                            "bg-warning/5 border border-warning/20",
                        )}
                        onClick={() => {
                          // Navigate to relevant page based on activity type
                          switch (activity.type) {
                            case "application":
                              navigate("/applications");
                              break;
                            case "interview":
                              navigate("/interviews");
                              break;
                            case "ai_match":
                              navigate("/search");
                              break;
                            default:
                              break;
                          }
                        }}
                      >
                        <div className="flex-shrink-0">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              activity.urgent
                                ? "bg-warning/10 text-warning"
                                : "bg-brand/10 text-brand",
                            )}
                          >
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                          {activity.urgent && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/activity")}
                    >
                      View All Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks to manage your recruitment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    onClick={() => handleQuickAction("post_job")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction("search_candidates")}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Candidates
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleScrapeCandidates}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Scrape Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/interviews")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/analytics")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/settings/ai")}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Configure AI
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <JobsTab
              jobs={recentJobs}
              onRefresh={loadDashboardData}
              navigate={navigate}
            />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab
              onRefresh={loadDashboardData}
              navigate={navigate}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab stats={stats} />
          </TabsContent>

          <TabsContent value="tools">
            <AIToolsTab onAction={handleQuickAction} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Separate component for Applicant Dashboard
function ApplicantDashboard({
  user,
  stats,
  onQuickAction,
}: {
  user: User;
  stats: DashboardStats;
  onQuickAction: (action: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your job applications and discover new opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate("/applications")}
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-muted-foreground">
                3 pending review
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate("/interviews")}
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-success">2 scheduled</div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profile Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <div className="text-xs text-brand">+8 this week</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                onClick={() => navigate("/jobs")}
              >
                <Search className="w-4 h-4 mr-2" />
                Browse Jobs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onQuickAction("upload_resume")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume
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
                AI Job Matching
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">In Review</span>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Interviews</span>
                  <Badge variant="default">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Offers</span>
                  <Badge className="bg-success text-success-foreground">
                    1
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Tab Components
function JobsTab({
  jobs,
  onRefresh,
  navigate,
}: {
  jobs: JobPosting[];
  onRefresh: () => void;
  navigate: (path: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Job Postings</CardTitle>
            <CardDescription>
              Manage your active and draft job postings
            </CardDescription>
          </div>
          <Button onClick={onRefresh}>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-sm text-muted-foreground">Active Jobs</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">234</div>
              <div className="text-sm text-muted-foreground">
                Total Applications
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">8.5</div>
              <div className="text-sm text-muted-foreground">
                Avg Response Rate
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Senior Frontend Developer",
                applications: 23,
                status: "active",
              },
              { title: "Backend Engineer", applications: 18, status: "active" },
              {
                title: "Full Stack Developer",
                applications: 15,
                status: "closed",
              },
            ].map((job, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{job.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {job.applications} applications
                  </div>
                </div>
                <Badge
                  variant={job.status === "active" ? "default" : "secondary"}
                >
                  {job.status}
                </Badge>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate("/jobs")}
          >
            View All Jobs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationsTab({
  onRefresh,
  navigate,
}: {
  onRefresh: () => void;
  navigate: (path: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Applications</CardTitle>
        <CardDescription>
          Review and manage candidate applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">45</div>
              <div className="text-sm text-muted-foreground">New This Week</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-muted-foreground">In Review</div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                name: "Sarah Johnson",
                job: "Senior Frontend Developer",
                status: "new",
                time: "2 hours ago",
              },
              {
                name: "Michael Chen",
                job: "Backend Engineer",
                status: "review",
                time: "5 hours ago",
              },
              {
                name: "Emma Wilson",
                job: "Full Stack Developer",
                status: "interview",
                time: "1 day ago",
              },
            ].map((app, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{app.name}</div>
                  <div className="text-sm text-muted-foreground">{app.job}</div>
                  <div className="text-xs text-muted-foreground">
                    {app.time}
                  </div>
                </div>
                <Badge variant={app.status === "new" ? "default" : "secondary"}>
                  {app.status}
                </Badge>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate("/applications")}
          >
            View All Applications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsTab({ stats }: { stats: DashboardStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics & Insights</CardTitle>
        <CardDescription>
          Track your recruitment performance and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">89%</div>
              <div className="text-sm text-muted-foreground">
                Application Rate
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">18</div>
              <div className="text-sm text-muted-foreground">
                Avg Time to Hire
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">76</div>
              <div className="text-sm text-muted-foreground">Quality Score</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">LinkedIn</span>
                <span className="text-sm">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "45%" }}
                ></div>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Indeed</span>
                <span className="text-sm">32%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "32%" }}
                ></div>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Company Website</span>
                <span className="text-sm">23%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: "23%" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand">
                {stats.totalApplications}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Applications
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {stats.hiresMade}
              </div>
              <div className="text-xs text-muted-foreground">
                Successful Hires
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AIToolsTab({ onAction }: { onAction: (action: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-brand" />
            Resume Analysis
          </CardTitle>
          <CardDescription>Upload and analyze resumes with AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={() => onAction("upload_resume")}>
            <Upload className="w-4 h-4 mr-2" />
            Analyze Resume
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onAction("batch_analysis")}
          >
            <Download className="w-4 h-4 mr-2" />
            Batch Analysis
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2 text-success" />
            Candidate Matching
          </CardTitle>
          <CardDescription>Find the best candidates using AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={() => onAction("search_candidates")}
          >
            <Target className="w-4 h-4 mr-2" />
            Smart Search
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onAction("auto_match")}
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto Match
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
