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

// Each model has its own independent rate limit bucket on Groq's free tier.
// Round-robin across all of them to multiply effective throughput by 4x.
const MODEL_POOL = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

let poolIndex = 0;

function getOrderedModels(): string[] {
  const start = poolIndex++ % MODEL_POOL.length;
  return [
    ...MODEL_POOL.slice(start),
    ...MODEL_POOL.slice(0, start),
  ];
}

function isRateLimitError(error: unknown) {
  const status = (error as { status?: number })?.status;
  const message = (error as { message?: string })?.message ?? "";
  return status === 429 || message.includes("429");
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

  const modelNames = getOrderedModels();

  for (const modelName of modelNames) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(prompt);
      const text = getGeminiText(result.response);
      const parsed = tryParseModelJson(text);

      if (!parsed) {
        console.error(`match-score: bad JSON from ${modelName}, trying next`);
        continue;
      }

      return {
        score: clampScore(parsed.score),
        reasons: sanitizeList(parsed.reasons),
        gaps: sanitizeList(parsed.gaps),
        unavailable: false,
      };
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn(`match-score: rate limited on ${modelName}, rotating to next model`);
      } else {
        console.error(`match-score: error on ${modelName}: ${describeModelError(error)}`);
      }
    }
  }

  return {
    score: null,
    reasons: [],
    gaps: [],
    unavailable: true,
    message: "AI match analysis is temporarily unavailable. Please try again in a few minutes.",
  };
}
