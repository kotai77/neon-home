import { useState } from "react";
import { User } from "@/lib/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Bot,
  Users,
  Database,
  Key,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  AlertTriangle,
} from "lucide-react";

interface SettingsPageProps {
  user: User;
}

export default function SettingsPage({ user }: SettingsPageProps) {
  const [settings, setSettings] = useState({
    // Appearance
    theme: "system",
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",

    // Notifications
    emailNotifications: true,
    browserNotifications: true,
    mobileNotifications: false,
    weeklyDigest: true,
    marketingEmails: false,

    // Privacy
    profileVisibility: "public",
    contactByRecruiters: true,
    showSalaryRange: false,
    shareAnalytics: true,

    // AI Settings
    aiMatching: true,
    aiRecommendations: true,
    aiInsights: true,
    matchingAccuracy: [75],

    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true,

    // Data
    autoBackup: true,
    dataRetention: 365,
    exportFormat: "json",
  });

  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
    github: "",
    linkedin: "",
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      // Here you would save settings to the backend
      toast({
        title: "Settings Saved",
        description: "Your settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      // Mock data export
      const exportData = {
        user: user,
        settings: settings,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skillmatch-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Here you would call the API to delete the account
      toast({
        title: "Account Deletion Initiated",
        description: "Your account deletion request has been submitted.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and configurations
            </p>
          </div>
          <Button onClick={handleSaveSettings}>
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="ai">AI Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize how Skillmatch looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) =>
                        handleSettingChange("theme", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center">
                            <Sun className="w-4 h-4 mr-2" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center">
                            <Moon className="w-4 h-4 mr-2" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center">
                            <Monitor className="w-4 h-4 mr-2" />
                            System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) =>
                        handleSettingChange("language", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) =>
                        handleSettingChange("timezone", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">
                          Eastern Time
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time
                        </SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select
                      value={settings.dateFormat}
                      onValueChange={(value) =>
                        handleSettingChange("dateFormat", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Configure your API keys for enhanced features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>OpenAI API Key</Label>
                    <Input
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          openai: e.target.value,
                        }))
                      }
                      placeholder="sk-..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Anthropic API Key</Label>
                    <Input
                      type="password"
                      value={apiKeys.anthropic}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          anthropic: e.target.value,
                        }))
                      }
                      placeholder="sk-ant-..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>GitHub Token</Label>
                    <Input
                      type="password"
                      value={apiKeys.github}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          github: e.target.value,
                        }))
                      }
                      placeholder="ghp_..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>LinkedIn API Key</Label>
                    <Input
                      type="password"
                      value={apiKeys.linkedin}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          linkedin: e.target.value,
                        }))
                      }
                      placeholder="Bearer ..."
                    />
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Connections
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("emailNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show desktop notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={settings.browserNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("browserNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      Mobile Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on mobile devices
                    </p>
                  </div>
                  <Switch
                    checked={settings.mobileNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("mobileNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of your activity
                    </p>
                  </div>
                  <Switch
                    checked={settings.weeklyDigest}
                    onCheckedChange={(checked) =>
                      handleSettingChange("weeklyDigest", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and offers
                    </p>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) =>
                      handleSettingChange("marketingEmails", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control your profile visibility and data sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select
                    value={settings.profileVisibility}
                    onValueChange={(value) =>
                      handleSettingChange("profileVisibility", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        Public - Visible to all recruiters
                      </SelectItem>
                      <SelectItem value="limited">
                        Limited - Visible to verified recruiters
                      </SelectItem>
                      <SelectItem value="private">
                        Private - Not visible to recruiters
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      Allow Contact by Recruiters
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Let recruiters message you directly about opportunities
                    </p>
                  </div>
                  <Switch
                    checked={settings.contactByRecruiters}
                    onCheckedChange={(checked) =>
                      handleSettingChange("contactByRecruiters", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Salary Range</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your salary expectations on your profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.showSalaryRange}
                    onCheckedChange={(checked) =>
                      handleSettingChange("showSalaryRange", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow anonymous usage data to improve the platform
                    </p>
                  </div>
                  <Switch
                    checked={settings.shareAnalytics}
                    onCheckedChange={(checked) =>
                      handleSettingChange("shareAnalytics", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Configuration
                </CardTitle>
                <CardDescription>
                  Configure AI features and matching preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Job Matching</Label>
                    <p className="text-sm text-muted-foreground">
                      Use AI to find jobs that match your profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiMatching}
                    onCheckedChange={(checked) =>
                      handleSettingChange("aiMatching", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Get AI-powered suggestions for improving your profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiRecommendations}
                    onCheckedChange={(checked) =>
                      handleSettingChange("aiRecommendations", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Insights</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive AI-generated insights about job market trends
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiInsights}
                    onCheckedChange={(checked) =>
                      handleSettingChange("aiInsights", checked)
                    }
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Matching Accuracy Threshold:{" "}
                      {settings.matchingAccuracy[0]}%
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Only show jobs with at least this match percentage
                    </p>
                  </div>
                  <Slider
                    value={settings.matchingAccuracy}
                    onValueChange={(value) =>
                      handleSettingChange("matchingAccuracy", value)
                    }
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {settings.twoFactorAuth && (
                      <Badge variant="secondary">Enabled</Badge>
                    )}
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        handleSettingChange("twoFactorAuth", checked)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Select
                    value={settings.sessionTimeout.toString()}
                    onValueChange={(value) =>
                      handleSettingChange("sessionTimeout", parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Login Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone logs into your account
                    </p>
                  </div>
                  <Switch
                    checked={settings.loginAlerts}
                    onCheckedChange={(checked) =>
                      handleSettingChange("loginAlerts", checked)
                    }
                  />
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    View Active Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Control your data backup and retention settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Automatic Backup</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically backup your data weekly
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) =>
                        handleSettingChange("autoBackup", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Retention Period</Label>
                    <Select
                      value={settings.dataRetention.toString()}
                      onValueChange={(value) =>
                        handleSettingChange("dataRetention", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">6 months</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="730">2 years</SelectItem>
                        <SelectItem value="-1">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <Select
                      value={settings.exportFormat}
                      onValueChange={(value) =>
                        handleSettingChange("exportFormat", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleExportData}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export My Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-destructive">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that permanently affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg border-destructive/20 bg-destructive/5">
                    <h4 className="font-medium text-destructive mb-2">
                      Delete Account
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your account and remove your data from our
                            servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Reset All Settings</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Reset all settings to their default values.
                    </p>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
