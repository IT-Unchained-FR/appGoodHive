import sql from "@/lib/db";
import { generateWithFallback } from "@/lib/ai/groq";
import { extractJsonObject } from "@/app/api/pdf-to-profile/pdf-import-utils";
import { extractCvTextFromUrl } from "@/app/lib/pdf/extract-pdf-text";
import { safeBase64Decode } from "@/lib/talents";
import {
  parseStoredResumeArray,
  type ResumeCertification,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeProject,
} from "@/lib/talent-profile/resume-data";

/**
 * Bump whenever the output shape below changes, so stale rows written under an
 * older prompt/schema are treated as missing rather than mis-parsed.
 */
export const AI_PROFILE_SUMMARY_VERSION = 1;

export type TalentSeniority = "junior" | "mid" | "senior" | "lead" | "unknown";
export type CvCoverage = "full" | "none";

export interface TalentProfileSummary {
  seniority: TalentSeniority;
  yearsExperience: number | null;
  topSkills: string[];
  strengths: string[];
  domains: string[];
  notableProjects: string[];
  summary: string;
  cvCoverage: CvCoverage;
}

interface TalentEvaluationRow {
  user_id: string;
  description: string | null;
  about_work: string | null;
  skills: string | null;
  resume_experience: string | null;
  resume_education: string | null;
  resume_certifications: string | null;
  resume_projects: string | null;
  cv_url: string | null;
}

const MAX_CV_CHARS = 6000;
const MAX_BIO_CHARS = 3000;
const SENIORITY_VALUES: readonly TalentSeniority[] = ["junior", "mid", "senior", "lead", "unknown"];

/**
 * Postgres text/JSONB columns reject embedded NUL bytes outright (invalid byte sequence,
 * code 22021) — some PDFs, via pdf-parse, extract them. Strip NUL and other non-printable C0
 * control characters (keeping newline, carriage return, tab) before this text is stored or sent
 * anywhere. Built without a regex literal to avoid any ambiguity around embedding raw control
 * bytes in source.
 */
function sanitizeForStorage(text: string): string {
  const KEEP_CODES = new Set([9, 10, 13]); // tab, \n, \r
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 32 || KEEP_CODES.has(code)) {
      result += text[i];
    }
  }
  return result;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatExperience(items: ResumeExperience[]): string {
  if (!items.length) return "None on file";
  return items
    .map((item) => {
      const range = [item.startDate, item.endDate].filter(Boolean).join(" – ");
      return `- ${item.title || "Role"} at ${item.company || "Unknown company"}${range ? ` (${range})` : ""}${item.description ? `: ${item.description}` : ""}`;
    })
    .join("\n");
}

function formatEducation(items: ResumeEducation[]): string {
  if (!items.length) return "None on file";
  return items
    .map((item) => `- ${item.degree || "Degree"}, ${item.institution || "Unknown institution"}`)
    .join("\n");
}

function formatCertifications(items: ResumeCertification[]): string {
  if (!items.length) return "None on file";
  return items.map((item) => `- ${item.name || "Certification"}${item.issuer ? ` (${item.issuer})` : ""}`).join("\n");
}

function formatProjects(items: ResumeProject[]): string {
  if (!items.length) return "None on file";
  return items
    .map((item) => `- ${item.name || "Project"}${item.technologies ? ` — ${item.technologies}` : ""}${item.description ? `: ${item.description}` : ""}`)
    .join("\n");
}

interface EvaluationInput {
  skills: string[];
  bio: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  projects: ResumeProject[];
  cvText: string | null;
}

function buildEvaluationPrompt(input: EvaluationInput): string {
  return `You are a technical recruiter AI. Read this talent's full profile once and produce a
compact, objective, reusable understanding of who they are professionally. This analysis will be
cached and reused across many future, unrelated job searches — do not reference any specific job
or requirement, just describe the talent as they are.

Respond with ONLY the JSON object at the end of this prompt. Do not think out loud, do not include
a <think> block, do not add markdown formatting or commentary before or after it — the entire
response must be that one JSON object and nothing else. /no_think

SKILLS: ${input.skills.join(", ") || "None listed"}

BIO:
${input.bio || "None provided"}

WORK EXPERIENCE:
${formatExperience(input.experience)}

EDUCATION:
${formatEducation(input.education)}

CERTIFICATIONS:
${formatCertifications(input.certifications)}

PROJECTS:
${formatProjects(input.projects)}

${input.cvText ? `CV TEXT (extracted from uploaded PDF):\n${truncate(input.cvText, MAX_CV_CHARS)}` : "CV: not available or unreadable — base the analysis on the fields above only."}

Return ONLY valid JSON (no markdown, no explanation):
{
  "seniority": "junior" | "mid" | "senior" | "lead" | "unknown",
  "yearsExperience": <integer, best estimate, or null if truly unknown>,
  "topSkills": [<up to 10 strings, ranked by how strongly the text evidences them>],
  "strengths": [<up to 5 short strings — genuine standout strengths, not generic praise>],
  "domains": [<up to 5 short strings, e.g. "fintech", "e-commerce", "healthcare">],
  "notableProjects": [<up to 5 short strings>],
  "summary": "<2-3 sentence objective professional summary>"
}`;
}

