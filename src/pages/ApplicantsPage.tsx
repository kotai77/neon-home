import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  usePersistentApplications,
  usePersistentJobs,
} from "@/hooks/usePersistentState";
import { User } from "@/lib/types";
import {
  Users,
  Search,
  Filter,
  Eye,
  Download,
  Star,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
} from "lucide-react";

interface ApplicantsPageProps {
  user: User;
}

const ApplicantsPage: React.FC<ApplicantsPageProps> = ({ user }) => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [applications, setApplications, applicationsLoaded] =
    usePersistentApplications();
  const [jobs, setJobs, jobsLoaded] = usePersistentJobs();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();

  const job = jobs?.find((j) => j.id === jobId);
  const jobApplications = applications?.filter((app) => app.jobId === jobId);

  const filteredApplications = useMemo(() => {
    if (!jobApplications) return [];

    return jobApplications
      .filter((app) => {
        const matchesSearch =
          app.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.candidateEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          filterStatus === "all" || app.status === filterStatus;
        const matchesRating =
          filterRating === "all" ||
          (filterRating === "4+" && (app.rating || 0) >= 4);
        const matchesSource =
          filterSource === "all" || app.source === filterSource;

        return matchesSearch && matchesStatus && matchesRating && matchesSource;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.appliedDate).getTime() -
              new Date(a.appliedDate).getTime()
            );
          case "oldest":
            return (
              new Date(a.appliedDate).getTime() -
              new Date(b.appliedDate).getTime()
            );
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          case "name":
            return (a.candidateName || "").localeCompare(b.candidateName || "");
          default:
            return 0;
        }
      });
  }, [
    jobApplications,
    searchTerm,
    filterStatus,
    filterRating,
    filterSource,
    sortBy,
  ]);

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    if (!applications) return;

    try {
      const updatedApplications = applications.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app,
      );
      setApplications(updatedApplications);
      toast({ title: "Status Updated" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleRatingChange = (applicationId: string, rating: number) => {
    if (!applications) return;

    try {
      const updatedApplications = applications.map((app) =>
        app.id === applicationId ? { ...app, rating } : app,
      );
      setApplications(updatedApplications);
      toast({ title: "Rating Updated" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDeleteApplicant = (applicationId: string) => {
    if (!applications) return;

    try {
      const updatedApplications = applications.filter(
        (app) => app.id !== applicationId,
      );
      setApplications(updatedApplications);
      toast({ title: "Applicant Removed" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleExport = () => {
    toast({ title: "Export Started" });
  };

  if (!applicationsLoaded || !jobsLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applicants...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The job you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/job-management")}>
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const stats = {
    total: jobApplications?.length || 0,
    pending:
      jobApplications?.filter((app) => app.status === "pending").length || 0,
    interviewed:
      jobApplications?.filter((app) => app.status === "interviewed").length ||
      0,
    avgRating:
      jobApplications?.reduce((sum, app) => sum + (app.rating || 0), 0) /
        (jobApplications?.length || 1) || 0,
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Applicants</h1>
          <div className="mt-2">
            <h2 className="text-xl font-semibold text-primary">{job.title}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>{job.company}</span>
              <span>•</span>
              <span>{job.location}</span>
              <span>•</span>
              <span>{job.type}</span>
              <span>•</span>
              <Badge variant="secondary">{job.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Applicants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.interviewed}</div>
            <p className="text-xs text-muted-foreground">Interviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stats.avgRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="interviewed">Interviewed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="All Ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="4+">4 Stars & Above</SelectItem>
            <SelectItem value="3+">3 Stars & Above</SelectItem>
            <SelectItem value="2+">2 Stars & Above</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="company_website">Company Website</SelectItem>
            <SelectItem value="indeed">Indeed</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("");
            setFilterStatus("all");
            setFilterRating("all");
            setFilterSource("all");
          }}
        >
          Clear
        </Button>
      </div>

      {/* Source Distribution */}
      {jobApplications && jobApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>LinkedIn: 33%</span>
              <span>Company Website: 33%</span>
              <span>Indeed: 33%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applicants List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No Applicants Found
              </h3>
              <p className="text-muted-foreground">
                No applicants match your current filters. Applicants will appear
                here when they apply for this job.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card
              key={application.id}
              className="transition-all hover:shadow-md cursor-pointer"
              role="article"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Open details modal
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedApplicants.includes(application.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedApplicants([
                          ...selectedApplicants,
                          application.id,
                        ]);
                      } else {
                        setSelectedApplicants(
                          selectedApplicants.filter(
                            (id) => id !== application.id,
                          ),
                        );
                      }
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">
                        {application.candidateName}
                      </h3>
                      <Badge
                        variant={
                          application.status === "pending"
                            ? "outline"
                            : application.status === "approved"
                              ? "default"
                              : application.status === "rejected"
                                ? "destructive"
                                : "secondary"
                        }
                      >
                        {application.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= (application.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                            role="img"
                            aria-label="star"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{application.candidateEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{application.candidatePhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{application.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{application.experience}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Applied 2 days ago</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{application.expectedSalary}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Source:</span>
                        <Badge variant="outline" className="capitalize">
                          {application.source?.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Applicant Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2">
                              Contact Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p>
                                <strong>Name:</strong>{" "}
                                {application.candidateName}
                              </p>
                              <p>
                                <strong>Email:</strong>{" "}
                                {application.candidateEmail}
                              </p>
                              <p>
                                <strong>Phone:</strong>{" "}
                                {application.candidatePhone}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">
                              Skills & Experience
                            </h4>
                            <p className="text-sm">{application.experience}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Cover Letter</h4>
                            <p className="text-sm text-muted-foreground">
                              {application.coverLetter}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button>Approve</Button>
                            <Button variant="destructive">Reject</Button>
                            <Button variant="outline">
                              Schedule Interview
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast({ title: "Downloading Resume" })}
                    >
                      Download Resume
                    </Button>

                    <Select
                      value={application.status}
                      onValueChange={(value) =>
                        handleStatusChange(application.id, value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() =>
                            handleRatingChange(application.id, star)
                          }
                          aria-label={`Set rating ${star}`}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= (application.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </Button>
                      ))}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Applicant</DialogTitle>
                        </DialogHeader>
                        <p>
                          Are you sure you want to delete this applicant? This
                          action cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline">Cancel</Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleDeleteApplicant(application.id)
                            }
                          >
                            Delete Applicant
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bulk Actions */}
      {selectedApplicants.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedApplicants.length} selected
          </span>
          <Button variant="outline" size="sm">
            Change Status
          </Button>
          <Button variant="outline" size="sm">
            Schedule Interviews
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export
          </Button>
        </div>
      )}

      {/* Bulk Actions Dialog */}
      <Dialog>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interviews</DialogTitle>
          </DialogHeader>
          <p>Schedule interviews for selected candidates</p>
        </DialogContent>
      </Dialog>

      <div role="status" aria-live="polite" className="sr-only">
        Applicants list updated
      </div>
    </main>
  );
};

export default ApplicantsPage;
