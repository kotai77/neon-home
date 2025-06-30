import { useState } from "react";
import { User, UserSchema } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Award,
  Upload,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Camera,
  AlertCircle,
} from "lucide-react";

interface ProfilePageProps {
  user: User;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: "",
    location: "",
    bio: "",
    company: "",
    jobTitle: "",
    experience: "",
    website: "",
    linkedin: "",
    github: "",
    skills: [] as string[],
    languages: [] as string[],
    availability: "available",
    salary: { min: 0, max: 0, currency: "USD" },
    workPreference: "hybrid",
    notifications: {
      email: true,
      browser: true,
      mobile: false,
    },
  });

  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  const handleSave = async () => {
    try {
      // Validate form data
      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      };

      // Here you would typically call an API to update the user
      // await apiService.updateProfile(updatedUser);

      toast.success("Profile Updated", {
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    } catch (error) {
      toast.error("Update Failed", {
        description: "Failed to update profile. Please try again.",
      });
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const addLanguage = () => {
    if (
      newLanguage.trim() &&
      !formData.languages.includes(newLanguage.trim())
    ) {
      setFormData({
        ...formData,
        languages: [...formData.languages, newLanguage.trim()],
      });
      setNewLanguage("");
    }
  };

  const removeLanguage = (language: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((l) => l !== language),
    });
  };

  const handleAvatarFileSelect = (file: File) => {
    if (!user.isDemo) {
      toast.error("Feature Limited", {
        description:
          "Photo upload is currently available for demo accounts only.",
      });
      return;
    }

    // Validate image file
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File", {
        description: "Please select an image file (JPG, PNG, GIF, etc.).",
      });
      return;
    }

    // For demo accounts, create a preview URL immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);

    toast.success("Demo Photo Upload", {
      description: "Profile photo updated! (Demo mode - changes are temporary)",
    });
  };

  const handleAvatarUpload = async (url: string) => {
    if (!user.isDemo) {
      toast.error("Feature Limited", {
        description:
          "Photo upload is currently available for demo accounts only.",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      // Simulate API call for demo
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setAvatarUrl(url);
      toast.success("Demo Upload Complete", {
        description: "Profile photo has been updated successfully! (Demo mode)",
      });
    } catch (error) {
      toast.error("Upload Failed", {
        description: "Failed to upload profile photo. Please try again.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    if (!user.isDemo) {
      toast.error("Feature Limited", {
        description:
          "Photo management is currently available for demo accounts only.",
      });
      return;
    }

    setAvatarUrl("");
    toast.success("Photo Removed", {
      description: "Profile photo has been removed. (Demo mode)",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground">
              Manage your profile information and preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="w-5 h-5" />
                    <span>Profile Picture</span>
                  </CardTitle>
                  <CardDescription>
                    Update your profile photo to personalize your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                      <AvatarImage
                        src={avatarUrl || user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && avatarUrl && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0"
                        onClick={removeAvatar}
                        disabled={uploadingAvatar}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {isEditing && (
                    <div className="w-full space-y-3">
                      <FileUpload
                        onFileSelect={handleAvatarFileSelect}
                        onFileUpload={handleAvatarUpload}
                        accept="image/*"
                        maxSize={5 * 1024 * 1024} // 5MB
                        disabled={!user.isDemo || uploadingAvatar}
                        variant="default"
                        showPreview={false}
                        className="w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {uploadingAvatar ? "Uploading..." : "Change Photo"}
                      </FileUpload>

                      {!user.isDemo && (
                        <div className="flex items-start space-x-2 p-3 bg-muted rounded-lg">
                          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium">Demo Feature</p>
                            <p>
                              Photo upload is currently available for demo
                              accounts only. Contact support to enable this
                              feature for your account.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-center">
                    {user.isDemo && (
                      <Badge
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Demo Account</span>
                      </Badge>
                    )}
                    {avatarUrl && avatarUrl !== user.avatar && (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200"
                      >
                        Photo Updated
                      </Badge>
                    )}
                  </div>

                  {user.isDemo && !isEditing && (
                    <p className="text-xs text-center text-muted-foreground max-w-xs">
                      Click "Edit Profile" to upload and manage your profile
                      photo using our demo photo upload feature.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="San Francisco, CA"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Professional Information Tab */}
          <TabsContent value="professional" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Work Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Work Information</CardTitle>
                  <CardDescription>
                    Your current position and professional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="jobTitle"
                        value={formData.jobTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, jobTitle: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="Senior Software Engineer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      disabled={!isEditing}
                      placeholder="Acme Corp"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Select
                      value={formData.experience}
                      onValueChange={(value) =>
                        setFormData({ ...formData, experience: value })
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="1-3">1-3 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workPreference">Work Preference</Label>
                    <Select
                      value={formData.workPreference}
                      onValueChange={(value) =>
                        setFormData({ ...formData, workPreference: value })
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote Only</SelectItem>
                        <SelectItem value="onsite">On-site Only</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Links & Profiles */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Links</CardTitle>
                  <CardDescription>
                    Connect your professional profiles and portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website/Portfolio</Label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) =>
                          setFormData({ ...formData, linkedin: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub Profile</Label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="github"
                        value={formData.github}
                        onChange={(e) =>
                          setFormData({ ...formData, github: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="https://github.com/username"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Skills & Languages</CardTitle>
                  <CardDescription>
                    Add your technical skills and languages you speak
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Skills */}
                  <div className="space-y-4">
                    <Label>Technical Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="group"
                        >
                          {skill}
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-2 opacity-0 group-hover:opacity-100"
                              onClick={() => removeSkill(skill)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill..."
                          onKeyPress={(e) => e.key === "Enter" && addSkill()}
                        />
                        <Button onClick={addSkill} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Languages */}
                  <div className="space-y-4">
                    <Label>Languages</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.languages.map((language) => (
                        <Badge
                          key={language}
                          variant="outline"
                          className="group"
                        >
                          {language}
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-2 opacity-0 group-hover:opacity-100"
                              onClick={() => removeLanguage(language)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input
                          value={newLanguage}
                          onChange={(e) => setNewLanguage(e.target.value)}
                          placeholder="Add a language..."
                          onKeyPress={(e) => e.key === "Enter" && addLanguage()}
                        />
                        <Button onClick={addLanguage} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Preferences</CardTitle>
                <CardDescription>
                  Set your availability and salary expectations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability Status</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) =>
                      setFormData({ ...formData, availability: value })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">
                        Actively Looking
                      </SelectItem>
                      <SelectItem value="open">
                        Open to Opportunities
                      </SelectItem>
                      <SelectItem value="not-looking">Not Looking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Salary Expectations (Annual)</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Minimum</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        value={formData.salary.min}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salary: {
                              ...formData.salary,
                              min: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={!isEditing}
                        placeholder="80000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Maximum</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        value={formData.salary.max}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salary: {
                              ...formData.salary,
                              max: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={!isEditing}
                        placeholder="120000"
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
                        disabled={!isEditing}
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how you receive notifications and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.email}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          email: checked,
                        },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.browser}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          browser: checked,
                        },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mobile Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on mobile devices
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.mobile}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          mobile: checked,
                        },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control your profile visibility and data sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile visible to recruiters
                    </p>
                  </div>
                  <Switch disabled={!isEditing} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Contact Information</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow recruiters to contact you directly
                    </p>
                  </div>
                  <Switch disabled={!isEditing} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Analysis</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to analyze your profile for better matching
                    </p>
                  </div>
                  <Switch disabled={!isEditing} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
