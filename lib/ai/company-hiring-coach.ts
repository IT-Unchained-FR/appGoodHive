import sql from "@/lib/db";
import { safeBase64Decode } from "@/lib/talents";

export interface HiringCoachCompany {
  userId: string;
  name: string;
  headline: string;
  location: string;
  status: string | null;
  approved: boolean;
}

export interface HiringCoachJob {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: number | null;
  currency: string | null;
  jobType: string | null;
  typeEngagement: string | null;
  reviewStatus: string | null;
  published: boolean;
  applicationCount: number;
  sections: Array<{
    heading: string;
    content: string;
  }>;
}

export interface HiringCoachApplication {
  id: number;
  jobId: string;
  applicantUserId: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  portfolioLink: string | null;
  status: string;
  rating: number | null;
  applicantHeadline: string;
  applicantTitle: string;
  applicantSkills: string[];
  applicantBio: string;
}

export interface HiringCoachContext {
  company: HiringCoachCompany;
  jobs: HiringCoachJob[];
  applications: HiringCoachApplication[];
}

export interface JobPostCoachResult {
  title: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  qualityNotes: string[];
}

export interface InterviewQuestionsResult {
  technical: string[];
  behavioral: string[];
  roleFit: string[];
  evaluationCriteria: string[];
}

export interface CandidateSummaryResult {
  strengths: string[];
  gaps: string[];
  fitSummary: string;
  suggestedNextStep: string;
  interviewFocusAreas: string[];
}

interface CompanyRow {
  user_id: string;
  designation: string | null;
  headline: string | null;
  city: string | null;
  country: string | null;
  status: string | null;
  approved: boolean | null;
}

interface JobRow {
  id: string;
  title: string | null;
  description: string | null;
  skills: string | null;
  budget: number | string | null;
  currency: string | null;
  job_type: string | null;
  type_engagement: string | null;
  review_status: string | null;
  published: boolean | null;
  application_count: number | string | null;
}

interface JobSectionRow {
  job_id: string;
  heading: string | null;
  content: string | null;
  sort_order: number | null;
}

interface ApplicationRow {
  id: number;
  job_id: string;
  applicant_user_id: string;
  applicant_name: string | null;
  applicant_email: string | null;
  cover_letter: string | null;
  portfolio_link: string | null;
  status: string | null;
  rating: number | null;
  applicant_headline: string | null;
  applicant_title: string | null;
  applicant_skills: string | null;
  applicant_description: string | null;
  applicant_about_work: string | null;
}

