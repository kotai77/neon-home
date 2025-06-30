import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Share2,
  Bookmark,
  Send,
  Edit,
  Calendar,
  Award,
  TrendingUp,
  Eye,
  MessageSquare,
} from "lucide-react";

interface JobDetailsPageProps {
  user: User;
}

export default function JobDetailsPage({ user }: JobDetailsPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJobDetails = () => {
      try {
        setIsLoading(true);

        // Get jobs from localStorage (newly created jobs)
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

        // Generate the same mock jobs as in JobManagement
        const mockJobs = generateMockJobs();
        const allJobs = [...newJobs, ...mockJobs];

        // Find the job with the matching ID
        const foundJob = allJobs.find((j) => j.id === id);

        if (foundJob) {
          // Enhance job data with additional fields for details page
          const enhancedJob = {
            ...foundJob,
            applicationsCount: Math.floor(Math.random() * 50) + 5, // Random between 5-54
            viewsCount: Math.floor(Math.random() * 200) + 50, // Random between 50-249
            recruiterName: "Sarah Johnson",
            recruiterRole: "Senior Technical Recruiter",
          };
          setJob(enhancedJob);
        } else {
          // Job not found
          setJob(null);
        }
      } catch (error) {
        console.error("Failed to load job details:", error);
        setJob(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobDetails();
  }, [id, user.id]);

  const generateMockJobs = () => {
    // This matches the mock jobs from JobManagement.tsx exactly
    return [
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
        type: "full-time" as const,
        remote: true,
        skills: [
          "React",
          "TypeScript",
          "JavaScript",
          "HTML/CSS",
          "Jest",
          "Cypress",
        ],
        status: "published" as const,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        benefits: [
          "Health Insurance",
          "401(k) Retirement Plan",
          "Remote Work Options",
          "Professional Development",
          "Stock Options",
        ],
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
        type: "full-time" as const,
        remote: false,
        skills: [
          "Product Management",
          "Agile",
          "Analytics",
          "Strategy",
          "SQL",
          "Figma",
        ],
        status: "published" as const,
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-01-12"),
        benefits: [
          "Health Insurance",
          "Dental Insurance",
          "Vision Insurance",
          "Flexible Working Hours",
          "Conference Allowance",
        ],
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
        type: "full-time" as const,
        remote: true,
        skills: [
          "Node.js",
          "Python",
          "PostgreSQL",
          "AWS",
          "Docker",
          "Kubernetes",
        ],
        status: "published" as const,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        benefits: [
          "Health Insurance",
          "Remote Work Options",
          "Learning Budget",
          "Unlimited PTO",
          "Home Office Setup",
        ],
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
        type: "full-time" as const,
        remote: true,
        skills: [
          "Figma",
          "Sketch",
          "Adobe Creative Suite",
          "User Research",
          "Prototyping",
        ],
        status: "published" as const,
        createdAt: new Date("2024-01-14"),
        updatedAt: new Date("2024-01-14"),
        benefits: [
          "Health Insurance",
          "Flexible Working Hours",
          "Remote Work Options",
          "Professional Development",
        ],
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
        type: "full-time" as const,
        remote: false,
        skills: [
          "AWS",
          "Docker",
          "Kubernetes",
          "Terraform",
          "Jenkins",
          "Monitoring",
        ],
        status: "published" as const,
        createdAt: new Date("2024-01-11"),
        updatedAt: new Date("2024-01-11"),
        benefits: [
          "Health Insurance",
          "401(k) Retirement Plan",
          "Professional Development",
          "Stock Options",
        ],
      },
    ];
  };

  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading job details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show job not found
  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Job Not Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                The job you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/jobs")}>Browse All Jobs</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    try {
      // In real app, submit application via API
      setHasApplied(true);
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
      });
    } catch (error) {
      toast({
        title: "Application Failed",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Job Unsaved" : "Job Saved",
      description: isSaved
        ? "Job removed from your saved list."
        : "Job added to your saved list.",
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: job.title,
        text: `Check out this job opportunity: ${job.title} at ${job.company}`,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Job link copied to clipboard.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Job Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <Badge
                    variant={
                      job.status === "published" ? "default" : "secondary"
                    }
                  >
                    {job.status}
                  </Badge>
                  {job.remote && (
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-600"
                    >
                      Remote
                    </Badge>
                  )}
                </div>

                <CardDescription className="text-lg mb-4">
                  {job.company}
                </CardDescription>

                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />$
                    {job.salary.min.toLocaleString()} - $
                    {job.salary.max.toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {job.type}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Posted {job.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Bookmark
                    className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`}
                  />
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                {user.role === "recruiter" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/jobs/${id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="company">Company</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-line text-foreground">
                        {job.description}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(job.requirements || []).map((req, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {job.benefits && job.benefits.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Benefits & Perks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <Award className="w-4 h-4 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="company" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {job.company}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      TechCorp Inc. is a leading technology company focused on
                      building innovative solutions that transform how
                      businesses operate. We're passionate about creating
                      products that make a real difference in people's lives.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Industry:</span>{" "}
                        Technology
                      </div>
                      <div>
                        <span className="font-medium">Company Size:</span>{" "}
                        500-1000 employees
                      </div>
                      <div>
                        <span className="font-medium">Founded:</span> 2010
                      </div>
                      <div>
                        <span className="font-medium">Headquarters:</span> San
                        Francisco, CA
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hiring Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">SJ</span>
                      </div>
                      <div>
                        <div className="font-medium">{job.recruiterName}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.recruiterRole}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {user.role === "recruiter" ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Job Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {job.viewsCount}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Total Views
                            </div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {job.applicationsCount}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Applications
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Application Sources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { source: "LinkedIn", count: 12, percentage: 52 },
                            { source: "Indeed", count: 7, percentage: 30 },
                            {
                              source: "Company Website",
                              count: 4,
                              percentage: 18,
                            },
                          ].map((item) => (
                            <div
                              key={item.source}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm">{item.source}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-8">
                                  {item.count}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Analytics Unavailable
                      </h3>
                      <p className="text-muted-foreground">
                        Job analytics are only available to recruiters and
                        hiring managers.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Section */}
            {user.role === "applicant" && (
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasApplied ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Send className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="font-medium text-green-600">
                        Application Submitted
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You'll hear back from the hiring team soon.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Ready to take the next step in your career?
                      </p>
                      <Button className="w-full" onClick={handleApply}>
                        <Send className="w-4 h-4 mr-2" />
                        Apply Now
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Your application will be sent directly to the hiring
                        team.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Job Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Views</span>
                  </div>
                  <span className="font-medium">{job.viewsCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Applications</span>
                  </div>
                  <span className="font-medium">{job.applicationsCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Posted</span>
                  </div>
                  <span className="font-medium">
                    {job.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    title: "Frontend Engineer",
                    company: "StartupCo",
                    salary: "$110k - $160k",
                  },
                  {
                    title: "React Developer",
                    company: "DevCorp",
                    salary: "$100k - $150k",
                  },
                  {
                    title: "UI/UX Developer",
                    company: "DesignTech",
                    salary: "$90k - $140k",
                  },
                ].map((similarJob, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="font-medium text-sm">
                      {similarJob.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {similarJob.company}
                    </div>
                    <div className="text-xs text-green-600">
                      {similarJob.salary}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
