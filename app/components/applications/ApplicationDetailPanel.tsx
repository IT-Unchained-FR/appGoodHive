"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  Mail,
  ExternalLink,
  Star,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Save,
  X,
} from "lucide-react";
import {
  IJobApplicationWithDetails,
  ApplicationStatus,
  APPLICATION_STATUS_CONFIG,
} from "@/interfaces/job-application";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

interface ApplicationDetailPanelProps {
  application: IJobApplicationWithDetails;
  jobId: string;
  companyUserId: string;
  onUpdate: (updatedApplication: IJobApplicationWithDetails) => void;
  onClose: () => void;
}

const ALL_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewed",
  "shortlisted",
  "interview",
  "rejected",
  "hired",
];

export function ApplicationDetailPanel({
  application,
  jobId,
  companyUserId,
  onUpdate,
  onClose,
}: ApplicationDetailPanelProps) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [internalNotes, setInternalNotes] = useState(
    application.internal_notes || ""
  );
  const [rating, setRating] = useState<number | null>(application.rating || null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleRatingChange = (newRating: number) => {
    setRating(rating === newRating ? null : newRating);
    setHasChanges(true);
  };

  const handleNotesChange = (newNotes: string) => {
    setInternalNotes(newNotes);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/applications/${jobId}/${application.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            internalNotes,
            rating,
            companyUserId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update application");
      }

      const updatedData = await response.json();
      onUpdate({
        ...application,
        status: updatedData.status,
        internal_notes: updatedData.internal_notes,
        rating: updatedData.rating,
        updated_at: updatedData.updated_at,
      });
      setHasChanges(false);
      toast.success("Application updated successfully");
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Application Details</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Applicant Info */}
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            {application.applicant_image_url ? (
              <Image
                src={application.applicant_image_url}
                alt={application.applicant_name}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-medium">
                {application.applicant_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-gray-900">
              {application.applicant_name}
            </h4>
            {application.applicant_headline && (
              <p className="text-sm text-gray-600 mb-2">
                {application.applicant_headline}
              </p>
            )}
            <div className="flex items-center gap-3">
              <a
                href={`mailto:${application.applicant_email}`}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              >
                <Mail className="w-4 h-4" />
                {application.applicant_email}
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex gap-2">
          <Link
            href={`/talents/${application.applicant_user_id}`}
            target="_blank"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <User className="w-4 h-4" />
            View Profile
          </Link>
          {application.portfolio_link && (
            <a
              href={application.portfolio_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Portfolio
            </a>
          )}
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => {
              const config = APPLICATION_STATUS_CONFIG[s];
              const isSelected = status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? `${config.bgColor} ${config.textColor} ring-2 ring-offset-1 ring-current`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    rating && star <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300 hover:text-amber-300"
                  }`}
                />
              </button>
            ))}
            {rating && (
              <button
                onClick={() => {
                  setRating(null);
                  setHasChanges(true);
                }}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Cover Letter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Cover Letter
          </label>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {application.cover_letter}
          </div>
        </div>

        {/* Internal Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Internal Notes
          </label>
          <textarea
            value={internalNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add private notes about this applicant..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        {/* Timeline Info */}
        <div className="text-xs text-gray-500 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Applied {format(new Date(application.created_at), "MMM d, yyyy")}
          </span>
          {application.updated_at !== application.created_at && (
            <span>
              Updated {format(new Date(application.updated_at), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>

      {/* Footer with Save Button */}
      {hasChanges && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium rounded-lg hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