function splitSkills(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trim()}...`;
}

function asStringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function parseHiringCoachJson<T>(
  rawText: string,
  normalize: (value: unknown) => T | null,
): T | null {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return normalize(JSON.parse(cleaned) as unknown);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;

    try {
      return normalize(JSON.parse(cleaned.slice(start, end + 1)) as unknown);
    } catch {
      return null;
    }
  }
}

export function normalizeJobPostResult(value: unknown): JobPostCoachResult | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const title = cleanText(data.title);
  const overview = cleanText(data.overview);
  if (!title || !overview) return null;

  return {
    title,
    overview,
    responsibilities: asStringArray(data.responsibilities, 7),
    requirements: asStringArray(data.requirements, 7),
    niceToHave: asStringArray(data.niceToHave, 5),
    benefits: asStringArray(data.benefits, 5),
    qualityNotes: asStringArray(data.qualityNotes, 6),
  };
}

export function normalizeInterviewQuestionsResult(value: unknown): InterviewQuestionsResult | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  return {
    technical: asStringArray(data.technical, 8),
    behavioral: asStringArray(data.behavioral, 8),
    roleFit: asStringArray(data.roleFit, 8),
    evaluationCriteria: asStringArray(data.evaluationCriteria, 8),
  };
}

export function normalizeCandidateSummaryResult(value: unknown): CandidateSummaryResult | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const fitSummary = cleanText(data.fitSummary);
  const suggestedNextStep = cleanText(data.suggestedNextStep);
  if (!fitSummary || !suggestedNextStep) return null;

  return {
    strengths: asStringArray(data.strengths, 6),
    gaps: asStringArray(data.gaps, 6),
    fitSummary,
    suggestedNextStep,
    interviewFocusAreas: asStringArray(data.interviewFocusAreas, 6),
  };
}

export async function getHiringCoachContext(companyUserId: string): Promise<HiringCoachContext | null> {
  const companyRows = await sql<CompanyRow[]>`
    SELECT user_id, designation, headline, city, country, status, approved
    FROM goodhive.companies
    WHERE user_id = ${companyUserId}::uuid
    LIMIT 1
  `;

  const company = companyRows[0];
  if (!company) return null;

  const [jobRows, applicationRows] = await Promise.all([
    sql<JobRow[]>`
      SELECT
        jo.id,
        jo.title,
        jo.description,
        jo.skills,
        jo.budget,
        jo.currency,
        jo.job_type,
        jo.type_engagement,
        jo.review_status,
        COALESCE(jo.published, false) AS published,
        COALESCE(app_counts.application_count, 0) AS application_count
      FROM goodhive.job_offers jo
      LEFT JOIN (
        SELECT job_id, COUNT(*)::int AS application_count
        FROM goodhive.job_applications
        GROUP BY job_id
      ) app_counts ON app_counts.job_id = jo.id
      WHERE jo.user_id = ${companyUserId}::uuid
      ORDER BY COALESCE(jo.created_at, jo.posted_at, NOW()) DESC
      LIMIT 50
    `,
    sql<ApplicationRow[]>`
      SELECT
        ja.id,
        ja.job_id,
        ja.applicant_user_id,
        ja.applicant_name,
        ja.applicant_email,
        ja.cover_letter,
        ja.portfolio_link,
        ja.status,
        ja.rating,
        COALESCE(t.title, t.about_work, t.description) AS applicant_headline,
        t.title AS applicant_title,
        t.skills AS applicant_skills,
        t.description AS applicant_description,
        t.about_work AS applicant_about_work
      FROM goodhive.job_applications ja
      LEFT JOIN goodhive.talents t ON t.user_id = ja.applicant_user_id
      WHERE ja.company_user_id = ${companyUserId}::uuid
      ORDER BY ja.created_at DESC
      LIMIT 100
    `,
  ]);

  let sectionRows: JobSectionRow[] = [];
  try {
    sectionRows = await sql<JobSectionRow[]>`
      SELECT js.job_id, js.heading, js.content, js.sort_order
      FROM goodhive.job_sections js
      INNER JOIN goodhive.job_offers jo ON jo.id = js.job_id
      WHERE jo.user_id = ${companyUserId}::uuid
      ORDER BY js.job_id, js.sort_order ASC
    `;
  } catch (error) {
    console.warn("Hiring Coach could not load job sections:", error);
  }

  const sectionsByJobId = sectionRows.reduce<Record<string, HiringCoachJob["sections"]>>(
    (acc, section) => {
      const jobSections = acc[section.job_id] ?? [];
      jobSections.push({
        heading: section.heading?.trim() || "Section",
        content: stripHtml(section.content),
      });
      acc[section.job_id] = jobSections;
      return acc;
    },
    {},
  );

  return {
    company: {
      userId: company.user_id,
      name: company.designation?.trim() || "GoodHive Company",
      headline: stripHtml(company.headline),
      location: [company.city, company.country].filter(Boolean).join(", "),
      status: company.status,
      approved: company.approved === true,
    },
    jobs: jobRows.map((job) => ({
      id: job.id,
      title: job.title?.trim() || "Untitled job",
      description: stripHtml(job.description),
      skills: splitSkills(job.skills),
      budget: job.budget === null || job.budget === undefined ? null : Number(job.budget),
      currency: job.currency,
      jobType: job.job_type,
      typeEngagement: job.type_engagement,
      reviewStatus: job.review_status,
      published: job.published === true,
      applicationCount: Number(job.application_count || 0),
      sections: sectionsByJobId[job.id] ?? [],
    })),
    applications: applicationRows.map((application) => {
      const description = stripHtml(safeBase64Decode(application.applicant_description));
      const aboutWork = stripHtml(safeBase64Decode(application.applicant_about_work));
      return {
        id: application.id,
        jobId: application.job_id,
        applicantUserId: application.applicant_user_id,
        applicantName: application.applicant_name?.trim() || "Applicant",
        applicantEmail: application.applicant_email?.trim() || "",
        coverLetter: stripHtml(application.cover_letter),
        portfolioLink: application.portfolio_link,
        status: application.status ?? "new",
        rating: application.rating,
        applicantHeadline: stripHtml(application.applicant_headline),
        applicantTitle: application.applicant_title?.trim() || "",
        applicantSkills: splitSkills(application.applicant_skills),
        applicantBio: aboutWork || description,
      };
    }),
  };
}

export function findOwnedJob(context: HiringCoachContext, jobId: string) {
  return context.jobs.find((job) => job.id === jobId) ?? null;
}

export function findOwnedApplication(
  context: HiringCoachContext,
  jobId: string,
  applicationId: number,
) {
  return (
    context.applications.find(
      (application) => application.jobId === jobId && application.id === applicationId,
    ) ?? null
  );
}

function formatJob(job: HiringCoachJob | null, draftText?: string) {
  if (!job) {
    return `Draft job post:\n${truncate(stripHtml(draftText), 4000)}`;
  }

  const sectionText = job.sections
    .map((section) => `${section.heading}: ${section.content}`)
    .join("\n");

  return [
    `Title: ${job.title}`,
    `Description: ${truncate(job.description, 1600) || "Not provided"}`,
    `Skills: ${job.skills.length ? job.skills.join(", ") : "Not specified"}`,
    `Budget: ${job.budget ?? "Not specified"} ${job.currency ?? ""}`.trim(),
    `Work type: ${job.jobType ?? "Not specified"}`,
    `Engagement: ${job.typeEngagement ?? "Not specified"}`,
    sectionText ? `Sections:\n${truncate(sectionText, 2600)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatApplication(application: HiringCoachApplication | null) {
  if (!application) return "No candidate selected.";
  return [
    `Candidate: ${application.applicantName}`,
    `Headline: ${application.applicantHeadline || application.applicantTitle || "Not provided"}`,
    `Skills: ${application.applicantSkills.length ? application.applicantSkills.join(", ") : "Not specified"}`,
    `Bio: ${truncate(application.applicantBio, 1200) || "Not provided"}`,
    `Cover letter: ${truncate(application.coverLetter, 1400) || "Not provided"}`,
    `Application status: ${application.status}`,
    `Internal rating: ${application.rating ?? "Not rated"}`,
  ].join("\n");
}

function companyHeader(context: HiringCoachContext) {
  return [
    "You are GoodHive Hiring Coach, an expert hiring assistant for companies on GoodHive.",
    "GoodHive is a Web3-native talent marketplace for missions, freelance roles, and remote work.",
    "Keep advice professional, practical, fair, and concise. Do not invent candidate facts.",
    `Company: ${context.company.name}`,
    `Company profile: ${truncate(context.company.headline, 500) || "Not provided"}`,
    `Company location: ${context.company.location || "Not specified"}`,
  ].join("\n");
}

export function buildJobPostCoachPrompt(
  context: HiringCoachContext,
  params: { job: HiringCoachJob | null; draftText?: string },
) {
  return `${companyHeader(context)}

Improve this job post for clarity, candidate appeal, and realistic requirements.

${formatJob(params.job, params.draftText)}

Return ONLY valid JSON with this exact shape:
{
  "title": "Improved title",
  "overview": "2-3 sentence overview",
  "responsibilities": ["specific responsibility"],
  "requirements": ["required skill or experience"],
  "niceToHave": ["optional skill"],
  "benefits": ["candidate-facing benefit"],
  "qualityNotes": ["short note about what changed or what is still missing"]
}`;
}

export function buildInterviewQuestionsPrompt(
  context: HiringCoachContext,
  params: { job: HiringCoachJob; application: HiringCoachApplication | null },
) {
  return `${companyHeader(context)}

Create interview questions for the selected role${params.application ? " and candidate" : ""}.

Role context:
${formatJob(params.job)}

Candidate context:
${formatApplication(params.application)}

Return ONLY valid JSON with this exact shape:
{
  "technical": ["question"],
  "behavioral": ["question"],
  "roleFit": ["question"],
  "evaluationCriteria": ["criterion"]
}`;
}

export function buildCandidateSummaryPrompt(
  context: HiringCoachContext,
  params: { job: HiringCoachJob; application: HiringCoachApplication },
) {
  return `${companyHeader(context)}

Summarize this candidate for the company hiring team. Be balanced and evidence-based.

Role context:
${formatJob(params.job)}

Candidate context:
${formatApplication(params.application)}

Return ONLY valid JSON with this exact shape:
{
  "strengths": ["specific strength"],
  "gaps": ["specific gap or risk"],
  "fitSummary": "Short recruiter-style summary",
  "suggestedNextStep": "Concrete next step",
  "interviewFocusAreas": ["topic to probe"]
}`;
}
