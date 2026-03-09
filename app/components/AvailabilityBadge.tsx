import clsx from "clsx";

import {
  type AvailabilityStatus,
  getAvailabilityLabel,
  normalizeAvailabilityStatus,
} from "@/app/constants/availability";

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  immediately: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  weeks_2: "bg-amber-50 text-amber-700 ring-amber-200",
  weeks_4: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  months_3: "bg-orange-50 text-orange-700 ring-orange-200",
  not_looking: "bg-slate-100 text-slate-700 ring-slate-200",
};

const STATUS_DOT_STYLES: Record<AvailabilityStatus, string> = {
  immediately: "bg-emerald-500",
  weeks_2: "bg-amber-500",
  weeks_4: "bg-yellow-500",
  months_3: "bg-orange-500",
  not_looking: "bg-slate-500",
};

interface AvailabilityBadgeProps {
  status?: string | null;
  legacyAvailability?: boolean | string | null;
  className?: string;
}

export function AvailabilityBadge({
  status,
  legacyAvailability,
  className,
}: AvailabilityBadgeProps) {
  const normalizedStatus = normalizeAvailabilityStatus(status, legacyAvailability);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
        STATUS_STYLES[normalizedStatus],
        className,
      )}
    >
      <span className={clsx("h-2 w-2 rounded-full", STATUS_DOT_STYLES[normalizedStatus])} />
      {getAvailabilityLabel(normalizedStatus)}
    </span>
  );
}
