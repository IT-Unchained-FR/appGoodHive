import { getGeminiModel } from "@/lib/gemini";

export interface MatchScoreResult {
  score: number | null;
  reasons: string[];
  gaps: string[];
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

  try {
    const model = getGeminiModel(
      process.env.GEMINI_FAST_MODEL ?? "models/gemini-2.0-flash",
    );
    const result = await model.generateContent(prompt);
    const text = getGeminiText(result.response);
    const parsed = tryParseModelJson(text);

    if (!parsed) {
      return { score: null, reasons: [], gaps: [] };
    }

    return {
      score: clampScore(parsed.score),
      reasons: sanitizeList(parsed.reasons),
      gaps: sanitizeList(parsed.gaps),
    };
  } catch (error) {
    console.error("Failed to compute match score:", error);
    return { score: null, reasons: [], gaps: [] };
  }
}
