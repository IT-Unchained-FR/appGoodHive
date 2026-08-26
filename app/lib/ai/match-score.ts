import { generateWithFallback } from "@/lib/ai/groq";

export interface MatchScoreResult {
  score: number | null;
  reasons: string[];
  gaps: string[];
  unavailable: boolean;
  message?: string;
}

export type WorkMode = "onsite" | "hybrid" | "remote" | "any";

/**
 * Hard constraints (location, work mode, language) plus the talent-side facts
 * they are checked against. All optional — `computeMatchScore` is shared with
 * the company-side surfaces, which pass none of this and are unaffected.
 *
 * These are only ever *soft* signals here: they shape the score and the stated
 * gaps. Enforcement is the caller's job (SQL pre-filter + post-scoring guard),
 * because an LLM must never be the thing standing between a contractual
 * requirement and the shortlist.
 */
export interface MatchConstraints {
  workMode?: WorkMode;
  jobCountry?: string | null;
  jobCity?: string | null;
  requiredLanguages?: string[];
  talentCountry?: string | null;
  talentCity?: string | null;
  talentRemoteOnly?: boolean | null;
  talentLanguages?: string[];
}

interface ComputeMatchScoreParams extends MatchConstraints {
  jobTitle: string;
  jobDescription: string;
  jobSkills: string[];
  talentBio: string;
  talentSkills: string[];
  yearsExperience: number | null;
}

function clampScore(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function sanitizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
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

/**
 * Renders the constraint block appended to the prompt. Returns "" when the
 * caller supplied no constraints, so the company-side callers get the exact
 * prompt they got before this feature existed.
 */
function buildConstraintsBlock(params: ComputeMatchScoreParams): string {
  const workMode = params.workMode ?? "any";
  const requiredLanguages = (params.requiredLanguages ?? []).filter(Boolean);
  const jobLocation = [params.jobCity, params.jobCountry].filter(Boolean).join(", ");
  const hasLocationConstraint = workMode !== "any" && workMode !== "remote" && Boolean(jobLocation);

  if (!hasLocationConstraint && requiredLanguages.length === 0) return "";

  const talentLocation =
    [params.talentCity, params.talentCountry].filter(Boolean).join(", ") || "Unknown";
  const talentLanguages = (params.talentLanguages ?? []).filter(Boolean);

  const lines: string[] = ["", "HARD REQUIREMENTS:"];

  if (hasLocationConstraint) {
    lines.push(
      `Work mode: ${workMode} — the talent must be able to work from ${jobLocation}.`,
      `Talent location: ${talentLocation}.`,
      `Talent is remote-only: ${
        params.talentRemoteOnly === null || params.talentRemoteOnly === undefined
          ? "Unknown"
          : params.talentRemoteOnly
            ? "Yes"
            : "No"
      }.`,
    );
  }

  if (requiredLanguages.length > 0) {
    lines.push(
      `Required languages: ${requiredLanguages.join(", ")}.`,
      `Talent languages: ${talentLanguages.length > 0 ? talentLanguages.join(", ") : "Not stated on profile"}.`,
    );
  }

  lines.push(
    "",
    "RULES FOR HARD REQUIREMENTS:",
    "- A hard requirement that is clearly NOT met caps the score at 40, no matter how strong the skills are. Say which requirement failed in \"gaps\".",
    "- Distinguish \"not stated on the profile\" from \"confirmed not met\". Missing information is NOT a failure — do not cap the score for it. Note it in \"gaps\" as something to verify.",
    "- Never let strong skills compensate for a failed hard requirement.",
  );

  return lines.join("\n");
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
${buildConstraintsBlock(params)}

Return ONLY valid JSON (no markdown, no explanation):
{
  "score": <integer 0-100>,
  "reasons": [<max 3 short strings why they match>],
  "gaps": [<max 3 short strings what is missing>]
}`;

  try {
    const text = await generateWithFallback(prompt, { feature: "match-score" });
    const parsed = tryParseModelJson(text);

    if (!parsed) {
      console.error("match-score: could not parse JSON from any model");
      return {
        score: null,
        reasons: [],
        gaps: [],
        unavailable: true,
        message: "AI match analysis is temporarily unavailable. Please try again in a few minutes.",
      };
    }

    return {
      score: clampScore(parsed.score),
      reasons: sanitizeList(parsed.reasons),
      gaps: sanitizeList(parsed.gaps),
      unavailable: false,
    };
  } catch {
    return {
      score: null,
      reasons: [],
      gaps: [],
      unavailable: true,
      message: "AI match analysis is temporarily unavailable. Please try again in a few minutes.",
    };
  }
}