function normalizeSummary(parsed: Record<string, unknown>, cvCoverage: CvCoverage): TalentProfileSummary {
  const seniority = SENIORITY_VALUES.includes(parsed.seniority as TalentSeniority)
    ? (parsed.seniority as TalentSeniority)
    : "unknown";

  const yearsExperience =
    typeof parsed.yearsExperience === "number" && Number.isFinite(parsed.yearsExperience)
      ? Math.max(0, Math.round(parsed.yearsExperience))
      : null;

  const toList = (value: unknown, max: number): string[] =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, max)
      : [];

  return {
    seniority,
    yearsExperience,
    topSkills: toList(parsed.topSkills, 10),
    strengths: toList(parsed.strengths, 5),
    domains: toList(parsed.domains, 5),
    notableProjects: toList(parsed.notableProjects, 5),
    summary: typeof parsed.summary === "string" ? parsed.summary.trim().slice(0, 800) : "",
    cvCoverage,
  };
}

/** Renders a cached summary as the compact "TALENT" block for the per-search match-score prompt. */
export function formatTalentProfileSummaryForPrompt(summary: TalentProfileSummary): string {
  const lines = [
    `Seniority: ${summary.seniority}`,
    summary.yearsExperience !== null ? `Years of experience: ${summary.yearsExperience}` : null,
    summary.topSkills.length ? `Top skills: ${summary.topSkills.join(", ")}` : null,
    summary.strengths.length ? `Strengths: ${summary.strengths.join(", ")}` : null,
    summary.domains.length ? `Domains: ${summary.domains.join(", ")}` : null,
    summary.notableProjects.length ? `Notable projects: ${summary.notableProjects.join(", ")}` : null,
    `Summary: ${summary.summary || "Not available"}`,
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

/**
 * Evaluates one talent's full profile (skills, bio, structured resume fields, and — new — the
 * text of their uploaded CV) with a single LLM call, and persists the structured result on
 * `goodhive.talents`. Intended to run once per talent, at approval time, and again only when the
 * profile changes materially afterward (see `ai_profile_stale`).
 *
 * Never throws: a failure is logged and `null` is returned so callers (admin approval, search
 * fallback) can proceed without the evaluation blocking anything they're doing.
 */
export async function evaluateAndStoreTalentProfile(userId: string): Promise<TalentProfileSummary | null> {
  const rows = await sql<TalentEvaluationRow[]>`
    SELECT
      user_id,
      description,
      about_work,
      skills,
      resume_experience,
      resume_education,
      resume_certifications,
      resume_projects,
      cv_url
    FROM goodhive.talents
    WHERE user_id = ${userId}::uuid
    LIMIT 1
  `;
  const talent = rows[0];
  if (!talent) return null;

  const skills = (talent.skills ?? "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  const bio = sanitizeForStorage(
    truncate(safeBase64Decode(talent.description || talent.about_work || ""), MAX_BIO_CHARS),
  );
  const experience = parseStoredResumeArray<ResumeExperience>(talent.resume_experience);
  const education = parseStoredResumeArray<ResumeEducation>(talent.resume_education);
  const certifications = parseStoredResumeArray<ResumeCertification>(talent.resume_certifications);
  const projects = parseStoredResumeArray<ResumeProject>(talent.resume_projects);

  let cvText: string | null = null;
  if (talent.cv_url) {
    const extracted = await extractCvTextFromUrl(talent.cv_url);
    cvText = extracted ? sanitizeForStorage(extracted) : null;
  }
  const cvCoverage: CvCoverage = cvText ? "full" : "none";

  let summary: TalentProfileSummary | null = null;
  try {
    const prompt = buildEvaluationPrompt({ skills, bio, experience, education, certifications, projects, cvText });
    const text = await generateWithFallback(prompt, {
      feature: "evaluate-talent-profile",
      temperature: 0.2,
      // Generous headroom: some pool models (qwen3) emit a hidden <think> block that counts
      // against this budget before ever writing the actual JSON answer.
      maxTokens: 2500,
    });
    const parsed = extractJsonObject<Record<string, unknown>>(text);
    summary = normalizeSummary(parsed, cvCoverage);
  } catch (error) {
    console.error(`evaluateAndStoreTalentProfile: LLM evaluation failed for ${userId}:`, error);
  }

  try {
    if (summary) {
      await sql`
        UPDATE goodhive.talents
        SET
          cv_text = COALESCE(${cvText}, cv_text),
          ai_profile_summary = ${sql.json({ ...summary })},
          ai_profile_summary_version = ${AI_PROFILE_SUMMARY_VERSION},
          ai_profile_evaluated_at = NOW(),
          ai_profile_stale = false
        WHERE user_id = ${userId}::uuid
      `;
    } else if (cvText) {
      // The LLM call failed, but CV extraction succeeded — persist that so a retry doesn't
      // need to re-fetch and re-parse the PDF.
      await sql`
        UPDATE goodhive.talents
        SET cv_text = COALESCE(cv_text, ${cvText})
        WHERE user_id = ${userId}::uuid
      `;
    }
  } catch (error) {
    console.error(`evaluateAndStoreTalentProfile: failed to persist result for ${userId}:`, error);
  }

  return summary;
}
