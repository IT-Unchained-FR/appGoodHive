import { NextRequest, NextResponse } from "next/server";

import { computeMatchScore } from "@/app/lib/ai/match-score";
import { PROFICIENCY_LEVELS } from "@/app/constants/languages";
import {
  EMPTY_CONSTRAINTS,
  applyLanguagePenalty,
  findConstraintViolation,
  hasActiveConstraints,
  isWorkMode,
  languageGap,
  parseTalentLanguages,
  requiresPresence,
  type ConstrainedTalent,
  type SearchConstraints,
} from "@/app/lib/matching/constraints";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { isApprovedRecruiterOrCompany } from "@/app/lib/recruiting-auth";
import sql from "@/lib/db";
import { expireStaleImmediateAvailability, safeBase64Decode } from "@/lib/talents";

export const dynamic = "force-dynamic";

const MAX_TALENTS_TO_CONSIDER = 120;
const MAX_TALENTS_TO_SCORE = 30;

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
  remote_only: boolean | null;
  resume_languages: string | null;
}

/** A scored candidate plus the facts the post-scoring guard needs. The extra
 *  field is stripped before the response is serialised. */
type ScoredCandidate = CandidateResult & { constrained: ConstrainedTalent };

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

type JsonPrimitive = string | number | boolean | null;
type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };

function normalizeSkills(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length > 2),
  );
}

