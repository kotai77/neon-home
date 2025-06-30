import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Image, File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileUpload?: (url: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "dropzone" | "avatar";
  showPreview?: boolean;
  currentImage?: string;
}

export function FileUpload({
  onFileSelect,
  onFileUpload,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  children,
  className,
  variant = "default",
  showPreview = false,
  currentImage,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      });
      return;
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace("*", ".*"))) {
      toast.error("Invalid file type", {
        description: `Please select a file of type: ${accept}`,
      });
      return;
    }

    onFileSelect(file);

    // Show preview for images
    if (showPreview && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Auto-upload if handler provided
    if (onFileUpload) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    if (!onFileUpload) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      if (data.success) {
        onFileUpload(data.data.url);
        toast.success("Upload successful", {
          description: "Your file has been uploaded successfully.",
        });
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      toast.error("Upload failed", {
        description:
          error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removePreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (variant === "avatar") {
    return (
      <div className={cn("relative group", className)}>
        <div
          className={cn(
            "w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-muted/50",
            dragActive && "border-primary bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative w-full h-full">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-full"
              />
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePreview();
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
              ) : (
                <Image className="w-8 h-8 text-muted-foreground mx-auto" />
              )}
              <p className="text-xs text-muted-foreground mt-2">Upload Photo</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  if (variant === "dropzone") {
    return (
      <div
        className={cn(
          "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer transition-colors",
          "hover:border-primary hover:bg-muted/50",
          dragActive && "border-primary bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-40 rounded-lg"
              />
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePreview();
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            {uploading && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Uploading...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {uploading ? (
              <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mx-auto" />
            ) : (
              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            )}
            <div>
              <p className="text-lg font-medium">
                {children || "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-muted-foreground">
                {accept} up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={disabled || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {children || "Upload File"}
          </>
        )}
      </Button>

      {showPreview && preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-32 rounded border"
          />
          {!disabled && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={removePreview}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
