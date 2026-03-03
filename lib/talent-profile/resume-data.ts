export type ResumeExperience = {
  title?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

export type ResumeEducation = {
  degree?: string;
  institution?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  description?: string;
};

export type ResumeCertification = {
  name?: string;
  issuer?: string;
  date?: string;
  description?: string;
};

export type ResumeProject = {
  name?: string;
  description?: string;
  technologies?: string;
  url?: string;
};

export type ResumeLanguage = {
  language?: string;
  proficiency?: string;
};

export type ResumeImportPayload = {
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  certifications?: ResumeCertification[];
  projects?: ResumeProject[];
  languages?: ResumeLanguage[];
};

export const parseStoredResumeArray = <T>(value: unknown): T[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? (parsedValue as T[]) : [];
  } catch (error) {
    console.error("Failed to parse stored resume data:", error);
    return [];
  }
};

export const serializeResumeArray = <T>(value: T[] | undefined) => {
  if (!value) return undefined;
  return JSON.stringify(value);
};

const parseResumeDate = (value?: string) => {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized) return null;

  if (/present|current|now/i.test(normalized)) {
    return new Date();
  }

  const match = normalized.match(/^(\d{4})(?:-(\d{2}))?$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2] || "1");

  if (!year || Number.isNaN(month)) {
    return null;
  }

  return new Date(year, Math.max(month - 1, 0), 1);
};

export const calculateYearsExperience = (
  experience: ResumeExperience[] | undefined,
) => {
  if (!experience?.length) return undefined;

  const parsedRanges = experience
    .map((item) => ({
      start: parseResumeDate(item.startDate),
      end: parseResumeDate(item.endDate) || new Date(),
    }))
    .filter(
      (item): item is { start: Date; end: Date } =>
        item.start instanceof Date && item.end instanceof Date,
    );

  if (!parsedRanges.length) {
    return undefined;
  }

  const earliestStart = parsedRanges.reduce(
    (earliest, current) => (current.start < earliest ? current.start : earliest),
    parsedRanges[0].start,
  );

  const latestEnd = parsedRanges.reduce(
    (latest, current) => (current.end > latest ? current.end : latest),
    parsedRanges[0].end,
  );

  const yearDiff = latestEnd.getFullYear() - earliestStart.getFullYear();
  const monthDiff = latestEnd.getMonth() - earliestStart.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;

  return totalMonths >= 0 ? Math.max(1, Math.floor(totalMonths / 12)) : undefined;
};
