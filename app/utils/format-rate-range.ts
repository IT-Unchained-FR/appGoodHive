type FormatRateRangeOptions = {
  minRate?: number | null;
  maxRate?: number | null;
  currency?: string;
  suffix?: string;
};

const normalizeRate = (value?: number | null) => {
  if (value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const formatRateRange = ({
  minRate,
  maxRate,
  currency = "",
  suffix = "",
}: FormatRateRangeOptions) => {
  const normalizedMin = normalizeRate(minRate);
  const normalizedMax = normalizeRate(maxRate);

  if (normalizedMin === undefined && normalizedMax === undefined) {
    return "";
  }

  if (normalizedMin !== undefined && normalizedMax !== undefined) {
    if (normalizedMin === normalizedMax) {
      return `${currency}${normalizedMin}${suffix}`;
    }
    return `${currency}${normalizedMin}-${normalizedMax}${suffix}`;
  }

  const single = normalizedMin ?? normalizedMax ?? "";
  return `${currency}${single}${suffix}`;
};
