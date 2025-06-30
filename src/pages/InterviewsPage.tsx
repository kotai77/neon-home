import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Monitor,
  Coffee,
  MessageSquare,
  FileText,
  Send,
  Filter,
  Search,
} from "lucide-react";
import { format, addDays, isToday, isTomorrow, isYesterday } from "date-fns";

interface InterviewsPageProps {
  user: User;
}

interface Interview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  date: Date;
  duration: number;
  type: "phone" | "video" | "in-person";
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  location?: string;
  meetingLink?: string;
  notes?: string;
  feedback?: string;
  score?: number;
  interviewers: string[];
  stage: "phone-screen" | "technical" | "final" | "hr";
}

const mockInterviews: Interview[] = [
  {
    id: "1",
    candidateName: "Sarah Johnson",
    candidateEmail: "sarah.johnson@email.com",
    jobTitle: "Senior Frontend Developer",
    date: new Date(Date.now() + 86400000), // Tomorrow
    duration: 60,
    type: "video",
    status: "scheduled",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    interviewers: ["John Smith", "Emily Davis"],
    stage: "technical",
  },
  {
    id: "2",
    candidateName: "Michael Chen",
    candidateEmail: "michael.chen@email.com",
    jobTitle: "Backend Engineer",
    date: new Date(Date.now() + 172800000), // Day after tomorrow
    duration: 45,
    type: "phone",
    status: "scheduled",
    interviewers: ["Alex Rodriguez"],
    stage: "phone-screen",
  },
  {
    id: "3",
    candidateName: "Emma Wilson",
    candidateEmail: "emma.wilson@email.com",
    jobTitle: "Full Stack Developer",
    date: new Date(Date.now() - 86400000), // Yesterday
    duration: 90,
    type: "in-person",
    status: "completed",
    location: "Office Conference Room A",
    interviewers: ["Jane Doe", "Bob Smith"],
    stage: "final",
    feedback: "Strong technical skills, good cultural fit",
    score: 85,
  },
  {
    id: "4",
    candidateName: "David Brown",
    candidateEmail: "david.brown@email.com",
    jobTitle: "DevOps Engineer",
    date: new Date(Date.now() + 259200000), // 3 days from now
    duration: 60,
    type: "video",
    status: "scheduled",
    meetingLink: "https://zoom.us/j/123456789",
    interviewers: ["Lisa Chang"],
    stage: "hr",
  },
];

