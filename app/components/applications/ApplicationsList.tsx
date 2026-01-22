"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  ExternalLink,
  Star,
  Clock,
  User,
  ChevronRight,
} from "lucide-react";
import { IJobApplicationWithDetails, ApplicationStatus } from "@/interfaces/job-application";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

interface ApplicationsListProps {
  applications: IJobApplicationWithDetails[];
  onSelectApplication: (application: IJobApplicationWithDetails) => void;
  selectedApplicationId?: number;
  isLoading?: boolean;
}

export function ApplicationsList({
  applications,
  onSelectApplication,
  selectedApplicationId,
  isLoading = false,
}: ApplicationsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No applications yet
        </h3>
        <p className="text-gray-500 text-sm">
          Applications will appear here when talents apply to this job.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {applications.map((application) => {
        const isSelected = selectedApplicationId === application.id;

        return (
          <button
            key={application.id}
            onClick={() => onSelectApplication(application)}
            className={`w-full text-left bg-white rounded-lg border p-4 transition-all hover:shadow-md ${
              isSelected
                ? "border-yellow-500 ring-2 ring-yellow-200 bg-yellow-50/30"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative w-10 h-10 flex-shrink-0">
                {application.applicant_image_url ? (
                  <Image
                    src={application.applicant_image_url}
                    alt={application.applicant_name}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-medium">
                    {application.applicant_name.charAt(0).toUpperCase()}
                  </div>
                )}
                {application.status === "new" && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {application.applicant_name}
                  </h4>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>

                {application.applicant_headline && (
                  <p className="text-sm text-gray-600 truncate mb-2">
                    {application.applicant_headline}
                  </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <ApplicationStatusBadge status={application.status} size="sm" />

                  {application.rating && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {application.rating}
                    </span>
                  )}

                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(application.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
