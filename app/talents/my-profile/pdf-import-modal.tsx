"use client";

import { FileText, Loader2, Upload, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { toast } from "react-hot-toast";

interface PDFImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (profileData: any) => void;
  isLoading: boolean;
}

export const PDFImportModal: React.FC<PDFImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  isLoading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 10; // 10MB limit
  const validTypes = ["application/pdf"];

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) return;

      // Validate file type
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF file only.");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      setSelectedFile(file);
    },
    [validTypes],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileChange(files[0]);
      }
    },
    [handleFileChange],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFileChange(file);
    },
    [handleFileChange],
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file first.");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("pdf", selectedFile);

      const response = await fetch("/api/pdf-to-profile", {
        method: "POST",
        body: formData,
      });
      console.log("Response...:", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            errorData.details ||
            "Failed to generate profile data",
        );
      }

      const data = await response.json();
      console.log("Data...:", data);

      if (data.status === "completed" && data.data) {
        // Log the generated data for debugging
        console.log("Generated profile data:", data.data);
        onImportSuccess(data.data);
        toast.success("Profile data generated successfully!");
        onClose();
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating profile data:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate profile data",
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, onImportSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      setSelectedFile(null);
      setIsDragOver(false);
      onClose();
    }
  }, [isProcessing, onClose]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Generate Profile from Sample Resume
          </h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Upload any PDF file to generate profile data using AI from a sample
            resume
          </p>

          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragOver
                ? "border-[#FFC905] bg-yellow-50"
                : selectedFile
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-[#FFC905] hover:bg-gray-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <FileText className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  disabled={isProcessing}
                  className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Drop any PDF here, or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#FFC905] hover:text-[#FF8C05] font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum file size: {MAX_FILE_SIZE_MB}MB
                  </p>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || isProcessing || isLoading}
              className="w-full bg-[#FFC905] hover:bg-[#FF8C05] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isProcessing || isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Profile Data...
                </>
              ) : (
                "Generate Profile Data"
              )}
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              We'll use AI to generate professional profile data from a sample
              resume
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
