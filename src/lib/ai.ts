import { assert, assertExists } from "./types";
import { logger } from "./api";

// AI Provider interfaces for dependency injection
export interface AIProvider {
  id: string;
  name: string;
  type: "openai" | "anthropic" | "azure" | "custom";
  analyze(
    content: string,
    type: "resume" | "job" | "match",
  ): Promise<AIAnalysisResult>;
  score(candidateData: any, jobData: any): Promise<number>;
  extractData(content: string, schema: any): Promise<any>;
}

export interface AIAnalysisResult {
  score: number;
  skills: string[];
  experience: {
    years: number;
    roles: string[];
    companies: string[];
  };
  education: {
    degrees: string[];
    institutions: string[];
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface AIConfiguration {
  enabled: boolean;
  primaryProvider: string;
  fallbackProvider?: string;
  providers: {
    [key: string]: AIProviderConfig;
  };
  settings: {
    confidenceThreshold: number;
    maxRetries: number;
    timeout: number;
  };
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  enabled: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

// OpenAI Provider Implementation
export class OpenAIProvider implements AIProvider {
  id = "openai";
  name = "OpenAI";
  type = "openai" as const;

  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    assertExists(config.apiKey, "OpenAI API key");
    assertExists(config.model, "OpenAI model");

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
    this.model = config.model;

    assert(this.apiKey.length > 0, "API key must not be empty");
    assert(this.model.length > 0, "Model must not be empty");
  }

  async analyze(
    content: string,
    type: "resume" | "job" | "match",
  ): Promise<AIAnalysisResult> {
    assert(content.length > 0, "Content must not be empty");
    assert(["resume", "job", "match"].includes(type), "Invalid analysis type");

    logger.info(`Starting ${type} analysis`, {
      provider: this.name,
      model: this.model,
    });

    const prompt = this.getPromptForType(type, content);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are an expert recruitment AI that analyzes resumes and job postings to provide detailed insights and scoring.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      this.validateAnalysisResult(analysis);

      logger.info(`${type} analysis completed`, {
        provider: this.name,
        score: analysis.score,
        skillsFound: analysis.skills.length,
      });

      return analysis;
    } catch (error) {
      logger.error(`AI analysis failed`, { provider: this.name, type, error });
      throw new Error(
        `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async score(candidateData: any, jobData: any): Promise<number> {
    assertExists(candidateData, "Candidate data");
    assertExists(jobData, "Job data");

    logger.info("Starting candidate scoring", { provider: this.name });

    const prompt = `
    Score this candidate for the job position on a scale of 0-100.

    Candidate:
    ${JSON.stringify(candidateData, null, 2)}

    Job Requirements:
    ${JSON.stringify(jobData, null, 2)}

    Provide only a numeric score between 0 and 100.
    `;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are a recruitment scoring system. Provide only numeric scores.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const score = parseInt(data.choices[0].message.content.trim());

      assert(!isNaN(score), "Score must be a valid number");
      assert(score >= 0 && score <= 100, "Score must be between 0 and 100");

      logger.info("Candidate scoring completed", {
        provider: this.name,
        score,
      });

      return score;
    } catch (error) {
      logger.error("Candidate scoring failed", { provider: this.name, error });
      throw new Error(
        `Scoring failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async extractData(content: string, schema: any): Promise<any> {
    assert(content.length > 0, "Content must not be empty");
    assertExists(schema, "Schema must be provided");

    logger.info("Starting data extraction", { provider: this.name });

    const prompt = `
    Extract structured data from the following content according to this schema:

    Schema: ${JSON.stringify(schema, null, 2)}

    Content: ${content}

    Return only valid JSON matching the schema.
    `;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are a data extraction system. Return only valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const extractedData = JSON.parse(data.choices[0].message.content);

      logger.info("Data extraction completed", { provider: this.name });

      return extractedData;
    } catch (error) {
      logger.error("Data extraction failed", { provider: this.name, error });
      throw new Error(
        `Data extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private getPromptForType(type: string, content: string): string {
    switch (type) {
      case "resume":
        return `
        Analyze this resume and return a JSON object with the following structure:
        {
          "score": <overall quality score 0-100>,
          "skills": ["skill1", "skill2", ...],
          "experience": {
            "years": <total years of experience>,
            "roles": ["role1", "role2", ...],
            "companies": ["company1", "company2", ...]
          },
          "education": {
            "degrees": ["degree1", "degree2", ...],
            "institutions": ["school1", "school2", ...]
          },
          "summary": "<brief professional summary>",
          "strengths": ["strength1", "strength2", ...],
          "weaknesses": ["weakness1", "weakness2", ...],
          "recommendations": ["recommendation1", "recommendation2", ...]
        }

        Resume content: ${content}
        `;

      case "job":
        return `
        Analyze this job posting and return insights about requirements and candidate fit:

        Job posting: ${content}
        `;

      case "match":
        return `
        Analyze the match between candidate and job:

        ${content}
        `;

      default:
        throw new Error(`Unsupported analysis type: ${type}`);
    }
  }

  private validateAnalysisResult(result: any): void {
    assertExists(result, "Analysis result");
    assert(typeof result.score === "number", "Score must be a number");
    assert(
      result.score >= 0 && result.score <= 100,
      "Score must be between 0 and 100",
    );
    assert(Array.isArray(result.skills), "Skills must be an array");
    assertExists(result.experience, "Experience must be provided");
    assertExists(result.education, "Education must be provided");
    assert(typeof result.summary === "string", "Summary must be a string");
  }
}

// AI Service Manager
export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private config: AIConfiguration;

  constructor(config: AIConfiguration) {
    assertExists(config, "AI configuration");
    assert(
      config.primaryProvider.length > 0,
      "Primary provider must be specified",
    );

    this.config = config;
    this.initializeProviders();

    logger.info("AI Service initialized", {
      primaryProvider: config.primaryProvider,
      enabledProviders: Array.from(this.providers.keys()),
    });
  }

  private initializeProviders(): void {
    Object.entries(this.config.providers).forEach(([id, config]) => {
      if (!config.enabled) return;

      try {
        let provider: AIProvider;

        switch (id) {
          case "openai":
            provider = new OpenAIProvider(config);
            break;
          default:
            logger.warn(`Unknown AI provider: ${id}`);
            return;
        }

        this.providers.set(id, provider);
        logger.info(`AI Provider initialized: ${id}`);
      } catch (error) {
        logger.error(`Failed to initialize AI provider: ${id}`, error);
      }
    });
  }

  async analyzeResume(content: string): Promise<AIAnalysisResult> {
    assert(content.length > 0, "Resume content must not be empty");
    return this.executeWithFallback((provider) =>
      provider.analyze(content, "resume"),
    );
  }

  async analyzeJob(content: string): Promise<AIAnalysisResult> {
    assert(content.length > 0, "Job content must not be empty");
    return this.executeWithFallback((provider) =>
      provider.analyze(content, "job"),
    );
  }

  async scoreCandidate(candidateData: any, jobData: any): Promise<number> {
    assertExists(candidateData, "Candidate data");
    assertExists(jobData, "Job data");
    return this.executeWithFallback((provider) =>
      provider.score(candidateData, jobData),
    );
  }

  async extractResumeData(content: string): Promise<any> {
    assert(content.length > 0, "Resume content must not be empty");

    const schema = {
      personalInfo: {
        name: "string",
        email: "string",
        phone: "string",
        location: "string",
      },
      experience: [
        {
          company: "string",
          title: "string",
          startDate: "string",
          endDate: "string",
          description: "string",
        },
      ],
      education: [
        {
          institution: "string",
          degree: "string",
          field: "string",
          year: "string",
        },
      ],
      skills: ["string"],
    };

    return this.executeWithFallback((provider) =>
      provider.extractData(content, schema),
    );
  }

  private async executeWithFallback<T>(
    operation: (provider: AIProvider) => Promise<T>,
  ): Promise<T> {
    const primaryProvider = this.providers.get(this.config.primaryProvider);

    if (!primaryProvider) {
      throw new Error(
        `Primary AI provider not available: ${this.config.primaryProvider}`,
      );
    }

    try {
      return await operation(primaryProvider);
    } catch (error) {
      logger.warn(`Primary AI provider failed, trying fallback`, { error });

      if (this.config.fallbackProvider) {
        const fallbackProvider = this.providers.get(
          this.config.fallbackProvider,
        );
        if (fallbackProvider) {
          try {
            return await operation(fallbackProvider);
          } catch (fallbackError) {
            logger.error(`Fallback AI provider also failed`, { fallbackError });
          }
        }
      }

      throw error;
    }
  }

  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  isEnabled(): boolean {
    return this.config.enabled && this.providers.size > 0;
  }
}

// Default AI configuration
export const defaultAIConfig: AIConfiguration = {
  enabled: true,
  primaryProvider: "openai",
  providers: {
    openai: {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
      model: "gpt-4",
      enabled: true,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 1000,
      },
    },
  },
  settings: {
    confidenceThreshold: 0.7,
    maxRetries: 3,
    timeout: 30000,
  },
};

// Create singleton AI service
export const aiService = new AIService(defaultAIConfig);