function getCheapRelevanceScore(talent: TalentRow, jobTokens: Set<string>) {
  const skills = normalizeSkills(talent.skills);
  const searchable = [
    talent.title,
    talent.description,
    talent.about_work,
    skills.join(" "),
  ]
    .filter(Boolean)
    .join(" ");
  const talentTokens = tokenize(searchable);
  let overlap = 0;

  jobTokens.forEach((token) => {
    if (talentTokens.has(token)) overlap += 1;
  });

  return overlap * 3 + skills.length;
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

function toSearchHistoryJson(candidate: CandidateResult): JsonValue {
  return {
    userId: candidate.userId,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    title: candidate.title,
    description: candidate.description,
    skills: candidate.skills,
    city: candidate.city,
    country: candidate.country,
    imageUrl: candidate.imageUrl,
    minRate: candidate.minRate,
    maxRate: candidate.maxRate,
    currency: candidate.currency,
    availabilityStatus: candidate.availabilityStatus,
    lastActive: candidate.lastActive,
    score: candidate.score,
    reasons: candidate.reasons,
    gaps: candidate.gaps,
    unavailable: candidate.unavailable,
    message: candidate.message,
  };
}

export async function POST(request: NextRequest) {
  try {
    await expireStaleImmediateAvailability();

    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const authorized = await isApprovedRecruiterOrCompany(sessionUser.user_id);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Recruiter or company access required" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      jobDescription?: unknown;
      jobTitle?: unknown;
      jobSkills?: unknown;
      workMode?: unknown;
      country?: unknown;
      city?: unknown;
      requiredLanguages?: unknown;
    };
    const jobDescription =
      typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";

    const jobTitle =
      typeof body.jobTitle === "string" && body.jobTitle.trim()
        ? body.jobTitle.trim().slice(0, 200)
        : "Talent Search";

    const jobSkills = Array.isArray(body.jobSkills)
      ? body.jobSkills
          .filter((skill): skill is string => typeof skill === "string")
          .map((skill) => skill.trim())
          .filter(Boolean)
          .slice(0, 30)
      : [];

    const constraints: SearchConstraints = {
      workMode: isWorkMode(body.workMode) ? body.workMode : EMPTY_CONSTRAINTS.workMode,
      country:
        typeof body.country === "string" && body.country.trim()
          ? body.country.trim().toUpperCase().slice(0, 2)
          : null,
      city: typeof body.city === "string" && body.city.trim() ? body.city.trim().slice(0, 100) : null,
      requiredLanguages: Array.isArray(body.requiredLanguages)
        ? body.requiredLanguages
            .filter((language): language is string => typeof language === "string")
            .map((language) => language.trim())
            .filter(Boolean)
            .slice(0, 5)
        : [],
    };

    // Onsite/hybrid without a country is not a filter — it is an unanswered
    // question. Ask rather than silently returning the whole database.
    if (requiresPresence(constraints.workMode) && !constraints.country) {
      return NextResponse.json(
        {
          success: false,
          error: "Select a country for onsite or hybrid roles, or switch the work mode to Remote / Any.",
        },
        { status: 400 },
      );
    }

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

    // Enforced in SQL so unqualified talents never reach the scorer at all —
    // which also keeps LLM calls (and token spend) down.
    const locationFilterActive =
      requiresPresence(constraints.workMode) && Boolean(constraints.country);

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
        last_active,
        remote_only,
        resume_languages
      FROM goodhive.talents
      WHERE approved = true
        AND (availability = true OR LOWER(CAST(availability AS TEXT)) = 'available')
        AND user_id != ${sessionUser.user_id}::uuid
        ${
          locationFilterActive
            ? sql`AND UPPER(TRIM(country)) = ${constraints.country as string}
                  AND (remote_only IS NULL OR remote_only = false)`
            : sql``
        }
      ORDER BY last_active DESC NULLS LAST
      LIMIT ${MAX_TALENTS_TO_CONSIDER}
    `;

    if (talents.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            candidates: [],
            scoredCount: 0,
            constraintsApplied: hasActiveConstraints(constraints),
            emptyReason: locationFilterActive
              ? `No available talent is based in ${constraints.country}. Try Remote or Any work mode.`
              : null,
          },
        },
        { status: 200 },
      );
    }

    const jobTokens = tokenize(jobDescription);
    const talentsToScore = [...talents]
      .sort((left, right) => {
        const relevanceDiff =
          getCheapRelevanceScore(right, jobTokens) -
          getCheapRelevanceScore(left, jobTokens);
        if (relevanceDiff !== 0) return relevanceDiff;
        return 0;
      })
      .slice(0, MAX_TALENTS_TO_SCORE);

    const results: ScoredCandidate[] = [];

    for (let index = 0; index < talentsToScore.length; index += 3) {
      const chunk = talentsToScore.slice(index, index + 3);
      const chunkResults = await Promise.all(
        chunk.map(async (talent): Promise<ScoredCandidate> => {
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

          const constrained: ConstrainedTalent = {
            country: talent.country,
            city: talent.city,
            remoteOnly: talent.remote_only,
            languages: parseTalentLanguages(talent.resume_languages),
          };

          const matchScore = await computeMatchScore({
            jobTitle,
            jobDescription,
            jobSkills,
            talentBio: description,
            talentSkills,
            yearsExperience: null,
            workMode: constraints.workMode,
            jobCountry: constraints.country,
            jobCity: constraints.city,
            requiredLanguages: constraints.requiredLanguages,
            talentCountry: constrained.country,
            talentCity: constrained.city,
            talentRemoteOnly: constrained.remoteOnly,
            talentLanguages: constrained.languages.map((language) =>
              language.proficiencyRank === null
                ? language.label
                : `${language.label} (${PROFICIENCY_LEVELS.find((level) => level.rank === language.proficiencyRank)?.label ?? "level unknown"})`,
            ),
          });

          // Language is a soft signal: known mismatch is penalised, unknown is
          // left alone and surfaced as a gap for the recruiter to verify.
          const gap = languageGap(constrained, constraints);

          return {
            ...baseCandidate,
            constrained,
            score: applyLanguagePenalty(matchScore.score, constrained, constraints),
            reasons: matchScore.reasons,
            gaps: gap ? [...matchScore.gaps, gap].slice(0, 4) : matchScore.gaps,
            unavailable: matchScore.unavailable,
            message: matchScore.message,
          };
        }),
      );

      results.push(...chunkResults);
      if (index + 3 < talentsToScore.length) await new Promise((r) => setTimeout(r, 1000));
    }

    // The guard: a hard-constraint violation is never returned, whatever the
    // model scored. The SQL pre-filter already removes these, so this only
    // catches drift between the two layers — but it must exist, because a
    // scoring bug should never be able to surface an unqualified candidate.
    const eligible = results.filter(
      ({ constrained }) => findConstraintViolation(constrained, constraints) === null,
    );

    const candidates = eligible
      .sort((left, right) => (right.score ?? -1) - (left.score ?? -1))
      .slice(0, 5)
      .map(({ constrained: _constrained, ...candidate }) => candidate);
    const candidatesJson = candidates.map(toSearchHistoryJson);

    try {
      await sql`
        INSERT INTO goodhive.recruiter_search_history
          (recruiter_id, job_description, candidates, scored_count)
        VALUES (
          ${sessionUser.user_id}::uuid,
          ${jobDescription},
          ${sql.json(candidatesJson)},
          ${results.length}
        )
      `;
    } catch (historyError) {
      console.error("Failed to save search history:", historyError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          candidates,
          scoredCount: results.length,
          constraintsApplied: hasActiveConstraints(constraints),
          emptyReason:
            candidates.length === 0 && hasActiveConstraints(constraints)
              ? "No talent matched the location or language requirements for this search."
              : null,
        },
      },
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
