"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { uploadFileToBucket } from "@/app/utils/upload-file-bucket";
import { resumeUploadSizeLimit } from "@/app/talents/my-profile/constants";

interface CvAdminManagerProps {
  userId: string;
  initialCvUrl?: string | null;
}

export default function CvAdminManager({
  userId,
  initialCvUrl,
}: CvAdminManagerProps) {
  const [cvUrl, setCvUrl] = useState(initialCvUrl || "");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setCvFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF CV.");
      return;
    }

    if (file.size > 1024 * 1024 * Number(resumeUploadSizeLimit)) {
      toast.error(`File size should be under ${resumeUploadSizeLimit} MB`);
      return;
    }

    setCvFile(file);
  };

  const handleUpload = async () => {
    if (!cvFile) {
      toast.error("Select a CV file first.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrl = (await uploadFileToBucket(cvFile)) as string;

      if (!uploadedUrl) {
        throw new Error("Failed to upload CV");
      }

      const response = await fetch("/api/talents/my-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          cv_url: uploadedUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update CV");
      }

      setCvUrl(uploadedUrl);
      setCvFile(null);
      toast.success("CV updated successfully.");
    } catch (error) {
      console.error("CV update failed:", error);
      toast.error("Failed to update CV. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const actionLabel = cvUrl ? "Replace CV" : "Upload CV";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-700">CV</span>
        {cvUrl ? (
          <Link
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <FileText size={16} />
            View current CV
          </Link>
        ) : (
          <span className="text-sm text-gray-500">No CV on file</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept=".pdf"
          onChange={handleCvChange}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-900 hover:file:bg-amber-200"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload size={16} />
          {isUploading ? "Uploading..." : actionLabel}
        </button>
      </div>
    </div>
  );
}
