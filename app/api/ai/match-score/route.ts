import { NextRequest, NextResponse } from "next/server";

import { computeMatchScore } from "@/app/lib/ai/match-score";
import sql from "@/lib/db";
import { safeBase64Decode } from "@/lib/talents";

interface JobRow {
  id: string;
  company_user_id: string;
  title: string | null;
  description: string | null;
  skills: string | null;
}

interface TalentRow {
  description: string | null;
  skills: string | null;
  years_experience: number | null;
}

interface CacheRow {
  score: number | null;
  reasons: unknown;
  gaps: unknown;
}

function resolveActorUserId(request: NextRequest) {
  return request.headers.get("x-user-id") ?? request.cookies.get("user_id")?.value ?? null;
}

function normalizeSkills(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      jobId?: string;
      talentId?: string;
    };

    const jobId = body.jobId?.trim();
    const talentId = body.talentId?.trim();

    if (!jobId || !talentId) {
      return NextResponse.json(
        { success: false, error: "jobId and talentId required" },
        { status: 400 },
      );
    }

    const actorUserId = resolveActorUserId(request);
    if (!actorUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const [companyRows, talentRowsForActor] = await Promise.all([
      sql<{ user_id: string }[]>`
        SELECT user_id
        FROM goodhive.companies
        WHERE user_id = ${actorUserId}::uuid
        LIMIT 1
      `,
      sql<{ user_id: string }[]>`
        SELECT user_id
        FROM goodhive.talents
        WHERE user_id = ${actorUserId}::uuid
        LIMIT 1
      `,
    ]);

    const isCompany = companyRows.length > 0;
    const isTalent = talentRowsForActor.length > 0;
    const canAccessAsTalent = isTalent && actorUserId === talentId;

    if (!isCompany && !canAccessAsTalent) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const jobRows = await sql<JobRow[]>`
      SELECT id, user_id AS company_user_id, title, description, skills
      FROM goodhive.job_offers
      WHERE id = ${jobId}::uuid
      LIMIT 1
    `;

    if (jobRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 },
      );
    }

    const job = jobRows[0];

    if (isCompany && !canAccessAsTalent && job.company_user_id !== actorUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const targetTalentRows = await sql<TalentRow[]>`
      SELECT description, skills, NULL::int AS years_experience
      FROM goodhive.talents
      WHERE user_id = ${talentId}::uuid
      LIMIT 1
    `;

    if (targetTalentRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Talent not found" },
        { status: 404 },
      );
    }

    const cachedRows = await sql<CacheRow[]>`
      SELECT score, reasons, gaps
      FROM goodhive.match_score_cache
      WHERE job_id = ${jobId}::uuid
        AND talent_id = ${talentId}::uuid
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (cachedRows.length > 0) {
      const cached = cachedRows[0];
      return NextResponse.json(
        {
          success: true,
          data: {
            score: cached.score === null ? null : Number(cached.score),
            reasons: normalizeStringList(cached.reasons),
            gaps: normalizeStringList(cached.gaps),
            cached: true,
          },
        },
        { status: 200 },
      );
    }

    const talent = targetTalentRows[0];
    const matchScoreResult = await computeMatchScore({
      jobTitle: job.title ?? "",
      jobDescription: job.description ?? "",
      jobSkills: normalizeSkills(job.skills),
      talentBio: safeBase64Decode(talent.description),
      talentSkills: normalizeSkills(talent.skills),
      yearsExperience:
        typeof talent.years_experience === "number" ? talent.years_experience : null,
    });

    await sql`
      INSERT INTO goodhive.match_score_cache (job_id, talent_id, score, reasons, gaps, expires_at)
      VALUES (
        ${jobId}::uuid,
        ${talentId}::uuid,
        ${matchScoreResult.score},
        ${JSON.stringify(matchScoreResult.reasons)}::jsonb,
        ${JSON.stringify(matchScoreResult.gaps)}::jsonb,
        NOW() + INTERVAL '1 hour'
      )
      ON CONFLICT (job_id, talent_id) DO UPDATE SET
        score = EXCLUDED.score,
        reasons = EXCLUDED.reasons,
        gaps = EXCLUDED.gaps,
        expires_at = EXCLUDED.expires_at
    `;

    return NextResponse.json(
      {
        success: true,
        data: {
          ...matchScoreResult,
          cached: false,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Match score error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute match score" },
      { status: 500 },
    );
  }
}