export default function InterviewsPage({ user }: InterviewsPageProps) {
  const [interviews, setInterviews] = useState<Interview[]>(mockInterviews);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [newInterview, setNewInterview] = useState({
    candidateName: "",
    candidateEmail: "",
    jobTitle: "",
    date: new Date(),
    time: "10:00",
    duration: 60,
    type: "video" as const,
    location: "",
    meetingLink: "",
    interviewers: [] as string[],
    stage: "phone-screen" as const,
    notes: "",
  });

  const filteredInterviews = interviews.filter((interview) => {
    const matchesStatus =
      filterStatus === "all" || interview.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      interview.candidateName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      interview.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Interview["status"]) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "rescheduled":
        return <Badge className="bg-yellow-500">Rescheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: Interview["type"]) => {
    switch (type) {
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "in-person":
        return <MapPin className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  const handleScheduleInterview = async () => {
    try {
      const interview: Interview = {
        id: String(interviews.length + 1),
        candidateName: newInterview.candidateName,
        candidateEmail: newInterview.candidateEmail,
        jobTitle: newInterview.jobTitle,
        date: new Date(
          `${format(newInterview.date, "yyyy-MM-dd")}T${newInterview.time}`,
        ),
        duration: newInterview.duration,
        type: newInterview.type,
        status: "scheduled",
        location: newInterview.location,
        meetingLink: newInterview.meetingLink,
        interviewers: newInterview.interviewers,
        stage: newInterview.stage,
        notes: newInterview.notes,
      };

      setInterviews([...interviews, interview]);
      setIsScheduleDialogOpen(false);

      // Reset form
      setNewInterview({
        candidateName: "",
        candidateEmail: "",
        jobTitle: "",
        date: new Date(),
        time: "10:00",
        duration: 60,
        type: "video",
        location: "",
        meetingLink: "",
        interviewers: [],
        stage: "phone-screen",
        notes: "",
      });

      toast({
        title: "Interview Scheduled",
        description: `Interview with ${interview.candidateName} has been scheduled.`,
      });
    } catch (error) {
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (
    interviewId: string,
    newStatus: Interview["status"],
  ) => {
    try {
      setInterviews(
        interviews.map((interview) =>
          interview.id === interviewId
            ? { ...interview, status: newStatus }
            : interview,
        ),
      );

      toast({
        title: "Status Updated",
        description: `Interview status updated to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update interview status.",
        variant: "destructive",
      });
    }
  };

  const handleAddFeedback = async (
    interviewId: string,
    feedback: string,
    score?: number,
  ) => {
    try {
      setInterviews(
        interviews.map((interview) =>
          interview.id === interviewId
            ? { ...interview, feedback, score, status: "completed" }
            : interview,
        ),
      );

      toast({
        title: "Feedback Added",
        description: "Interview feedback has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save feedback.",
        variant: "destructive",
      });
    }
  };

  const upcomingInterviews = interviews.filter(
    (interview) =>
      interview.status === "scheduled" && interview.date > new Date(),
  );

  const todayInterviews = interviews.filter((interview) =>
    isToday(interview.date),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Interviews</h1>
            <p className="text-muted-foreground">
              Schedule and manage your interview pipeline
            </p>
          </div>
          <Dialog
            open={isScheduleDialogOpen}
            onOpenChange={setIsScheduleDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Interview</DialogTitle>
                <DialogDescription>
                  Set up a new interview with a candidate
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Candidate Name</Label>
                  <Input
                    value={newInterview.candidateName}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        candidateName: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Candidate Email</Label>
                  <Input
                    type="email"
                    value={newInterview.candidateEmail}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        candidateEmail: e.target.value,
                      })
                    }
                    placeholder="john.doe@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={newInterview.jobTitle}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        jobTitle: e.target.value,
                      })
                    }
                    placeholder="Senior Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Interview Stage</Label>
                  <Select
                    value={newInterview.stage}
                    onValueChange={(value: any) =>
                      setNewInterview({ ...newInterview, stage: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone-screen">Phone Screen</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="final">Final Round</SelectItem>
                      <SelectItem value="hr">HR Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newInterview.date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newInterview.date}
                        onSelect={(date) =>
                          date &&
                          setNewInterview({ ...newInterview, date: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={newInterview.time}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        time: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Select
                    value={newInterview.duration.toString()}
                    onValueChange={(value) =>
                      setNewInterview({
                        ...newInterview,
                        duration: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Interview Type</Label>
                  <Select
                    value={newInterview.type}
                    onValueChange={(value: any) =>
                      setNewInterview({ ...newInterview, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="in-person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newInterview.type === "video" && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Meeting Link</Label>
                    <Input
                      value={newInterview.meetingLink}
                      onChange={(e) =>
                        setNewInterview({
                          ...newInterview,
                          meetingLink: e.target.value,
                        })
                      }
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                )}

                {newInterview.type === "in-person" && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Location</Label>
                    <Input
                      value={newInterview.location}
                      onChange={(e) =>
                        setNewInterview({
                          ...newInterview,
                          location: e.target.value,
                        })
                      }
                      placeholder="Conference Room A"
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newInterview.notes}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Additional notes or preparation instructions..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsScheduleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleScheduleInterview}>
                  Schedule Interview
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="all">All Interviews</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          {/* Upcoming Interviews */}
          <TabsContent value="upcoming" className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search candidates or jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingInterviews.map((interview) => (
                <Card key={interview.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {interview.candidateName}
                      </CardTitle>
                      {getStatusBadge(interview.status)}
                    </div>
                    <CardDescription>{interview.jobTitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(interview.date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(interview.date, "h:mm a")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(interview.type)}
                        <span className="text-sm capitalize">
                          {interview.type.replace("-", " ")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {interview.duration} min
                        </span>
                      </div>
                    </div>

                    {interview.meetingLink && (
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}

                    {interview.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{interview.location}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {interview.interviewers.join(", ")}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInterview(interview)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(interview.id, "cancelled")
                        }
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {upcomingInterviews.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Upcoming Interviews
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Schedule your first interview to get started.
                  </p>
                  <Button onClick={() => setIsScheduleDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Today's Interviews */}
          <TabsContent value="today" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {todayInterviews.map((interview) => (
                <Card
                  key={interview.id}
                  className={`${
                    interview.status === "scheduled"
                      ? "border-blue-200 bg-blue-50"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {interview.candidateName}
                      </CardTitle>
                      {getStatusBadge(interview.status)}
                    </div>
                    <CardDescription>{interview.jobTitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(interview.date, "h:mm a")}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {interview.duration} min
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getTypeIcon(interview.type)}
                      <span className="text-sm">{interview.type}</span>
                    </div>

                    {interview.meetingLink && (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Meeting
                        </a>
                      </Button>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(interview.id, "completed")
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Complete
                      </Button>
                      {interview.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInterview(interview)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Add Feedback
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {todayInterviews.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Interviews Today
                  </h3>
                  <p className="text-muted-foreground">
                    Enjoy your day! No interviews are scheduled for today.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Interviews */}
          <TabsContent value="all" className="space-y-6">
            <div className="space-y-4">
              {filteredInterviews.map((interview) => (
                <Card key={interview.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="font-semibold">
                            {interview.candidateName}
                          </h3>
                          {getStatusBadge(interview.status)}
                          <Badge variant="outline" className="text-xs">
                            {interview.stage.replace("-", " ")}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {interview.jobTitle}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{formatDate(interview.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{format(interview.date, "h:mm a")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getTypeIcon(interview.type)}
                            <span className="capitalize">{interview.type}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>
                              {interview.interviewers.length} interviewer(s)
                            </span>
                          </div>
                        </div>

                        {interview.feedback && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                Feedback
                              </span>
                              {interview.score && (
                                <Badge variant="secondary">
                                  Score: {interview.score}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {interview.feedback}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {interview.meetingLink && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={interview.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Video className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInterview(interview)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Interviews for {format(selectedDate, "MMMM d, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interviews
                      .filter(
                        (interview) =>
                          format(interview.date, "yyyy-MM-dd") ===
                          format(selectedDate, "yyyy-MM-dd"),
                      )
                      .map((interview) => (
                        <div
                          key={interview.id}
                          className="flex items-center space-x-4 p-3 border rounded-lg"
                        >
                          <div className="text-sm font-medium">
                            {format(interview.date, "h:mm a")}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {interview.candidateName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {interview.jobTitle}
                            </div>
                          </div>
                          {getStatusBadge(interview.status)}
                        </div>
                      ))}

                    {interviews.filter(
                      (interview) =>
                        format(interview.date, "yyyy-MM-dd") ===
                        format(selectedDate, "yyyy-MM-dd"),
                    ).length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No interviews scheduled for this date.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Feedback Dialog */}
        {selectedInterview && (
          <Dialog
            open={!!selectedInterview}
            onOpenChange={() => setSelectedInterview(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Interview Feedback</DialogTitle>
                <DialogDescription>
                  Add feedback for {selectedInterview.candidateName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Overall Score (1-100)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="85"
                    defaultValue={selectedInterview.score}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Feedback</Label>
                  <Textarea
                    placeholder="Provide detailed feedback about the candidate's performance..."
                    defaultValue={selectedInterview.feedback}
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInterview(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleAddFeedback(
                      selectedInterview.id,
                      "Sample feedback",
                      85,
                    );
                    setSelectedInterview(null);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Save Feedback
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
