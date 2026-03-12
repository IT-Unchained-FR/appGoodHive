export const COMPANY_LOCKED_FIELDS_AFTER_SUBMIT = [
  "budget",
  "currency",
  "escrow_amount",
  "payment_token_address",
  "blockchain_job_id",
  "block_id",
] as const;

export const COMPANY_ALWAYS_LOCKED_JOB_FIELDS = [
  ...COMPANY_LOCKED_FIELDS_AFTER_SUBMIT,
  "published",
  "review_status",
  "admin_feedback",
  "reviewed_at",
  "reviewed_by",
] as const;

export type JobReviewStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "active"
  | "closed";

export function resolveJobReviewStatus(
  value: unknown,
  published?: boolean | null,
): JobReviewStatus {
  if (typeof value === "string" && value.length > 0) {
    return value as JobReviewStatus;
  }

  return published ? "approved" : "draft";
}
