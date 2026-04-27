import { NextRequest, NextResponse } from "next/server";

import { computeMatchScore } from "@/app/lib/ai/match-score";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { expireStaleImmediateAvailability, safeBase64Decode } from "@/lib/talents";

export const dynamic = "force-dynamic";

interface CompanyRow {
  user_id: string;
  published: boolean | null;
}

interface JobRow {
  id: string;
  title: string | null;
  description: string | null;
  skills: string | null;
}

interface TalentRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  description: string | null;
  about_work: string | null;
  skills: string | null;
  city: string | null;
  country: string | null;
  image_url: string | null;
  min_rate: number | string | null;
  max_rate: number | string | null;
  rate: number | string | null;
  currency: string | null;
  availability: boolean | string | null;
  availability_status: string | null;
  last_active: string | null;
}

interface CacheRow {
  talent_id: string;
  score: number | null;
  reasons: unknown;
  gaps: unknown;
}

interface CandidateResult {
  userId: string;
  firstName: string;
  lastName: string;
  title: string;
  description: string;
  skills: string[];
  city: string | null;
  country: string | null;
  imageUrl: string | null;
  minRate: number | null;
  maxRate: number | null;
  currency: string;
  availabilityStatus: string;
  lastActive: string | null;
  score: number | null;
  reasons: string[];
  gaps: string[];
  unavailable: boolean;
  message?: string;
  cached: boolean;
}

