import { NextRequest, NextResponse } from "next/server";

import { computeMatchScore } from "@/app/lib/ai/match-score";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { expireStaleImmediateAvailability, safeBase64Decode } from "@/lib/talents";

export const dynamic = "force-dynamic";

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
}

function normalizeSkills(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
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
  if (
    status === "immediately" ||
    status === "weeks_2" ||
    status === "weeks_4" ||
    status === "months_3"
  ) {
    return status;
  }

  if (legacy === true || legacy === "true" || legacy === "Available") {
    return "immediately";
  }

  return "not_looking";
}

async function getApprovedRecruiter(userId: string) {
  const rows = await sql<{ recruiter_status: string | null }[]>`
    SELECT recruiter_status
    FROM goodhive.users
    WHERE userid = ${userId}::uuid
    LIMIT 1
  `;
  const row = rows[0];
  return row?.recruiter_status === "approved" ? row : null;
}

export async function POST(request: NextRequest) {
  try {
    await expireStaleImmediateAvailability();

    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const recruiter = await getApprovedRecruiter(sessionUser.user_id);
    if (!recruiter) {
      return NextResponse.json(
        { success: false, error: "Approved recruiter profile required" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { jobDescription?: unknown };
    const jobDescription =
      typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";

    if (jobDescription.length < 50) {
      return NextResponse.json(
        { success: false, error: "Job description must be at least 50 characters" },
        { status: 400 },
      );
    }

    if (jobDescription.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Job description must be at most 5000 characters" },
        { status: 400 },
      );
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
        AND user_id != ${sessionUser.user_id}::uuid
      ORDER BY last_active DESC NULLS LAST
    `;

    if (talents.length === 0) {
      return NextResponse.json(
        { success: true, data: { candidates: [], scoredCount: 0 } },
        { status: 200 },
      );
    }

    const results: CandidateResult[] = [];

    for (let index = 0; index < talents.length; index += 5) {
      const chunk = talents.slice(index, index + 5);
      const chunkResults = await Promise.all(
        chunk.map(async (talent): Promise<CandidateResult> => {
          const talentSkills = normalizeSkills(talent.skills);
          const description = safeBase64Decode(talent.description || talent.about_work);
          const minRate = normalizeNumeric(talent.min_rate ?? talent.rate);
          const maxRate = normalizeNumeric(talent.max_rate ?? talent.rate);
          const availabilityStatus = normalizeAvailability(
            talent.availability_status,
            talent.availability,
          );

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

          const matchScore = await computeMatchScore({
            jobTitle: "Talent Search",
            jobDescription,
            jobSkills: [],
            talentBio: description,
            talentSkills,
            yearsExperience: null,
          });

          return {
            ...baseCandidate,
            score: matchScore.score,
            reasons: matchScore.reasons,
            gaps: matchScore.gaps,
            unavailable: matchScore.unavailable,
            message: matchScore.message,
          };
        }),
      );

      results.push(...chunkResults);
    }

    const candidates = results
      .sort((left, right) => (right.score ?? -1) - (left.score ?? -1))
      .slice(0, 5);

    return NextResponse.json(
      { success: true, data: { candidates, scoredCount: results.length } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to generate top talents for recruiter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate top talents" },
      { status: 500 },
    );
  }
}
