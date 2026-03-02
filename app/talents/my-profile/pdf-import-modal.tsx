"use client";

import { FileText, Loader2, Upload, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { toast } from "react-hot-toast";

const VALID_PDF_TYPES = ["application/pdf"];

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
  const isBusy = isProcessing || isLoading;

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) return;

      // Validate file type
      if (!VALID_PDF_TYPES.includes(file.type)) {
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
    [],
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
        className="absolute inset-0 bg-[rgba(15,23,42,0.42)] backdrop-blur-[6px]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative mx-4 max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.24)]">
        {/* Header */}
        <div className="border-b border-slate-200/80 px-7 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                AI Resume Import
              </div>
              <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.03em] text-slate-950">
                Generate Profile from Sample Resume
              </h2>
              <p className="mt-2 max-w-[420px] text-sm leading-6 text-slate-500">
                Upload a PDF and let AI create a strong first draft for your profile.
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-7 py-6">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Format
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">PDF only</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Size limit
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{MAX_FILE_SIZE_MB}MB max</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Output
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Profile draft</p>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`relative rounded-[24px] border-2 border-dashed p-8 text-center transition-all duration-200 ${
              isDragOver
                ? "border-amber-400 bg-amber-50/70"
                : selectedFile
                  ? "border-emerald-300 bg-emerald-50/70"
                  : "border-slate-300 bg-slate-50/70 hover:border-amber-300 hover:bg-amber-50/30"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                    <FileText className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Replace File
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    disabled={isBusy}
                    className="text-sm font-semibold text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                    <Upload className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <div>
                  <p className="text-[1.2rem] font-semibold text-slate-950">
                    Drop your PDF here to upload
                  </p>
                  <p className="mx-auto mt-2 max-w-[360px] text-sm leading-6 text-slate-500">
                    Drag and drop your resume, or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-semibold text-amber-600 transition hover:text-orange-500"
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
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

          <div className="mt-6">
            <p className="mb-3 text-xs leading-5 text-slate-500">
              We&apos;ll use AI to generate professional profile data from a sample resume.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isBusy}
                className="inline-flex h-12 min-w-[11rem] items-center justify-center whitespace-nowrap rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || isBusy}
                className={`inline-flex h-12 min-w-[14rem] items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold text-white transition ${
                  !selectedFile || isBusy
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] shadow-[0_14px_26px_rgba(249,115,22,0.24)] hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(249,115,22,0.28)]"
                }`}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Profile Data...
                  </>
                ) : (
                  "Generate Profile Data"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
