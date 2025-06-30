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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Download,
  Link as LinkIcon,
  FileText,
  Eye,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  Zap,
  Globe,
  Camera,
  Settings,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { User, assert, assertExists } from "@/lib/types";
import {
  scrapingService,
  bulkScrapingManager,
  BulkJobStatus,
} from "@/lib/scraping";
import { uploadManager, FileTypes, getUploadPath } from "@/lib/storage";
import { logger } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ScrapingPageProps {
  user: User;
}

interface ScrapingJob {
  id: string;
  type: "url" | "file" | "bulk";
  status: "pending" | "processing" | "completed" | "failed";
  input: string;
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
}

export default function ScrapingPage({ user }: ScrapingPageProps) {
  assertExists(user, "User");
  assert(
    user.role === "recruiter",
    "Only recruiters can access scraping tools",
  );

  const [scrapingJobs, setScrapingJobs] = useState<ScrapingJob[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    loadScrapingHistory();
  }, []);

  const loadScrapingHistory = async () => {
    // In a real app, this would load from API
    const mockHistory: ScrapingJob[] = [
      {
        id: "job-1",
        type: "url",
        status: "completed",
        input: "https://linkedin.com/in/johndoe",
        progress: 100,
        result: {
          name: "John Doe",
          title: "Senior Developer",
          company: "TechCorp",
          skills: ["React", "JavaScript", "Node.js"],
        },
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: "job-2",
        type: "bulk",
        status: "processing",
        input: "5 LinkedIn profiles",
        progress: 60,
        createdAt: new Date(Date.now() - 1800000),
      },
    ];
    setScrapingJobs(mockHistory);
  };

  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scrape.",
        variant: "destructive",
      });
      return;
    }

    if (!scrapingService.validateProfileUrl(urlInput)) {
      toast({
        title: "Invalid URL",
        description:
          "Please enter a valid profile URL (LinkedIn, GitHub, etc.).",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const jobId = `job-${Date.now()}`;

    try {
      logger.info("Starting URL scraping", { url: urlInput, jobId });

      // Add job to tracking
      const newJob: ScrapingJob = {
        id: jobId,
        type: "url",
        status: "processing",
        input: urlInput,
        progress: 0,
        createdAt: new Date(),
      };
      setScrapingJobs((prev) => [newJob, ...prev]);

      // Determine platform and scrape accordingly
      const platform = scrapingService.detectProfilePlatform(urlInput);
      let result;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScrapingJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, progress: Math.min(job.progress + 20, 90) }
              : job,
          ),
        );
      }, 500);

      switch (platform) {
        case "linkedin":
          result = await scrapingService.scrapeLinkedInProfile(urlInput);
          break;
        case "github":
        case "portfolio":
          result = await scrapingService.extractFromWebpage(urlInput);
          break;
        default:
          result = await scrapingService.extractFromWebpage(urlInput);
      }

      clearInterval(progressInterval);

      // Update job with result
      setScrapingJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status: "completed", progress: 100, result }
            : job,
        ),
      );

      setExtractedData((prev) => [result, ...prev]);

      toast({
        title: "Scraping Complete",
        description: `Successfully extracted profile data for ${result.name || "candidate"}.`,
      });

      logger.info("URL scraping completed", { jobId, platform, result });
    } catch (error) {
      logger.error("URL scraping failed", { error, url: urlInput, jobId });

      setScrapingJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: "failed",
                progress: 100,
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : job,
        ),
      );

      toast({
        title: "Scraping Failed",
        description:
          "Failed to extract profile data. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkScrape = async () => {
    const urls = bulkUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      toast({
        title: "URLs Required",
        description: "Please enter at least one URL to scrape.",
        variant: "destructive",
      });
      return;
    }

    if (urls.length > 10) {
      toast({
        title: "Too Many URLs",
        description: "Please limit bulk scraping to 10 URLs at a time.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const jobId = `bulk-${Date.now()}`;

    try {
      logger.info("Starting bulk scraping", {
        urls,
        count: urls.length,
        jobId,
      });

      // Add job to tracking
      const newJob: ScrapingJob = {
        id: jobId,
        type: "bulk",
        status: "processing",
        input: `${urls.length} URLs`,
        progress: 0,
        createdAt: new Date(),
      };
      setScrapingJobs((prev) => [newJob, ...prev]);

      // Start bulk scraping
      const bulkJobId = await bulkScrapingManager.addScrapingJob(
        urls,
        (completed, total) => {
          const progress = Math.round((completed / total) * 100);
          setScrapingJobs((prev) =>
            prev.map((job) => (job.id === jobId ? { ...job, progress } : job)),
          );
        },
        (url, result) => {
          setExtractedData((prev) => [result, ...prev]);
          logger.info("Individual URL completed", { url, result });
        },
      );

      // Monitor bulk job completion
      const checkCompletion = setInterval(() => {
        const status = bulkScrapingManager.getJobStatus(bulkJobId);
        if (status.isComplete) {
          clearInterval(checkCompletion);

          setScrapingJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    status: "completed",
                    progress: 100,
                    result: status.results,
                  }
                : job,
            ),
          );

          toast({
            title: "Bulk Scraping Complete",
            description: `Successfully processed ${status.completed} of ${status.total} URLs.`,
          });

          logger.info("Bulk scraping completed", {
            jobId,
            bulkJobId,
            completed: status.completed,
            failed: status.failed,
          });
        }
      }, 2000);
    } catch (error) {
      logger.error("Bulk scraping failed", { error, urls, jobId });

      setScrapingJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: "failed",
                progress: 100,
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : job,
        ),
      );

      toast({
        title: "Bulk Scraping Failed",
        description: "Failed to start bulk scraping. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf") && !file.type.includes("image")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF document or image file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    const jobId = `file-${Date.now()}`;

    try {
      logger.info("Starting file extraction", { fileName: file.name, jobId });

      // Add job to tracking
      const newJob: ScrapingJob = {
        id: jobId,
        type: "file",
        status: "processing",
        input: file.name,
        progress: 0,
        createdAt: new Date(),
      };
      setScrapingJobs((prev) => [newJob, ...prev]);

      // Upload file first
      const uploadPath = getUploadPath(user.id, FileTypes.DOCUMENT, file.name);
      const uploadResult = await uploadManager.uploadFile(
        file,
        uploadPath,
        (progress) => {
          setScrapingJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? { ...job, progress: Math.round(progress * 0.3) }
                : job,
            ),
          );
        },
      );

      // Extract data from uploaded file
      let result;
      if (file.type.includes("pdf")) {
        result = await scrapingService.extractFromPDF(uploadResult.url);
      } else {
        result = await scrapingService.extractFromImage(uploadResult.url);
      }

      setScrapingJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status: "completed", progress: 100, result }
            : job,
        ),
      );

      if (result.extractedData) {
        setExtractedData((prev) => [result.extractedData, ...prev]);
      }

      toast({
        title: "File Processing Complete",
        description: `Successfully extracted data from ${file.name}.`,
      });

      logger.info("File extraction completed", { jobId, fileName: file.name });
    } catch (error) {
      logger.error("File extraction failed", {
        error,
        fileName: file.name,
        jobId,
      });

      setScrapingJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: "failed",
                progress: 100,
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : job,
        ),
      );

      toast({
        title: "File Processing Failed",
        description: "Failed to extract data from file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedFile(null);
    }
  };

  const handleDeleteJob = (jobId: string) => {
    setScrapingJobs((prev) => prev.filter((job) => job.id !== jobId));
    toast({
      title: "Job Deleted",
      description: "Scraping job has been removed from history.",
    });
  };

  const handleRetryJob = async (job: ScrapingJob) => {
    if (job.type === "url") {
      setUrlInput(job.input);
      await handleScrapeUrl();
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "processing":
        return <Clock className="w-4 h-4 text-warning animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground">
            Completed
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "processing":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Processing
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Globe className="w-8 h-8 mr-3 text-brand" />
            Candidate Profile Scraper
          </h1>
          <p className="text-muted-foreground mt-2">
            Extract candidate information from LinkedIn profiles, resumes, and
            other sources using AI and OCR.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scraping Tools */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url">URL Scraping</TabsTrigger>
                <TabsTrigger value="file">File Upload</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Processing</TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LinkIcon className="w-5 h-5 mr-2 text-brand" />
                      Profile URL Scraping
                    </CardTitle>
                    <CardDescription>
                      Extract candidate information from LinkedIn, GitHub, or
                      portfolio URLs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">Profile URL</Label>
                      <Input
                        id="url"
                        placeholder="https://linkedin.com/in/johndoe"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Supported: LinkedIn, GitHub, personal portfolios, and
                        other professional profiles
                      </p>
                    </div>
                    <Button
                      onClick={handleScrapeUrl}
                      disabled={isProcessing || !urlInput.trim()}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Extracting Data...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Extract Profile Data
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="file" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-brand" />
                      Document Processing
                    </CardTitle>
                    <CardDescription>
                      Upload resumes, CVs, or other documents to extract
                      candidate information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Document</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={handleFileUpload}
                          disabled={isProcessing}
                          className="w-full"
                        />
                        <div className="text-center mt-4">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Drop files here or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Supports PDF, DOC, DOCX, PNG, JPG (max 10MB)
                          </p>
                        </div>
                      </div>
                    </div>
                    {selectedFile && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">
                          Selected: {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-brand" />
                      Bulk URL Processing
                    </CardTitle>
                    <CardDescription>
                      Process multiple profile URLs at once (up to 10 URLs)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulk-urls">URLs (one per line)</Label>
                      <Textarea
                        id="bulk-urls"
                        placeholder="https://linkedin.com/in/candidate1&#10;https://linkedin.com/in/candidate2&#10;https://github.com/developer1"
                        value={bulkUrls}
                        onChange={(e) => setBulkUrls(e.target.value)}
                        className="min-h-32"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter up to 10 URLs, one per line. Processing may take
                        several minutes.
                      </p>
                    </div>
                    <Button
                      onClick={handleBulkScrape}
                      disabled={isProcessing || !bulkUrls.trim()}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing Bulk...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Start Bulk Processing
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Extracted Data Preview */}
            {extractedData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recently Extracted Data</CardTitle>
                  <CardDescription>
                    Preview of candidate information extracted from recent
                    scraping jobs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {extractedData.slice(0, 3).map((data, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">
                          {data.name ||
                            data.personalInfo?.name ||
                            "Unknown Candidate"}
                        </h4>
                        {data.headline && (
                          <p className="text-sm text-brand mb-2">
                            {data.headline}
                          </p>
                        )}
                        {data.summary && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {data.summary}
                          </p>
                        )}
                        {(data.skills || data.personalInfo?.skills) && (
                          <div className="flex flex-wrap gap-1">
                            {(data.skills || data.personalInfo?.skills)
                              .slice(0, 4)
                              .map((skill: string, skillIndex: number) => (
                                <Badge
                                  key={skillIndex}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {extractedData.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{extractedData.length - 3} more candidates extracted
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Job History Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Scraping Jobs</CardTitle>
                <CardDescription>
                  Track your extraction progress and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scrapingJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No scraping jobs yet
                    </p>
                  ) : (
                    scrapingJobs.slice(0, 10).map((job) => (
                      <div
                        key={job.id}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getJobStatusIcon(job.status)}
                            <span className="text-sm font-medium truncate">
                              {job.input}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {job.status === "failed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRetryJob(job)}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {getJobStatusBadge(job.status)}
                          <span className="text-xs text-muted-foreground">
                            {job.createdAt.toLocaleTimeString()}
                          </span>
                        </div>

                        {job.status === "processing" && (
                          <Progress value={job.progress} className="h-1" />
                        )}

                        {job.error && (
                          <div className="flex items-start space-x-2 p-2 bg-destructive/10 rounded">
                            <AlertCircle className="w-3 h-3 text-destructive mt-0.5" />
                            <p className="text-xs text-destructive">
                              {job.error}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Scraping Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-brand rounded-full mt-2"></div>
                    <p>LinkedIn profiles provide the most comprehensive data</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-brand rounded-full mt-2"></div>
                    <p>Public profiles work best for data extraction</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-brand rounded-full mt-2"></div>
                    <p>PDF resumes should be text-based for best results</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-brand rounded-full mt-2"></div>
                    <p>
                      Bulk processing has rate limits to respect platform ToS
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
