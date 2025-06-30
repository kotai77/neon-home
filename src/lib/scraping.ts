import { assert, assertExists } from "./types";
import { logger } from "./api";
import { aiService } from "./ai";

// Scraping interfaces for dependency injection
export interface ScrapingService {
  scrapeLinkedInProfile(url: string): Promise<LinkedInProfile>;
  scrapeJobBoard(url: string): Promise<JobBoardData>;
  extractFromPDF(fileUrl: string): Promise<DocumentData>;
  extractFromImage(imageUrl: string): Promise<OCRResult>;
  extractFromWebpage(url: string): Promise<WebpageData>;
  validateProfileUrl(url: string): boolean;
  detectProfilePlatform(url: string): ProfilePlatform;
}

export interface LinkedInProfile {
  name: string;
  headline: string;
  summary: string;
  location: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  languages: Language[];
  profileImageUrl?: string;
  connections?: number;
  verified?: boolean;
}

export interface WorkExperience {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  duration: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear?: string;
  grade?: string;
  activities?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Language {
  name: string;
  proficiency:
    | "Elementary"
    | "Limited working"
    | "Professional working"
    | "Full professional"
    | "Native or bilingual";
}

export interface JobBoardData {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: "hour" | "month" | "year";
  };
  jobType: string;
  remote: boolean;
  postedDate: string;
  applicationUrl: string;
  skills: string[];
}

export interface DocumentData {
  text: string;
  metadata: {
    pageCount: number;
    language: string;
    confidence: number;
  };
  sections: DocumentSection[];
  extractedData?: {
    personalInfo?: any;
    experience?: WorkExperience[];
    education?: Education[];
    skills?: string[];
  };
}

export interface DocumentSection {
  type: "header" | "paragraph" | "list" | "table";
  content: string;
  position: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  blocks: TextBlock[];
  metadata: {
    imageWidth: number;
    imageHeight: number;
    processingTime: number;
  };
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  words: TextWord[];
}

export interface TextWord {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WebpageData {
  title: string;
  description: string;
  content: string;
  metadata: {
    url: string;
    domain: string;
    language: string;
    lastModified?: string;
    author?: string;
  };
  links: string[];
  images: string[];
  structured?: any; // JSON-LD or microdata
}

export type ProfilePlatform =
  | "linkedin"
  | "github"
  | "portfolio"
  | "resume"
  | "unknown";

// Mock Scraping Service Implementation
export class MockScrapingService implements ScrapingService {
  private rateLimiter: Map<string, number> = new Map();
  private maxRequestsPerMinute = 10;

  async scrapeLinkedInProfile(url: string): Promise<LinkedInProfile> {
    assert(url.length > 0, "LinkedIn URL must be provided");
    this.validateRateLimit("linkedin");

    logger.info("Scraping LinkedIn profile", { url });

    if (!this.validateProfileUrl(url) || !url.includes("linkedin.com")) {
      throw new Error("Invalid LinkedIn URL");
    }

    // Simulate scraping delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock LinkedIn profile data
    const profile: LinkedInProfile = {
      name: "John Doe",
      headline: "Senior Software Engineer at TechCorp",
      summary:
        "Experienced software engineer with 8+ years in full-stack development. Passionate about building scalable applications and leading high-performing teams.",
      location: "San Francisco, CA",
      experience: [
        {
          company: "TechCorp",
          title: "Senior Software Engineer",
          location: "San Francisco, CA",
          startDate: "2020-03",
          current: true,
          description:
            "Lead development of microservices architecture serving 10M+ users. Built scalable APIs using Node.js and React.",
          duration: "4 years 1 month",
        },
        {
          company: "StartupXYZ",
          title: "Full Stack Developer",
          location: "San Francisco, CA",
          startDate: "2018-01",
          endDate: "2020-02",
          current: false,
          description:
            "Developed web applications from scratch using React, Node.js, and PostgreSQL. Collaborated with design team to implement responsive UI.",
          duration: "2 years 2 months",
        },
      ],
      education: [
        {
          institution: "Stanford University",
          degree: "Bachelor of Science",
          field: "Computer Science",
          startYear: "2014",
          endYear: "2018",
          grade: "3.8 GPA",
        },
      ],
      skills: [
        "JavaScript",
        "React",
        "Node.js",
        "Python",
        "PostgreSQL",
        "AWS",
        "Docker",
        "Kubernetes",
        "GraphQL",
        "TypeScript",
      ],
      certifications: [
        {
          name: "AWS Certified Solutions Architect",
          issuer: "Amazon Web Services",
          issueDate: "2022-06",
          expiryDate: "2025-06",
          credentialId: "AWS-12345",
        },
      ],
      languages: [
        {
          name: "English",
          proficiency: "Native or bilingual",
        },
        {
          name: "Spanish",
          proficiency: "Professional working",
        },
      ],
      profileImageUrl: "https://example.com/profile.jpg",
      connections: 500,
      verified: true,
    };

    logger.info("LinkedIn profile scraped successfully", {
      name: profile.name,
      company: profile.experience[0]?.company,
    });
    return profile;
  }

