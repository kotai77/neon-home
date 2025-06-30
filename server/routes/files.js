import express from "express";
import multer from "multer";

// Tiger-style assertion utility
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1, // Only allow 1 file at a time
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  },
});

// Mock file storage
const mockFiles = new Map();

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: "File too large",
        message: "File size exceeds 50MB limit. Please choose a smaller file.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        error: "Invalid file upload",
        message: "Only one file is allowed at a time.",
      });
    }
  }

  if (error.message === "File type not allowed") {
    return res.status(400).json({
      success: false,
      error: "File type not allowed",
      message:
        "Please upload only images (JPG, PNG, GIF, WebP) or documents (PDF, DOC, DOCX).",
    });
  }

  return res.status(500).json({
    success: false,
    error: "Upload failed",
    message: error.message || "An error occurred while uploading the file.",
  });
};

// POST /api/files/upload - Upload file
router.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        return handleMulterError(error, req, res, next);
      }
      next();
    });
  },
  async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
          message: "Please select a file to upload",
        });
      }

      // Simulate file processing delay
      await new Promise((resolve) =>
        setTimeout(resolve, 800 + Math.random() * 1200),
      );

      // Mock file upload with the actual file data
      const mockFileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileType = req.file.mimetype;

      let extension = ".jpg";
      let mockFileName = "avatar";

      if (fileType.includes("image/")) {
        if (fileType.includes("png")) extension = ".png";
        else if (fileType.includes("gif")) extension = ".gif";
        else if (fileType.includes("webp")) extension = ".webp";
        mockFileName = "profile-photo";
      } else if (fileType.includes("pdf")) {
        extension = ".pdf";
        mockFileName = "document";
      }

      // Generate a demo URL (in production, this would be a real storage URL)
      const mockUrl = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 900 + 1500000000000)}-${Math.random().toString(36).substr(2, 9)}?w=400&h=400&fit=crop&crop=face`;

      const fileData = {
        id: mockFileId,
        url: mockUrl,
        originalName: req.file.originalname,
        mimeType: fileType,
        size: req.file.size,
        uploadedAt: new Date().toISOString(),
        isDemo: true,
      };

      mockFiles.set(mockFileId, fileData);

      res.json({
        success: true,
        data: {
          url: mockUrl,
          fileId: mockFileId,
          originalName: fileData.originalName,
          size: fileData.size,
          mimeType: fileData.mimeType,
        },
        message: "File uploaded successfully (demo mode)",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to upload file",
        message: error.message,
      });
    }
  },
);

// GET /api/files/:fileId - Get file info
router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    assert(fileId, "File ID is required");

    const file = mockFiles.get(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
        message: "The requested file does not exist",
      });
    }

    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve file",
      message: error.message,
    });
  }
});

// DELETE /api/files/:fileId - Delete file
router.delete("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    assert(fileId, "File ID is required");

    const file = mockFiles.get(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
        message: "The requested file does not exist",
      });
    }

    mockFiles.delete(fileId);

    res.json({
      success: true,
      message: "File deleted successfully (demo mode)",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete file",
      message: error.message,
    });
  }
});

export default router;
