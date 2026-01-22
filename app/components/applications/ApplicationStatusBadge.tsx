"use client";

import { ApplicationStatus, APPLICATION_STATUS_CONFIG } from "@/interfaces/job-application";

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

export function ApplicationStatusBadge({
  status,
  size = "md",
  showDot = true,
}: ApplicationStatusBadgeProps) {
  const config = APPLICATION_STATUS_CONFIG[status];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-sm",
  };

  const dotSizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span
          className={`${dotSizeClasses[size]} rounded-full ${
            status === "new" ? "bg-blue-500" :
            status === "reviewed" ? "bg-gray-500" :
            status === "shortlisted" ? "bg-yellow-500" :
            status === "interview" ? "bg-purple-500" :
            status === "rejected" ? "bg-red-500" :
            "bg-green-500"
          }`}
        />
      )}
      {config.label}
    </span>
  );
}