  async scrapeJobBoard(url: string): Promise<JobBoardData> {
    assert(url.length > 0, "Job board URL must be provided");
    this.validateRateLimit("jobboard");

    logger.info("Scraping job board", { url });

    // Simulate scraping delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const jobData: JobBoardData = {
      title: "Senior React Developer",
      company: "TechCorp",
      location: "San Francisco, CA",
      description:
        "We are looking for a Senior React Developer to join our growing team...",
      requirements: [
        "5+ years of React experience",
        "Strong JavaScript/TypeScript skills",
        "Experience with Redux or similar state management",
        "Knowledge of modern build tools",
      ],
      benefits: [
        "Competitive salary",
        "Health insurance",
        "401k matching",
        "Flexible work hours",
        "Remote work options",
      ],
      salary: {
        min: 120000,
        max: 180000,
        currency: "USD",
        period: "year",
      },
      jobType: "Full-time",
      remote: true,
      postedDate: "2024-01-15",
      applicationUrl: "https://example.com/apply",
      skills: ["React", "JavaScript", "TypeScript", "Redux", "HTML/CSS"],
    };

    logger.info("Job board scraped successfully", {
      title: jobData.title,
      company: jobData.company,
    });
    return jobData;
  }

  async extractFromPDF(fileUrl: string): Promise<DocumentData> {
    assert(fileUrl.length > 0, "PDF file URL must be provided");
    this.validateRateLimit("pdf");

    logger.info("Extracting data from PDF", { fileUrl });

    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const documentData: DocumentData = {
      text: `
        John Doe
        Software Engineer
        john.doe@email.com | (555) 123-4567 | San Francisco, CA
        
        PROFESSIONAL SUMMARY
        Experienced software engineer with 8+ years in full-stack development...
        
        WORK EXPERIENCE
        Senior Software Engineer | TechCorp | 2020 - Present
        - Lead development of microservices architecture
        - Built scalable APIs using Node.js and React
        
        EDUCATION
        Bachelor of Science in Computer Science | Stanford University | 2014-2018
        
        SKILLS
        JavaScript, React, Node.js, Python, PostgreSQL, AWS
      `,
      metadata: {
        pageCount: 2,
        language: "en",
        confidence: 0.95,
      },
      sections: [
        {
          type: "header",
          content: "John Doe\nSoftware Engineer",
          position: { page: 1, x: 100, y: 50, width: 400, height: 60 },
          confidence: 0.98,
        },
        {
          type: "paragraph",
          content: "Experienced software engineer with 8+ years...",
          position: { page: 1, x: 100, y: 150, width: 400, height: 100 },
          confidence: 0.92,
        },
      ],
    };

    // Use AI to extract structured data
    try {
      const extractedData = await aiService.extractResumeData(
        documentData.text,
      );
      documentData.extractedData = extractedData;
    } catch (error) {
      logger.warn("AI extraction failed, using fallback parsing", { error });
      documentData.extractedData = this.fallbackResumeParser(documentData.text);
    }

    logger.info("PDF extraction completed", {
      pages: documentData.metadata.pageCount,
      confidence: documentData.metadata.confidence,
    });
    return documentData;
  }

