import type { JobReviewStatus } from "@/lib/jobs/review";

// Badge label and colours for each job status, shared by My Jobs and the dashboard.
export const REVIEW_STATUS_META: Record<
  JobReviewStatus,
  { badgeClassName: string; label: string }
> = {
  active: {
    badgeClassName: "bg-sky-100 text-sky-700 border border-sky-200",
    label: "Active",
  },
  approved: {
    badgeClassName: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    label: "Approved",
  },
  closed: {
    badgeClassName: "bg-slate-200 text-slate-700 border border-slate-300",
    label: "Closed",
  },
  draft: {
    badgeClassName: "bg-slate-100 text-slate-700 border border-slate-200",
    label: "Draft",
  },
  pending_review: {
    badgeClassName: "bg-amber-100 text-amber-700 border border-amber-200",
    label: "Pending Review",
  },
  rejected: {
    badgeClassName: "bg-rose-100 text-rose-700 border border-rose-200",
    label: "Rejected",
  },
};
