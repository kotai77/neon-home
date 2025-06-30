import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  X,
  Save,
  Send,
  Eye,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Brain,
  Sparkles,
  Target,
} from "lucide-react";
import { User, JobPosting, assert, assertExists } from "@/lib/types";
import { apiService, logger } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface JobPostingPageProps {
  user: User;
}

interface JobFormData {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  type: "full-time" | "part-time" | "contract" | "internship";
  remote: boolean;
  status: "draft" | "published";
  department?: string;
  experienceLevel: "entry" | "mid" | "senior" | "executive";
  benefits: string[];
  applicationDeadline?: string;
}

const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "HTML",
  "CSS",
  "Vue.js",
  "Angular",
  "Redux",
  "GraphQL",
  "REST API",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Git",
  "Linux",
  "DevOps",
  "CI/CD",
  "Machine Learning",
  "Data Science",
  "AI",
  "Figma",
  "Sketch",
  "Photoshop",
  "UI/UX Design",
  "Product Management",
  "Agile",
  "Scrum",
  "Testing",
  "Jest",
  "Cypress",
];

const BENEFIT_OPTIONS = [
  "Health Insurance",
  "Dental Insurance",
  "Vision Insurance",
  "401(k) Retirement Plan",
  "Paid Time Off",
  "Flexible Working Hours",
  "Remote Work Options",
  "Professional Development",
  "Conference Allowance",
  "Gym Membership",
  "Free Lunch",
  "Stock Options",
  "Bonus Opportunities",
  "Parental Leave",
  "Life Insurance",
  "Commuter Benefits",
  "Home Office Setup",
  "Learning Budget",
  "Team Events",
  "Unlimited PTO",
];