  async extractFromImage(imageUrl: string): Promise<OCRResult> {
    assert(imageUrl.length > 0, "Image URL must be provided");
    this.validateRateLimit("ocr");

    logger.info("Performing OCR on image", { imageUrl });

    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const ocrResult: OCRResult = {
      text: "John Doe\nSoftware Engineer\njohn.doe@email.com\n(555) 123-4567",
      confidence: 0.89,
      language: "en",
      blocks: [
        {
          text: "John Doe",
          confidence: 0.95,
          boundingBox: { x: 100, y: 50, width: 200, height: 30 },
          words: [
            {
              text: "John",
              confidence: 0.97,
              boundingBox: { x: 100, y: 50, width: 80, height: 30 },
            },
            {
              text: "Doe",
              confidence: 0.93,
              boundingBox: { x: 190, y: 50, width: 60, height: 30 },
            },
          ],
        },
      ],
      metadata: {
        imageWidth: 800,
        imageHeight: 600,
        processingTime: 2500,
      },
    };

    logger.info("OCR completed", {
      textLength: ocrResult.text.length,
      confidence: ocrResult.confidence,
    });
    return ocrResult;
  }

  async extractFromWebpage(url: string): Promise<WebpageData> {
    assert(url.length > 0, "Webpage URL must be provided");
    this.validateRateLimit("webpage");

    logger.info("Extracting data from webpage", { url });

    // Simulate webpage scraping delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const webpageData: WebpageData = {
      title: "John Doe - Software Engineer Portfolio",
      description:
        "Personal portfolio showcasing software engineering projects and experience",
      content:
        "Welcome to my portfolio. I'm a software engineer with expertise in...",
      metadata: {
        url,
        domain: new URL(url).hostname,
        language: "en",
        lastModified: "2024-01-15T10:30:00Z",
        author: "John Doe",
      },
      links: [
        "https://github.com/johndoe",
        "https://linkedin.com/in/johndoe",
        "mailto:john.doe@email.com",
      ],
      images: [
        "https://example.com/profile.jpg",
        "https://example.com/project1.png",
      ],
      structured: {
        "@type": "Person",
        name: "John Doe",
        jobTitle: "Software Engineer",
        email: "john.doe@email.com",
      },
    };

    logger.info("Webpage extraction completed", {
      title: webpageData.title,
      linksFound: webpageData.links.length,
    });
    return webpageData;
  }

  validateProfileUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const validDomains = [
        "linkedin.com",
        "github.com",
        "stackoverflow.com",
        "behance.net",
        "dribbble.com",
        "medium.com",
      ];

      return validDomains.some((domain) => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  detectProfilePlatform(url: string): ProfilePlatform {
    if (!this.validateProfileUrl(url)) {
      return "unknown";
    }

    const urlLower = url.toLowerCase();

    if (urlLower.includes("linkedin.com")) return "linkedin";
    if (urlLower.includes("github.com")) return "github";
    if (urlLower.includes(".pdf") || urlLower.includes("resume"))
      return "resume";

    // Check if it looks like a personal portfolio
    const portfolioIndicators = ["portfolio", "personal", "website", "bio"];
    if (portfolioIndicators.some((indicator) => urlLower.includes(indicator))) {
      return "portfolio";
    }

    return "unknown";
  }

  private validateRateLimit(service: string): void {
    const now = Date.now();
    const key = `${service}_${Math.floor(now / 60000)}`; // Per minute
    const count = this.rateLimiter.get(key) || 0;

    if (count >= this.maxRequestsPerMinute) {
      throw new Error(
        `Rate limit exceeded for ${service}. Please try again later.`,
      );
    }

    this.rateLimiter.set(key, count + 1);

    // Clean up old entries
    Array.from(this.rateLimiter.keys()).forEach((k) => {
      const keyTime = parseInt(k.split("_")[1]);
      if (now - keyTime * 60000 > 60000) {
        this.rateLimiter.delete(k);
      }
    });
  }

  private fallbackResumeParser(text: string): any {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

    let personalInfo: any = {};
    let skills: string[] = [];

    // Extract email and phone
    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);

    if (emailMatch) personalInfo.email = emailMatch[0];
    if (phoneMatch) personalInfo.phone = phoneMatch[0];

    // Extract potential name (first non-empty line)
    if (lines.length > 0) {
      personalInfo.name = lines[0];
    }

    // Extract skills (look for common technical skills)
    const commonSkills = [
      "JavaScript",
      "Python",
      "Java",
      "React",
      "Node.js",
      "SQL",
      "AWS",
      "Docker",
      "Kubernetes",
      "Git",
      "HTML",
      "CSS",
      "TypeScript",
    ];

    commonSkills.forEach((skill) => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    return {
      personalInfo,
      skills: [...new Set(skills)], // Remove duplicates
    };
  }
}

