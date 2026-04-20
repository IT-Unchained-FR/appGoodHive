import { getGeminiModel } from "@/lib/gemini";

export interface MatchScoreResult {
  score: number | null;
  reasons: string[];
  gaps: string[];
  unavailable: boolean;
  message?: string;
}

interface ComputeMatchScoreParams {
  jobTitle: string;
  jobDescription: string;
  jobSkills: string[];
  talentBio: string;
  talentSkills: string[];
  yearsExperience: number | null;
}

function clampScore(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function sanitizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function tryParseModelJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function getGeminiText(response: unknown) {
  const candidate = response as { text?: (() => string) | string } | null;

  if (typeof candidate?.text === "function") {
    return candidate.text();
  }
  return typeof candidate?.text === "string" ? candidate.text : "";
}

function describeModelError(error: unknown) {
  const candidate = error as {
    message?: string;
    status?: number;
    statusText?: string;
  } | null;

  const status = typeof candidate?.status === "number" ? candidate.status : null;
  const statusText =
    typeof candidate?.statusText === "string" ? candidate.statusText : null;
  const message =
    typeof candidate?.message === "string" ? candidate.message : "Unknown model error";

  if (status && statusText) {
    return `${status} ${statusText}: ${message}`;
  }

  if (status) {
    return `${status}: ${message}`;
  }

  return message;
}

const DEFAULT_MATCH_SCORE_MODELS = [
  "models/gemini-2.5-flash",
  "models/gemini-flash-latest",
  "models/gemini-2.5-flash-lite",
  "models/gemini-pro-latest",
  "models/gemini-2.0-flash",
];

function getMatchScoreModels() {
  const configuredModel = process.env.GEMINI_FAST_MODEL?.trim();
  const configuredFallbacks =
    process.env.GEMINI_MATCH_SCORE_MODELS?.split(",")
      .map((model) => model.trim())
      .filter(Boolean) ?? [];
  const candidates = [
    configuredModel,
    ...configuredFallbacks,
    ...DEFAULT_MATCH_SCORE_MODELS,
  ];

  return candidates.filter(
    (model, index, array): model is string =>
      Boolean(model) && array.indexOf(model) === index,
  );
}

export async function computeMatchScore(
  params: ComputeMatchScoreParams,
): Promise<MatchScoreResult> {
  const prompt = `You are a technical recruiter AI. Given a job description and a talent profile, calculate how well this talent matches the job.

JOB:
Title: ${params.jobTitle}
Description: ${params.jobDescription}
Required Skills: ${params.jobSkills.join(", ")}

TALENT:
Skills: ${params.talentSkills.join(", ")}
Bio: ${params.talentBio}
Years of Experience: ${params.yearsExperience ?? "Unknown"}

Return ONLY valid JSON (no markdown, no explanation):
{
  "score": <integer 0-100>,
  "reasons": [<max 3 short strings why they match>],
  "gaps": [<max 3 short strings what is missing>]
}`;

  const modelNames = getMatchScoreModels();

  for (const modelName of modelNames) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(prompt);
      const text = getGeminiText(result.response);
      const parsed = tryParseModelJson(text);

      if (!parsed) {
        console.error(
          `Failed to parse match score response from ${modelName}; trying next fallback model.`,
        );
        continue;
      }

      return {
        score: clampScore(parsed.score),
        reasons: sanitizeList(parsed.reasons),
        gaps: sanitizeList(parsed.gaps),
        unavailable: false,
      };
    } catch (error) {
      console.error(
        `Failed to compute match score with ${modelName}; trying next fallback model. ${describeModelError(error)}`,
      );
    }
  }

  return {
    score: null,
    reasons: [],
    gaps: [],
    unavailable: true,
    message:
      "AI match analysis is temporarily unavailable. Please try again in a few minutes.",
  };
}
