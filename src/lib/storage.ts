import { assert, assertExists } from "./types";
import { logger } from "./api";

// Storage interfaces for dependency injection
export interface StorageService {
  uploadFile(
    file: File,
    path: string,
    metadata?: FileMetadata,
  ): Promise<UploadResult>;
  downloadFile(url: string): Promise<Blob>;
  deleteFile(url: string): Promise<void>;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
  listFiles(prefix: string): Promise<FileInfo[]>;
  copyFile(sourceUrl: string, destinationPath: string): Promise<string>;
  getFileInfo(url: string): Promise<FileInfo>;
  generateThumbnail(imageUrl: string, size: ThumbnailSize): Promise<string>;
}

export interface FileMetadata {
  contentType?: string;
  cacheControl?: string;
  contentDisposition?: string;
  customMetadata?: Record<string, string>;
}

export interface UploadResult {
  url: string;
  publicUrl: string;
  size: number;
  contentType: string;
  etag: string;
  uploadedAt: Date;
}

export interface FileInfo {
  url: string;
  publicUrl: string;
  name: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  metadata?: Record<string, string>;
}

export interface ThumbnailSize {
  width: number;
  height: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
}

export interface FileValidationRules {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
  virusScanRequired?: boolean;
}

// Mock Storage Service Implementation (for development)
export class MockStorageService implements StorageService {
  private files: Map<string, { data: Blob; metadata: FileInfo }> = new Map();
  private baseUrl = "https://storage.skillmatch.dev";

  async uploadFile(
    file: File,
    path: string,
    metadata?: FileMetadata,
  ): Promise<UploadResult> {
    assert(file.size > 0, "File must not be empty");
    assert(path.length > 0, "File path must be provided");

    logger.info("Uploading file", {
      fileName: file.name,
      size: file.size,
      path,
    });

    // Validate file
    this.validateFile(file);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullPath = `${path}/${fileId}-${file.name}`;
    const url = `${this.baseUrl}/${fullPath}`;

    const fileInfo: FileInfo = {
      url,
      publicUrl: url,
      name: file.name,
      size: file.size,
      contentType: file.type,
      lastModified: new Date(),
      etag: `"${fileId}"`,
      metadata: metadata?.customMetadata,
    };

    this.files.set(url, {
      data: file,
      metadata: fileInfo,
    });

    const result: UploadResult = {
      url,
      publicUrl: url,
      size: file.size,
      contentType: file.type,
      etag: fileInfo.etag,
      uploadedAt: new Date(),
    };

    logger.info("File uploaded successfully", { url, size: file.size });
    return result;
  }

  async downloadFile(url: string): Promise<Blob> {
    assert(url.length > 0, "File URL must be provided");

    logger.info("Downloading file", { url });

    const fileData = this.files.get(url);
    if (!fileData) {
      throw new Error(`File not found: ${url}`);
    }

    // Simulate download delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    logger.info("File downloaded successfully", { url });
    return fileData.data;
  }

  async deleteFile(url: string): Promise<void> {
    assert(url.length > 0, "File URL must be provided");

    logger.info("Deleting file", { url });

    if (!this.files.has(url)) {
      throw new Error(`File not found: ${url}`);
    }

    this.files.delete(url);

    logger.info("File deleted successfully", { url });
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    assert(path.length > 0, "File path must be provided");
    assert(expiresIn > 0, "Expiration time must be positive");

    logger.info("Generating signed URL", { path, expiresIn });

    const signedUrl = `${this.baseUrl}/${path}?expires=${Date.now() + expiresIn * 1000}&signature=mock_signature`;

    logger.info("Signed URL generated", { signedUrl });
    return signedUrl;
  }

  async listFiles(prefix: string): Promise<FileInfo[]> {
    assert(prefix.length >= 0, "Prefix must be provided");

    logger.info("Listing files", { prefix });

    const matchingFiles = Array.from(this.files.values())
      .map((f) => f.metadata)
      .filter((f) => f.url.includes(prefix));

    logger.info("Files listed", { count: matchingFiles.length, prefix });
    return matchingFiles;
  }

  async copyFile(sourceUrl: string, destinationPath: string): Promise<string> {
    assert(sourceUrl.length > 0, "Source URL must be provided");
    assert(destinationPath.length > 0, "Destination path must be provided");

    logger.info("Copying file", { sourceUrl, destinationPath });

    const sourceFile = this.files.get(sourceUrl);
    if (!sourceFile) {
      throw new Error(`Source file not found: ${sourceUrl}`);
    }

    const destinationUrl = `${this.baseUrl}/${destinationPath}`;

    this.files.set(destinationUrl, {
      ...sourceFile,
      metadata: {
        ...sourceFile.metadata,
        url: destinationUrl,
        publicUrl: destinationUrl,
      },
    });

    logger.info("File copied successfully", { sourceUrl, destinationUrl });
    return destinationUrl;
  }

  async getFileInfo(url: string): Promise<FileInfo> {
    assert(url.length > 0, "File URL must be provided");

    const fileData = this.files.get(url);
    if (!fileData) {
      throw new Error(`File not found: ${url}`);
    }

    return fileData.metadata;
  }

