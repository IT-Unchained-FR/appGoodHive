export const AVAILABILITY_STATUSES = [
  "immediately",
  "weeks_2",
  "weeks_4",
  "months_3",
  "not_looking",
] as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const AVAILABILITY_STATUS_OPTIONS: Array<{
  value: AvailabilityStatus;
  label: string;
  description: string;
}> = [
  {
    value: "immediately",
    label: "Available now",
    description: "Open to opportunities immediately",
  },
  {
    value: "weeks_2",
    label: "Available in 2 weeks",
    description: "Can start in about two weeks",
  },
  {
    value: "weeks_4",
    label: "Available in 1 month",
    description: "Can start in roughly one month",
  },
  {
    value: "months_3",
    label: "Available in 3 months",
    description: "Can start after current commitments",
  },
  {
    value: "not_looking",
    label: "Not available",
    description: "Not currently open to new opportunities",
  },
];

export const DEFAULT_AVAILABILITY_STATUS: AvailabilityStatus = "not_looking";

export function isAvailabilityStatus(value: unknown): value is AvailabilityStatus {
  return typeof value === "string" && AVAILABILITY_STATUSES.includes(value as AvailabilityStatus);
}

export function normalizeAvailabilityStatus(
  status: unknown,
  legacyAvailability?: unknown,
): AvailabilityStatus {
  if (isAvailabilityStatus(status)) {
    return status;
  }

  if (
    legacyAvailability === true ||
    legacyAvailability === "true" ||
    legacyAvailability === "Available"
  ) {
    return "immediately";
  }

  return DEFAULT_AVAILABILITY_STATUS;
}

export function getAvailabilityLabel(status: AvailabilityStatus): string {
  const option = AVAILABILITY_STATUS_OPTIONS.find((item) => item.value === status);
  return option?.label ?? "Not available";
}