export default function JobPostingPage({ user }: JobPostingPageProps) {
  assertExists(user, "User");
  assert(user.role === "recruiter", "User must be recruiter");

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: user.company || "",
    location: "",
    description: "",
    requirements: [""],
    skills: [],
    salary: {
      min: 50000,
      max: 150000,
      currency: "USD",
    },
    type: "full-time",
    remote: false,
    status: "draft",
    department: "",
    experienceLevel: "mid",
    benefits: [],
    applicationDeadline: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<{
    title?: string;
    description?: string;
    requirements?: string[];
    skills?: string[];
  }>({});

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    generateAISuggestions();
  }, [formData.title, formData.department]);

  useEffect(() => {
    if (skillInput) {
      const filtered = SKILL_SUGGESTIONS.filter(
        (skill) =>
          skill.toLowerCase().includes(skillInput.toLowerCase()) &&
          !formData.skills.includes(skill),
      ).slice(0, 10);
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills([]);
    }
  }, [skillInput, formData.skills]);

  const generateAISuggestions = async () => {
    if (!formData.title && !formData.department) return;

    try {
      // Simulate AI-powered suggestions based on job title and department
      await new Promise((resolve) => setTimeout(resolve, 500));

      const suggestions: typeof aiSuggestions = {};

      if (formData.title.toLowerCase().includes("react")) {
        suggestions.description = `We are seeking a talented ${formData.title} to join our dynamic team. You will be responsible for developing user-friendly web applications using React and modern JavaScript technologies. This role offers opportunities to work on challenging projects and collaborate with cross-functional teams.`;
        suggestions.requirements = [
          "Bachelor's degree in Computer Science or related field",
          "3+ years of experience with React and JavaScript",
          "Strong understanding of web technologies (HTML, CSS, ES6+)",
          "Experience with state management libraries (Redux, Context API)",
          "Familiarity with modern development tools and workflows",
        ];
        suggestions.skills = [
          "React",
          "JavaScript",
          "TypeScript",
          "Redux",
          "HTML",
          "CSS",
        ];
      } else if (formData.title.toLowerCase().includes("python")) {
        suggestions.description = `Join our team as a ${formData.title} and contribute to building scalable backend systems and data solutions. You will work with cutting-edge technologies and be part of projects that impact millions of users.`;
        suggestions.requirements = [
          "Strong proficiency in Python programming",
          "Experience with web frameworks (Django, Flask, FastAPI)",
          "Knowledge of database design and optimization",
          "Understanding of API design and development",
          "Experience with cloud platforms (AWS, GCP, Azure)",
        ];
        suggestions.skills = [
          "Python",
          "Django",
          "FastAPI",
          "PostgreSQL",
          "AWS",
          "Docker",
        ];
      } else if (formData.title.toLowerCase().includes("design")) {
        suggestions.description = `We are looking for a creative ${formData.title} to help shape our product's user experience. You will work closely with product managers and engineers to create intuitive and beautiful interfaces that delight our users.`;
        suggestions.requirements = [
          "3+ years of experience in UI/UX design",
          "Proficiency with design tools (Figma, Sketch, Adobe Creative Suite)",
          "Strong portfolio demonstrating design thinking",
          "Experience with user research and usability testing",
          "Knowledge of design systems and component libraries",
        ];
        suggestions.skills = [
          "Figma",
          "Sketch",
          "Prototyping",
          "User Research",
          "Design Systems",
        ];
      }

      setAiSuggestions(suggestions);
    } catch (error) {
      logger.error("Failed to generate AI suggestions", { error });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Job title is required";
    }

    if (!formData.company.trim()) {
      newErrors.company = "Company name is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Job description is required";
    } else if (formData.description.length < 100) {
      newErrors.description = `Job description should be at least 100 characters (currently ${formData.description.length})`;
    }

    if (formData.requirements.filter((req) => req.trim()).length === 0) {
      newErrors.requirements = "At least one requirement is needed";
    }

    if (formData.skills.length === 0) {
      newErrors.skills = "At least one skill is required";
    }

    if (formData.salary.min <= 0) {
      newErrors.salary = "Minimum salary must be greater than 0";
    } else if (formData.salary.max <= 0) {
      newErrors.salary = "Maximum salary must be greater than 0";
    } else if (formData.salary.min >= formData.salary.max) {
      newErrors.salary = "Maximum salary must be higher than minimum salary";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear specific error when user starts fixing it
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (action: "save" | "publish") => {
    if (!validateForm()) {
      const errorFields = Object.keys(errors);
      const errorCount = errorFields.length;

      toast({
        title: "Validation Error",
        description: `Please fix ${errorCount} error${errorCount > 1 ? "s" : ""}: ${errorFields.join(", ")}`,
        variant: "destructive",
      });

      // Scroll to first error field
      const firstErrorField = document.querySelector(".border-red-500");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return;
    }

    setIsLoading(true);

    try {
      const jobData: JobPosting = {
        id: `job-${Date.now()}`,
        recruiterId: user.id,
        title: formData.title,
        company: formData.company,
        location: formData.location,
        description: formData.description,
        requirements: formData.requirements.filter((req) => req.trim()),
        skills: formData.skills,
        salary: formData.salary,
        type: formData.type,
        remote: formData.remote,
        status: action === "publish" ? "published" : "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
        // Additional fields
        department: formData.department,
        experienceLevel: formData.experienceLevel,
        benefits: formData.benefits,
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline)
          : undefined,
      };

      // Store in localStorage for persistence until logout
      const existingJobsKey = `jobs_${user.id}`;
      const existingJobs = JSON.parse(
        localStorage.getItem(existingJobsKey) || "[]",
      );
      const updatedJobs = [...existingJobs, jobData];
      localStorage.setItem(existingJobsKey, JSON.stringify(updatedJobs));

      logger.info("Job posting created", {
        jobId: jobData.id,
        action,
        userId: user.id,
      });

      toast({
        title: action === "publish" ? "Job Published!" : "Job Saved!",
        description:
          action === "publish"
            ? "Your job posting is now live and accepting applications."
            : "Your job has been saved as a draft.",
      });

      // Navigate back to jobs page
      navigate("/jobs");
    } catch (error) {
      logger.error("Failed to create job posting", { error, action });
      toast({
        title: "Error",
        description: "Failed to create job posting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData({ ...formData, requirements: newRequirements });
    clearError("requirements");
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, ""],
    });
  };

  const removeRequirement = (index: number) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index);
    setFormData({ ...formData, requirements: newRequirements });
  };

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: [...formData.skills, skill] });
      setSkillInput("");
      setFilteredSkills([]);
      clearError("skills");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const applyAISuggestion = (field: keyof typeof aiSuggestions) => {
    const suggestion = aiSuggestions[field];
    if (!suggestion) return;

    if (field === "description") {
      setFormData({ ...formData, description: suggestion as string });
    } else if (field === "requirements") {
      setFormData({ ...formData, requirements: suggestion as string[] });
    } else if (field === "skills") {
      const uniqueSkills = [
        ...new Set([...formData.skills, ...(suggestion as string[])]),
      ];
      setFormData({ ...formData, skills: uniqueSkills });
    }

    toast({
      title: "AI Suggestion Applied",
      description: `${field} has been updated with AI suggestions.`,
    });
  };

  const toggleBenefit = (benefit: string) => {
    const benefits = formData.benefits.includes(benefit)
      ? formData.benefits.filter((b) => b !== benefit)
      : [...formData.benefits, benefit];
    setFormData({ ...formData, benefits });
  };

  if (previewMode) {
    return (
      <JobPreview
        job={formData}
        onEdit={() => setPreviewMode(false)}
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/jobs")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Post New Job</h1>
          <p className="text-muted-foreground mt-2">
            Create a comprehensive job posting to attract top talent
          </p>
        </div>

        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Please fix the following errors:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li
                    key={field}
                    className="text-sm text-red-700 flex items-start"
                  >
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="capitalize">
                      {field.replace(/([A-Z])/g, " $1")}
                    </span>
                    : {error}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="benefits">Benefits</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Provide the essential details about this position
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="flex items-center">
                          Job Title
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="title"
                          placeholder="e.g. Senior React Developer"
                          value={formData.title}
                          onChange={(e) => {
                            setFormData({ ...formData, title: e.target.value });
                            clearError("title");
                          }}
                          className={errors.title ? "border-red-500" : ""}
                        />
                        {errors.title && (
                          <div className="flex items-center space-x-1 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.title}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company" className="flex items-center">
                          Company
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="company"
                          placeholder="Company name"
                          value={formData.company}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              company: e.target.value,
                            });
                            clearError("company");
                          }}
                          className={errors.company ? "border-red-500" : ""}
                        />
                        {errors.company && (
                          <div className="flex items-center space-x-1 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.company}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center">
                          Location
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="location"
                          placeholder="e.g. San Francisco, CA"
                          value={formData.location}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              location: e.target.value,
                            });
                            clearError("location");
                          }}
                          className={errors.location ? "border-red-500" : ""}
                        />
                        {errors.location && (
                          <div className="flex items-center space-x-1 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          placeholder="e.g. Engineering"
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              department: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Job Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: any) =>
                            setFormData({ ...formData, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">
                              Internship
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experienceLevel">
                          Experience Level
                        </Label>
                        <Select
                          value={formData.experienceLevel}
                          onValueChange={(value: any) =>
                            setFormData({ ...formData, experienceLevel: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entry">Entry Level</SelectItem>
                            <SelectItem value="mid">Mid Level</SelectItem>
                            <SelectItem value="senior">Senior Level</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deadline">Application Deadline</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={formData.applicationDeadline}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              applicationDeadline: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote"
                        checked={formData.remote}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, remote: !!checked })
                        }
                      />
                      <Label htmlFor="remote">Remote work available</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Job Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          Job Description
                          <span className="text-red-500 ml-1">*</span>
                        </CardTitle>
                        <CardDescription>
                          Provide a detailed description of the role (minimum
                          100 characters)
                        </CardDescription>
                      </div>
                      {aiSuggestions.description && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyAISuggestion("description")}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Use AI Suggestion
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          });
                          clearError("description");
                        }}
                        className={`min-h-[200px] ${
                          errors.description ? "border-red-500" : ""
                        }`}
                      />
                      {errors.description && (
                        <div className="flex items-center space-x-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.description}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`${
                            formData.description.length >= 100
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formData.description.length >= 100 ? "✓" : ""}
                          {formData.description.length}/100 characters minimum
                        </span>
                        {formData.description.length >= 100 && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600"
                          >
                            Valid
                          </Badge>
                        )}
                      </div>
                    </div>

                    {aiSuggestions.description && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Brain className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            AI Suggestion
                          </span>
                        </div>
                        <p className="text-sm text-blue-800">
                          {aiSuggestions.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Salary Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Compensation</CardTitle>
                    <CardDescription>
                      Set the salary range for this position
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salaryMin">Minimum Salary</Label>
                        <Input
                          id="salaryMin"
                          type="number"
                          placeholder="50000"
                          value={formData.salary.min}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              salary: {
                                ...formData.salary,
                                min: parseInt(e.target.value) || 0,
                              },
                            });
                            clearError("salary");
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salaryMax">Maximum Salary</Label>
                        <Input
                          id="salaryMax"
                          type="number"
                          placeholder="150000"
                          value={formData.salary.max}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              salary: {
                                ...formData.salary,
                                max: parseInt(e.target.value) || 0,
                              },
                            });
                            clearError("salary");
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.salary.currency}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              salary: { ...formData.salary, currency: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {errors.salary && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.salary}</span>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Range: ${formData.salary.min.toLocaleString()} - $
                      {formData.salary.max.toLocaleString()}{" "}
                      {formData.salary.currency}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-6">
                {/* Job Requirements */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          Job Requirements
                          <span className="text-red-500 ml-1">*</span>
                        </CardTitle>
                        <CardDescription>
                          List the qualifications and experience needed (at
                          least one required)
                        </CardDescription>
                      </div>
                      {aiSuggestions.requirements && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyAISuggestion("requirements")}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Use AI Suggestions
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.requirements.map((requirement, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Requirement ${index + 1}`}
                          value={requirement}
                          onChange={(e) =>
                            handleRequirementChange(index, e.target.value)
                          }
                          className="flex-1"
                        />
                        {formData.requirements.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeRequirement(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={addRequirement}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Requirement
                    </Button>

                    {errors.requirements && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.requirements}</span>
                      </div>
                    )}

                    {aiSuggestions.requirements && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Brain className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            AI Suggested Requirements
                          </span>
                        </div>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {aiSuggestions.requirements.map((req, index) => (
                            <li key={index}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Required Skills */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          Required Skills
                          <span className="text-red-500 ml-1">*</span>
                        </CardTitle>
                        <CardDescription>
                          Add the technical and soft skills needed (at least one
                          required)
                        </CardDescription>
                      </div>
                      {aiSuggestions.skills && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyAISuggestion("skills")}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Add AI Suggestions
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Input
                        placeholder="Type to search and add skills..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && skillInput.trim()) {
                            addSkill(skillInput.trim());
                          }
                        }}
                      />
                      {filteredSkills.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredSkills.map((skill) => (
                            <button
                              key={skill}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                              onClick={() => addSkill(skill)}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>

                    {errors.skills && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.skills}</span>
                      </div>
                    )}

                    {aiSuggestions.skills && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Brain className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            AI Suggested Skills
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="cursor-pointer border-blue-300 text-blue-700"
                              onClick={() => addSkill(skill)}
                            >
                              {skill}
                              <Plus className="w-3 h-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Benefits Tab */}
              <TabsContent value="benefits" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits & Perks</CardTitle>
                    <CardDescription>
                      Select the benefits offered with this position
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {BENEFIT_OPTIONS.map((benefit) => (
                        <div
                          key={benefit}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={benefit}
                            checked={formData.benefits.includes(benefit)}
                            onCheckedChange={() => toggleBenefit(benefit)}
                          />
                          <Label htmlFor={benefit} className="text-sm">
                            {benefit}
                          </Label>
                        </div>
                      ))}
                    </div>

                    {formData.benefits.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">
                          Selected Benefits ({formData.benefits.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.benefits.map((benefit) => (
                            <Badge key={benefit} variant="secondary">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Form Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Form Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.keys(errors).length === 0 ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">All fields valid</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        {Object.keys(errors).length} errors remaining
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Required fields: Title, Company, Location, Description
                      (100+ chars), Requirements, Skills
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setPreviewMode(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={() => handleSubmit("save")}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSubmit("publish")}
                  className="w-full"
                  disabled={isLoading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publish Job
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-brand" />
                  Tips for Better Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Use clear, specific job titles</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Include salary range for better applications</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Be specific about required skills</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Highlight company culture and benefits</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Use AI suggestions for better descriptions</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Job Preview Component
function JobPreview({
  job,
  onEdit,
  user,
}: {
  job: JobFormData;
  onEdit: () => void;
  user: User;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button onClick={onEdit} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Edit
          </Button>
          <Badge className="bg-blue-100 text-blue-800">Preview Mode</Badge>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {job.title}
                </h1>
                <p className="text-xl text-brand font-medium mt-2">
                  {job.company}
                </p>
                <div className="flex items-center space-x-4 mt-4 text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />$
                    {job.salary.min.toLocaleString()} - $
                    {job.salary.max.toLocaleString()} {job.salary.currency}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {job.type.replace("-", " ")}
                  </div>
                  {job.remote && (
                    <Badge
                      variant="outline"
                      className="text-brand border-brand"
                    >
                      Remote
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Job Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {/* Requirements */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {job.requirements
                    .filter((req) => req.trim())
                    .map((requirement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-brand rounded-full mt-2 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {requirement}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Skills */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              {job.benefits.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    Benefits & Perks
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {job.benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <div className="pt-6 border-t">
                <Button size="lg" className="w-full md:w-auto">
                  Apply for this Position
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This is how candidates will see your job posting
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