  async generateThumbnail(
    imageUrl: string,
    size: ThumbnailSize,
  ): Promise<string> {
    assert(imageUrl.length > 0, "Image URL must be provided");
    assert(size.width > 0, "Thumbnail width must be positive");
    assert(size.height > 0, "Thumbnail height must be positive");

    logger.info("Generating thumbnail", { imageUrl, size });

    // Simulate thumbnail generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const thumbnailUrl = `${imageUrl}?w=${size.width}&h=${size.height}&q=${size.quality || 80}&f=${size.format || "jpeg"}`;

    logger.info("Thumbnail generated", { thumbnailUrl });
    return thumbnailUrl;
  }

  private validateFile(file: File): void {
    const rules = this.getValidationRules(file.type);

    // Check file size
    if (file.size > rules.maxSize) {
      throw new Error(
        `File too large. Maximum size: ${this.formatFileSize(rules.maxSize)}`,
      );
    }

    // Check file type
    if (!rules.allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.type}. Allowed types: ${rules.allowedTypes.join(", ")}`,
      );
    }

    // Check file extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !rules.allowedExtensions.includes(extension)) {
      throw new Error(
        `Invalid file extension: ${extension}. Allowed extensions: ${rules.allowedExtensions.join(", ")}`,
      );
    }

    logger.info("File validation passed", {
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  }

  private getValidationRules(contentType: string): FileValidationRules {
    // Document files (resumes, cover letters, etc.)
    if (
      contentType.includes("pdf") ||
      contentType.includes("document") ||
      contentType.includes("text")
    ) {
      return {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "text/rtf",
        ],
        allowedExtensions: ["pdf", "doc", "docx", "txt", "rtf"],
        virusScanRequired: true,
      };
    }

    // Image files (avatars, logos, etc.)
    if (contentType.includes("image")) {
      return {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",
        ],
        allowedExtensions: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
      };
    }

    // Video files (introduction videos, etc.)
    if (contentType.includes("video")) {
      return {
        maxSize: 100 * 1024 * 1024, // 100MB
        allowedTypes: [
          "video/mp4",
          "video/webm",
          "video/ogg",
          "video/quicktime",
        ],
        allowedExtensions: ["mp4", "webm", "ogg", "mov"],
      };
    }

    // Default rules for other files
    return {
      maxSize: 1 * 1024 * 1024, // 1MB
      allowedTypes: ["application/octet-stream"],
      allowedExtensions: [],
    };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

// File Upload Hook for React Components
export class FileUploadManager {
  private storageService: StorageService;
  private uploadQueue: Map<string, UploadTask> = new Map();

  constructor(storageService: StorageService) {
    assertExists(storageService, "Storage service");
    this.storageService = storageService;
  }

  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: number) => void,
    metadata?: FileMetadata,
  ): Promise<UploadResult> {
    assert(file.size > 0, "File must not be empty");
    assert(path.length > 0, "Upload path must be provided");

    const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: UploadTask = {
      id: taskId,
      file,
      path,
      progress: 0,
      status: "pending",
      startedAt: new Date(),
    };

    this.uploadQueue.set(taskId, task);

    try {
      task.status = "uploading";

      // Simulate progress updates
      if (onProgress) {
        const progressInterval = setInterval(() => {
          task.progress = Math.min(task.progress + 10, 90);
          onProgress(task.progress);

          if (task.progress >= 90) {
            clearInterval(progressInterval);
          }
        }, 200);
      }

      const result = await this.storageService.uploadFile(file, path, metadata);

      task.status = "completed";
      task.progress = 100;
      task.result = result;
      task.completedAt = new Date();

      if (onProgress) {
        onProgress(100);
      }

      logger.info("File upload completed", { taskId, url: result.url });
      return result;
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : "Upload failed";

      logger.error("File upload failed", { taskId, error });
      throw error;
    } finally {
      // Clean up completed/failed tasks after 5 minutes
      setTimeout(
        () => {
          this.uploadQueue.delete(taskId);
        },
        5 * 60 * 1000,
      );
    }
  }

  getUploadProgress(taskId: string): UploadTask | undefined {
    return this.uploadQueue.get(taskId);
  }

  cancelUpload(taskId: string): void {
    const task = this.uploadQueue.get(taskId);
    if (task && task.status === "uploading") {
      task.status = "cancelled";
      this.uploadQueue.delete(taskId);
      logger.info("Upload cancelled", { taskId });
    }
  }

  getActiveUploads(): UploadTask[] {
    return Array.from(this.uploadQueue.values()).filter(
      (task) => task.status === "uploading" || task.status === "pending",
    );
  }
}

export interface UploadTask {
  id: string;
  file: File;
  path: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "failed" | "cancelled";
  startedAt: Date;
  completedAt?: Date;
  result?: UploadResult;
  error?: string;
}

// File type helpers
export const FileTypes = {
  RESUME: "resume",
  COVER_LETTER: "cover-letter",
  AVATAR: "avatar",
  COMPANY_LOGO: "company-logo",
  PORTFOLIO: "portfolio",
  CERTIFICATE: "certificate",
  DOCUMENT: "document",
} as const;

export const getUploadPath = (
  userId: string,
  fileType: string,
  fileName: string,
): string => {
  assert(userId.length > 0, "User ID must be provided");
  assert(fileType.length > 0, "File type must be provided");
  assert(fileName.length > 0, "File name must be provided");

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();

  return `users/${userId}/${fileType}/${timestamp}-${sanitizedFileName}`;
};

// Create singleton instances
export const storageService = new MockStorageService();
export const uploadManager = new FileUploadManager(storageService);
