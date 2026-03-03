import type {
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeProject,
} from "@/lib/talent-profile/resume-data";

export type ExtractedResumeFacts = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  phone_country_code?: string;
  country?: string;
  city?: string;
  title?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  skills?: string[];
  min_rate?: number;
  max_rate?: number;
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  certifications?: ResumeCertification[];
  projects?: ResumeProject[];
  languages?: ResumeLanguage[];
};

const normalizeWhitespace = (value?: string) =>
  value?.replace(/\s+/g, " ").trim() || "";

const normalizeObjectValues = <T extends Record<string, unknown>>(value: T) => {
  return Object.entries(value).reduce((accumulator, [key, itemValue]) => {
    if (typeof itemValue === "string") {
      const normalizedValue = normalizeWhitespace(itemValue);
      if (normalizedValue) {
        accumulator[key] = normalizedValue;
      }
      return accumulator;
    }

    if (itemValue !== undefined && itemValue !== null) {
      accumulator[key] = itemValue;
    }

    return accumulator;
  }, {} as Record<string, unknown>) as T;
};

const isNonEmptyObject = (value: Record<string, unknown>) =>
  Object.values(value).some((item) =>
    typeof item === "string" ? Boolean(item.trim()) : item !== undefined && item !== null,
  );

const dedupeByKey = <T extends Record<string, unknown>>(
  values: T[] | undefined,
  getKey: (value: T) => string,
) => {
  if (!values?.length) return [];

  const seenValues = new Map<string, T>();

  values.forEach((value) => {
    const normalizedValue = normalizeObjectValues(value);
    if (!isNonEmptyObject(normalizedValue)) {
      return;
    }

    const key = getKey(normalizedValue).toLowerCase();
    const existingValue = seenValues.get(key);

    if (!existingValue) {
      seenValues.set(key, normalizedValue);
      return;
    }

    const existingScore = JSON.stringify(existingValue).length;
    const nextScore = JSON.stringify(normalizedValue).length;

    if (nextScore > existingScore) {
      seenValues.set(key, normalizedValue);
    }
  });

  return Array.from(seenValues.values());
};

const pickBestString = (values: Array<string | undefined>) => {
  const normalizedValues = values
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean);

  if (!normalizedValues.length) {
    return undefined;
  }

  const counts = new Map<string, { count: number; sample: string }>();

  normalizedValues.forEach((value) => {
    const key = value.toLowerCase();
    const currentValue = counts.get(key);

    if (!currentValue) {
      counts.set(key, { count: 1, sample: value });
      return;
    }

    currentValue.count += 1;
    if (value.length > currentValue.sample.length) {
      currentValue.sample = value;
    }
  });

  return Array.from(counts.values()).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return right.sample.length - left.sample.length;
  })[0]?.sample;
};