// Bulk scraping manager for processing multiple profiles
export class BulkScrapingManager {
  private scrapingService: ScrapingService;
  private maxConcurrent = 3;
  private queue: ScrapingTask[] = [];
  private activeJobs: Map<string, ScrapingTask> = new Map();

  constructor(scrapingService: ScrapingService) {
    assertExists(scrapingService, "Scraping service");
    this.scrapingService = scrapingService;
  }

  async addScrapingJob(
    urls: string[],
    onProgress?: (completed: number, total: number) => void,
    onItemComplete?: (url: string, result: any) => void,
  ): Promise<string> {
    assert(urls.length > 0, "URLs list must not be empty");

    const jobId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const tasks: ScrapingTask[] = urls.map((url, index) => ({
      id: `${jobId}_${index}`,
      url,
      platform: this.scrapingService.detectProfilePlatform(url),
      status: "pending",
      createdAt: new Date(),
    }));

    this.queue.push(...tasks);

    logger.info("Bulk scraping job created", { jobId, urlCount: urls.length });

    // Start processing
    this.processQueue(onProgress, onItemComplete);

    return jobId;
  }

  private async processQueue(
    onProgress?: (completed: number, total: number) => void,
    onItemComplete?: (url: string, result: any) => void,
  ): Promise<void> {
    while (this.queue.length > 0 && this.activeJobs.size < this.maxConcurrent) {
      const task = this.queue.shift();
      if (!task) break;

      this.activeJobs.set(task.id, task);

      this.processTask(task)
        .then((result) => {
          task.status = "completed";
          task.result = result;
          task.completedAt = new Date();

          if (onItemComplete) {
            onItemComplete(task.url, result);
          }
        })
        .catch((error) => {
          task.status = "failed";
          task.error = error instanceof Error ? error.message : "Unknown error";
          task.completedAt = new Date();

          logger.error("Scraping task failed", {
            taskId: task.id,
            url: task.url,
            error,
          });
        })
        .finally(() => {
          this.activeJobs.delete(task.id);

          if (onProgress) {
            const completed = this.getCompletedTasksCount();
            const total = this.getTotalTasksCount();
            onProgress(completed, total);
          }

          // Continue processing queue
          this.processQueue(onProgress, onItemComplete);
        });
    }
  }

  private async processTask(task: ScrapingTask): Promise<any> {
    task.status = "processing";
    task.startedAt = new Date();

    switch (task.platform) {
      case "linkedin":
        return await this.scrapingService.scrapeLinkedInProfile(task.url);
      case "github":
        return await this.scrapingService.extractFromWebpage(task.url);
      case "portfolio":
        return await this.scrapingService.extractFromWebpage(task.url);
      case "resume":
        return await this.scrapingService.extractFromPDF(task.url);
      default:
        return await this.scrapingService.extractFromWebpage(task.url);
    }
  }

  getJobStatus(jobId: string): BulkJobStatus {
    const allTasks = [...this.queue, ...Array.from(this.activeJobs.values())];
    const jobTasks = allTasks.filter((task) => task.id.startsWith(jobId));

    if (jobTasks.length === 0) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const completed = jobTasks.filter(
      (task) => task.status === "completed",
    ).length;
    const failed = jobTasks.filter((task) => task.status === "failed").length;
    const processing = jobTasks.filter(
      (task) => task.status === "processing",
    ).length;
    const pending = jobTasks.filter((task) => task.status === "pending").length;

    return {
      jobId,
      total: jobTasks.length,
      completed,
      failed,
      processing,
      pending,
      isComplete: completed + failed === jobTasks.length,
      results: jobTasks
        .filter((task) => task.result)
        .map((task) => ({
          url: task.url,
          result: task.result,
        })),
    };
  }

  private getCompletedTasksCount(): number {
    return Array.from(this.activeJobs.values()).filter(
      (task) => task.status === "completed" || task.status === "failed",
    ).length;
  }

  private getTotalTasksCount(): number {
    return this.queue.length + this.activeJobs.size;
  }
}

export interface ScrapingTask {
  id: string;
  url: string;
  platform: ProfilePlatform;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface BulkJobStatus {
  jobId: string;
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
  isComplete: boolean;
  results: Array<{ url: string; result: any }>;
}

// Create singleton instances
export const scrapingService = new MockScrapingService();
export const bulkScrapingManager = new BulkScrapingManager(scrapingService);
