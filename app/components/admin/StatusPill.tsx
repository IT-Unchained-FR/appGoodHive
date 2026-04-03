"use client";

const badgeClasses: Record<string, string> = {
  approved: "bg-green-50 text-green-700",
  active: "bg-green-50 text-green-700",
  published: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-700",
  in_review: "bg-amber-50 text-amber-700",
  pending_review: "bg-amber-50 text-amber-700",
  deferred: "bg-gray-100 text-gray-600",
  rejected: "bg-red-50 text-red-700",
  unpublished: "bg-gray-100 text-gray-500",
  no_roles: "bg-gray-100 text-gray-600",
  no_profile: "bg-gray-100 text-gray-600",
  failed: "bg-red-50 text-red-700",
  confirmed: "bg-green-50 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  closed: "bg-gray-100 text-gray-600",
};

function normalizeStatus(status: string) {
  return status.toLowerCase().trim().replace(/\s+/g, "_");
}

interface StatusPillProps {
  status: string;
  label?: string;
  className?: string;
  title?: string;
}

export function StatusPill({
  status,
  label,
  className = "",
  title,
}: StatusPillProps) {
  const normalized = normalizeStatus(status);
  const displayLabel = label ?? normalized.replace(/_/g, " ");

  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClasses[normalized] ?? "bg-gray-100 text-gray-600"} ${className}`.trim()}
    >
      {displayLabel}
    </span>
  );
}