export const chunkTextForAI = (
  text: string,
  maxChunkLength = 12000,
  overlapLength = 800,
) => {
  const normalizedText = text.replace(/\r\n/g, "\n").trim();
  if (!normalizedText) return [];

  const paragraphs = normalizedText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = "";

  paragraphs.forEach((paragraph) => {
    const nextChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;

    if (nextChunk.length <= maxChunkLength) {
      currentChunk = nextChunk;
      return;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    if (paragraph.length <= maxChunkLength) {
      currentChunk = paragraph;
      return;
    }

    let startIndex = 0;
    while (startIndex < paragraph.length) {
      const slice = paragraph.slice(startIndex, startIndex + maxChunkLength);
      chunks.push(slice);
      startIndex += maxChunkLength - overlapLength;
    }

    currentChunk = "";
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

export const extractJsonObject = <T>(content: string): T => {
  const trimmedContent = content.trim();
  const withoutFence = trimmedContent
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
  const firstBraceIndex = withoutFence.indexOf("{");
  const lastBraceIndex = withoutFence.lastIndexOf("}");

  const jsonPayload =
    firstBraceIndex >= 0 && lastBraceIndex >= firstBraceIndex
      ? withoutFence.slice(firstBraceIndex, lastBraceIndex + 1)
      : withoutFence;

  return JSON.parse(jsonPayload) as T;
};

const mergeSkills = (values: Array<string[] | undefined>) => {
  const uniqueSkills = new Map<string, string>();

  values
    .flatMap((value) => value || [])
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean)
    .forEach((skill) => {
      const key = skill.toLowerCase();
      if (!uniqueSkills.has(key)) {
        uniqueSkills.set(key, skill);
      }
    });

  return Array.from(uniqueSkills.values());
};

const normalizeRate = (value: number | string | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numericValue = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  return undefined;
};

export const mergeExtractedResumeFacts = (
  chunks: ExtractedResumeFacts[],
): ExtractedResumeFacts => {
  const experience = dedupeByKey(
    chunks.flatMap((chunk) => chunk.experience || []),
    (item) =>
      [
        item.title,
        item.company,
        item.location,
        item.startDate,
        item.endDate,
      ]
        .filter(Boolean)
        .join("|"),
  );

  const education = dedupeByKey(
    chunks.flatMap((chunk) => chunk.education || []),
    (item) =>
      [item.degree, item.institution, item.location, item.startDate, item.endDate]
        .filter(Boolean)
        .join("|"),
  );

  const certifications = dedupeByKey(
    chunks.flatMap((chunk) => chunk.certifications || []),
    (item) => [item.name, item.issuer, item.date].filter(Boolean).join("|"),
  );

  const projects = dedupeByKey(
    chunks.flatMap((chunk) => chunk.projects || []),
    (item) => [item.name, item.url, item.technologies].filter(Boolean).join("|"),
  );

  const languages = dedupeByKey(
    chunks.flatMap((chunk) => chunk.languages || []),
    (item) => [item.language, item.proficiency].filter(Boolean).join("|"),
  );

  const minRates = chunks
    .map((chunk) => normalizeRate(chunk.min_rate))
    .filter((value): value is number => value !== undefined);
  const maxRates = chunks
    .map((chunk) => normalizeRate(chunk.max_rate))
    .filter((value): value is number => value !== undefined);

  return {
    first_name: pickBestString(chunks.map((chunk) => chunk.first_name)),
    last_name: pickBestString(chunks.map((chunk) => chunk.last_name)),
    email: pickBestString(chunks.map((chunk) => chunk.email)),
    phone_number: pickBestString(chunks.map((chunk) => chunk.phone_number)),
    phone_country_code: pickBestString(
      chunks.map((chunk) => chunk.phone_country_code),
    ),
    country: pickBestString(chunks.map((chunk) => chunk.country)),
    city: pickBestString(chunks.map((chunk) => chunk.city)),
    title: pickBestString(chunks.map((chunk) => chunk.title)),
    linkedin: pickBestString(chunks.map((chunk) => chunk.linkedin)),
    github: pickBestString(chunks.map((chunk) => chunk.github)),
    portfolio: pickBestString(chunks.map((chunk) => chunk.portfolio)),
    skills: mergeSkills(chunks.map((chunk) => chunk.skills)),
    min_rate: minRates.length ? Math.min(...minRates) : undefined,
    max_rate: maxRates.length ? Math.max(...maxRates) : undefined,
    experience,
    education,
    certifications,
    projects,
    languages,
  };
};

const toStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? normalizeWhitespace(item) : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => normalizeWhitespace(item))
      .filter(Boolean);
  }

  return [];
};

const toObjectArray = <T extends Record<string, unknown>>(value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is T => typeof item === "object" && item !== null,
    );
  }

  if (typeof value === "object" && value !== null) {
    return [value as T];
  }

  return [];
};

export const normalizeExtractedResumeFacts = (
  value: Record<string, unknown>,
): ExtractedResumeFacts => ({
  first_name:
    typeof value.first_name === "string" ? normalizeWhitespace(value.first_name) : "",
  last_name:
    typeof value.last_name === "string" ? normalizeWhitespace(value.last_name) : "",
  email: typeof value.email === "string" ? normalizeWhitespace(value.email) : "",
  phone_number:
    typeof value.phone_number === "string"
      ? normalizeWhitespace(value.phone_number)
      : "",
  phone_country_code:
    typeof value.phone_country_code === "string"
      ? normalizeWhitespace(value.phone_country_code)
      : "",
  country: typeof value.country === "string" ? normalizeWhitespace(value.country) : "",
  city: typeof value.city === "string" ? normalizeWhitespace(value.city) : "",
  title: typeof value.title === "string" ? normalizeWhitespace(value.title) : "",
  linkedin:
    typeof value.linkedin === "string" ? normalizeWhitespace(value.linkedin) : "",
  github: typeof value.github === "string" ? normalizeWhitespace(value.github) : "",
  portfolio:
    typeof value.portfolio === "string" ? normalizeWhitespace(value.portfolio) : "",
  skills: toStringArray(value.skills),
  min_rate: normalizeRate(value.min_rate as number | string | undefined),
  max_rate: normalizeRate(value.max_rate as number | string | undefined),
  experience: toObjectArray<ResumeExperience>(value.experience).map((item) =>
    normalizeObjectValues(item),
  ),
  education: toObjectArray<ResumeEducation>(value.education).map((item) =>
    normalizeObjectValues(item),
  ),
  certifications: toObjectArray<ResumeCertification>(value.certifications).map(
    (item) => normalizeObjectValues(item),
  ),
  projects: toObjectArray<ResumeProject>(value.projects).map((item) =>
    normalizeObjectValues(item),
  ),
  languages: toObjectArray<ResumeLanguage>(value.languages).map((item) =>
    normalizeObjectValues(item),
  ),
});
