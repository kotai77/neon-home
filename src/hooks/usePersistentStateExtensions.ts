import { useState, useEffect, useCallback } from "react";

// Simple localStorage-based state management for tests
function useSimplePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate async loading
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setState(JSON.parse(stored));
        }
      } catch (error) {
        console.warn(`Failed to load ${key} from localStorage:`, error);
      }
      setIsLoaded(true);
    }, 10); // Small delay to simulate async

    return () => clearTimeout(timer);
  }, [key]);

  const updateState = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setState((prev) => {
        const updated =
          typeof newValue === "function"
            ? (newValue as Function)(prev)
            : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (error) {
          console.warn(`Failed to save ${key} to localStorage:`, error);
        }
        return updated;
      });
    },
    [key],
  );

  return [state, updateState, isLoaded] as const;
}

// Type definitions for mock data
interface Activity {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: string;
  metadata?: any;
}

interface Analytics {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalViews: number;
    conversionRate: number;
  };
  applications: any;
  jobs: any;
  traffic: any;
  updatedAt: string;
}

interface Application {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  status: string;
  appliedDate: string;
  resumeUrl?: string;
  coverLetter?: string;
  experience?: string;
  location?: string;
  expectedSalary?: string;
  rating?: number;
  notes?: string;
  source?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  status: string;
  description?: string;
  requirements?: string[];
  postedDate?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  title?: string;
  company?: string;
  experience?: string;
  skills?: string[];
  status: string;
  rating?: number;
  addedDate: string;
}

interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  type: string;
  status: string;
  scheduledDate: string;
  duration: number;
  location: string;
  interviewer: string;
  interviewerEmail: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  createdDate: string;
  reminders?: string[];
  meetingLink?: string;
  questions?: string[];
  cancellationReason?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: string;
  actionUrl?: string;
  metadata?: any;
}

// Mock data
const mockActivities: Activity[] = [
  {
    id: "activity-1",
    type: "application_received",
    title: "New Application Received",
    message: "John Doe applied for Senior Frontend Developer",
    timestamp: "2024-01-16T09:00:00.000Z",
    read: false,
    priority: "high",
  },
];

const mockAnalytics: Analytics = {
  overview: {
    totalJobs: 45,
    activeJobs: 23,
    totalApplications: 342,
    totalViews: 12500,
    conversionRate: 2.74,
  },
  applications: {},
  jobs: {},
  traffic: {},
  updatedAt: "2024-01-16T10:00:00.000Z",
};

const mockApplications: Application[] = [
  {
    id: "app-1",
    jobId: "job-1",
    candidateName: "John Doe",
    candidateEmail: "john.doe@example.com",
    candidatePhone: "+31 6 12345678",
    status: "pending",
    appliedDate: "2024-01-16T09:00:00.000Z",
    experience: "5+ years",
    location: "Amsterdam, NL",
    expectedSalary: "€85,000",
    rating: 4,
    source: "linkedin",
  },
];

const mockJobs: Job[] = [
  {
    id: "job-1",
    title: "Senior Frontend Developer",
    company: "TechCorp",
    location: "Amsterdam, NL",
    type: "Full-time",
    status: "published",
    description: "Looking for an experienced frontend developer...",
    requirements: ["React", "TypeScript", "5+ years experience"],
    postedDate: "2024-01-15T10:00:00.000Z",
  },
];

const mockCandidates: Candidate[] = [
  {
    id: "candidate-1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+31 6 12345678",
    location: "Amsterdam, NL",
    title: "Senior Frontend Developer",
    company: "TechCorp",
    experience: "5+ years",
    skills: ["React", "TypeScript", "Node.js"],
    status: "active",
    rating: 4,
    addedDate: "2024-01-10T10:00:00.000Z",
  },
];

const mockInterviews: Interview[] = [
  {
    id: "interview-1",
    candidateId: "candidate-1",
    candidateName: "John Doe",
    candidateEmail: "john.doe@example.com",
    jobId: "job-1",
    jobTitle: "Senior Frontend Developer",
    type: "technical",
    status: "scheduled",
    scheduledDate: "2024-01-25T10:00:00.000Z",
    duration: 60,
    location: "Office",
    interviewer: "Sarah Johnson",
    interviewerEmail: "sarah@techcorp.com",
    createdDate: "2024-01-20T14:00:00.000Z",
    reminders: ["24h", "2h"],
    meetingLink: "https://meet.google.com/abc-def-ghi",
    questions: ["Explain React hooks", "How do you handle state management?"],
  },
];

const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "application_received",
    title: "New Application",
    message: "John Doe applied for Senior Frontend Developer",
    timestamp: "2024-01-16T09:00:00.000Z",
    read: false,
    priority: "high",
    actionUrl: "/applications/app-1",
  },
];

const mockTags: string[] = [
  "frontend",
  "backend",
  "design",
  "senior",
  "junior",
  "react",
  "vue",
  "angular",
  "nodejs",
  "python",
];

// Export hooks
export const usePersistentActivities = () =>
  useSimplePersistentState("activities", mockActivities);
export const usePersistentAnalytics = () =>
  useSimplePersistentState("analytics", mockAnalytics);
export const usePersistentApplications = () =>
  useSimplePersistentState("applications", mockApplications);
export const usePersistentJobs = () =>
  useSimplePersistentState("jobs", mockJobs);
export const usePersistentCandidates = () =>
  useSimplePersistentState("candidates", mockCandidates);
export const usePersistentInterviews = () =>
  useSimplePersistentState("interviews", mockInterviews);
export const usePersistentNotifications = () =>
  useSimplePersistentState("notifications", mockNotifications);
export const usePersistentTags = () =>
  useSimplePersistentState("tags", mockTags);
