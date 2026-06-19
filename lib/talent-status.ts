export type ReviewStatus =
  | "approved"
  | "pending"
  | "in_review"
  | "rejected"
  | "deferred";

export const isDeferredUntilActive = (
  value?: string | Date | null,
  now = new Date(),
) => {
  if (!value) return false;
  const deferredUntil = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(deferredUntil.getTime()) && deferredUntil.getTime() > now.getTime();
};

export const deriveReviewStatus = ({
  status,
  inReview,
  approved,
  deferredUntil,
}: {
  status?: string | null;
  inReview?: boolean | null;
  approved?: boolean | null;
  deferredUntil?: string | Date | null;
}): ReviewStatus => {
  if (status === "approved" || approved) return "approved";
  if (isDeferredUntilActive(deferredUntil)) return "deferred";
  if (status === "rejected") return "rejected";
  if (status === "pending" || status === "in_review" || inReview) return "in_review";
  return "in_review";
};