function normalizeSkills(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function normalizeNumeric(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeAvailability(status: string | null, legacy: boolean | string | null) {
  if (status === "immediately" || status === "weeks_2" || status === "weeks_4" || status === "months_3") {
    return status;
  }

  if (legacy === true || legacy === "true" || legacy === "Available") {
    return "immediately";
  }

  return "not_looking";
}

async function getApprovedCompany(userId: string) {
  const rows = await sql<CompanyRow[]>`
    SELECT user_id, published
    FROM goodhive.companies
    WHERE user_id = ${userId}::uuid
    LIMIT 1
  `;

  const company = rows[0];
  return company?.published ? company : null;
}

async function getCompanyJobs(userId: string) {
  return sql<{ id: string; title: string | null }[]>`
    SELECT id, title
    FROM goodhive.job_offers
    WHERE user_id = ${userId}::uuid
      AND published = true
    ORDER BY posted_at DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT 20
  `;
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const company = await getApprovedCompany(sessionUser.user_id);
    if (!company) {
      return NextResponse.json(
        { success: false, error: "Approved company profile required" },
        { status: 403 },
      );
    }

    const jobs = await getCompanyJobs(sessionUser.user_id);

    return NextResponse.json({ success: true, data: { jobs } }, { status: 200 });
  } catch (error) {
    console.error("Failed to load top candidates context:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load top candidates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await expireStaleImmediateAvailability();

    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { jobId?: unknown; refresh?: unknown };
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    const forceRefresh = body.refresh === true;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 });
    }

    const company = await getApprovedCompany(sessionUser.user_id);
    if (!company) {
      return NextResponse.json(
        { success: false, error: "Approved company profile required" },
        { status: 403 },
      );
    }

    const jobRows = await sql<JobRow[]>`
      SELECT id, title, description, skills
      FROM goodhive.job_offers
      WHERE id = ${jobId}::uuid
        AND user_id = ${sessionUser.user_id}::uuid
        AND published = true
      LIMIT 1
    `;

    const job = jobRows[0];
    if (!job) {
      return NextResponse.json({ success: false, error: "Published job not found" }, { status: 404 });
    }

    const talents = await sql<TalentRow[]>`
      SELECT
        user_id,
        first_name,
        last_name,
        title,
        description,
        about_work,
        skills,
        city,
        country,
        image_url,
        min_rate,
        max_rate,
        rate,
        currency,
        availability,
        availability_status,
        last_active
      FROM goodhive.talents
      WHERE approved = true
        AND (availability = true OR LOWER(CAST(availability AS TEXT)) = 'available')
      ORDER BY last_active DESC NULLS LAST
    `;

    if (talents.length === 0) {
      return NextResponse.json(
        { success: true, data: { candidates: [], job, scoredCount: 0 } },
        { status: 200 },
      );
    }

    const cachedRows = forceRefresh
      ? []
      : await sql<CacheRow[]>`
          SELECT talent_id, score, reasons, gaps
          FROM goodhive.match_score_cache
          WHERE job_id = ${jobId}::uuid
            AND talent_id = ANY(${talents.map((talent) => talent.user_id)}::uuid[])
            AND expires_at > NOW()
        `;

    const cacheByTalentId = new Map(
      cachedRows.map((row) => [
        row.talent_id,
        {
          score: row.score === null ? null : Number(row.score),
          reasons: normalizeStringList(row.reasons),
          gaps: normalizeStringList(row.gaps),
        },
      ]),
    );

    const results: CandidateResult[] = [];

    for (let index = 0; index < talents.length; index += 5) {
      const chunk = talents.slice(index, index + 5);
      const chunkResults = await Promise.all(
        chunk.map(async (talent): Promise<CandidateResult> => {
          const cached = cacheByTalentId.get(talent.user_id);
          const talentSkills = normalizeSkills(talent.skills);
          const description = safeBase64Decode(talent.description || talent.about_work);
          const minRate = normalizeNumeric(talent.min_rate ?? talent.rate);
          const maxRate = normalizeNumeric(talent.max_rate ?? talent.rate);
          const availabilityStatus = normalizeAvailability(talent.availability_status, talent.availability);
          const baseCandidate = {
            userId: talent.user_id,
            firstName: talent.first_name ?? "",
            lastName: talent.last_name ?? "",
            title: talent.title ?? "Professional",
            description,
            skills: talentSkills,
            city: talent.city,
            country: talent.country,
            imageUrl: talent.image_url,
            minRate,
            maxRate,
            currency: talent.currency ?? "€",
            availabilityStatus,
            lastActive: talent.last_active,
          };

          if (cached) {
            return {
              ...baseCandidate,
              score: cached.score,
              reasons: cached.reasons,
              gaps: cached.gaps,
              unavailable: false,
              cached: true,
            };
          }

          const matchScore = await computeMatchScore({
            jobTitle: job.title ?? "",
            jobDescription: job.description ?? "",
            jobSkills: normalizeSkills(job.skills),
            talentBio: description,
            talentSkills,
            yearsExperience: null,
          });

          await sql`
            INSERT INTO goodhive.match_score_cache (job_id, talent_id, score, reasons, gaps, expires_at)
            VALUES (
              ${jobId}::uuid,
              ${talent.user_id}::uuid,
              ${matchScore.score},
              ${JSON.stringify(matchScore.reasons)}::jsonb,
              ${JSON.stringify(matchScore.gaps)}::jsonb,
              NOW() + INTERVAL '1 hour'
            )
            ON CONFLICT (job_id, talent_id) DO UPDATE SET
              score = EXCLUDED.score,
              reasons = EXCLUDED.reasons,
              gaps = EXCLUDED.gaps,
              expires_at = EXCLUDED.expires_at
          `;

          return {
            ...baseCandidate,
            score: matchScore.score,
            reasons: matchScore.reasons,
            gaps: matchScore.gaps,
            unavailable: matchScore.unavailable,
            message: matchScore.message,
            cached: false,
          };
        }),
      );

      results.push(...chunkResults);
    }

    const candidates = results
      .sort((left, right) => (right.score ?? -1) - (left.score ?? -1))
      .slice(0, 5);

    return NextResponse.json(
      {
        success: true,
        data: {
          candidates,
          job: { id: job.id, title: job.title },
          scoredCount: results.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to generate top candidates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate top candidates" },
      { status: 500 },
    );
  }
}
