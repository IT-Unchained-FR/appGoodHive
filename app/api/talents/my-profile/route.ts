import sql from "@/lib/db";
import { getViewerAccess, maskName, maskNameInText } from "@/lib/access-control";
import {
  calculateYearsExperience,
  parseStoredResumeArray,
  type ResumeCertification,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeLanguage,
  type ResumeProject,
  serializeResumeArray,
} from "@/lib/talent-profile/resume-data";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Force the browser to always fetch the latest data from the server
export const fetchCache = "force-no-store";
export const revalidate = 0;

const RESUME_IMPORT_COLUMNS = [
  "resume_experience",
  "resume_education",
  "resume_certifications",
  "resume_projects",
  "resume_languages",
] as const;

type ResumeImportColumn = (typeof RESUME_IMPORT_COLUMNS)[number];

async function getAvailableResumeImportColumns(): Promise<Set<ResumeImportColumn>> {
  const columns = await sql<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'goodhive'
      AND table_name = 'talents'
      AND column_name IN (
        'resume_experience',
        'resume_education',
        'resume_certifications',
        'resume_projects',
        'resume_languages'
      )
  `;

  return new Set(
    columns
      .map((row) => row.column_name)
      .filter(
        (column): column is ResumeImportColumn =>
          RESUME_IMPORT_COLUMNS.includes(column as ResumeImportColumn),
      ),
  );
}

export async function POST(request: Request) {
  const {
    title,
    description,
    first_name,
    last_name,
    country,
    city,
    phone_country_code,
    phone_number,
    email,
    telegram,
    about_work,
    min_rate,
    max_rate,
    rate,
    skills,
    image_url,
    cv_url,
    wallet_address,
    linkedin,
    github,
    stackoverflow,
    twitter,
    portfolio,
    freelance_only,
    remote_only,
    talent,
    mentor,
    recruiter,
    hide_contact_details,
    availability,
    user_id,
    validate,
    referred_by,
    clear_cv,
    experience,
    education,
    certifications,
    projects,
    languages,
  } = await request.json();

  try {
    if (validate === true) {
      const hasMinRate = min_rate !== undefined && min_rate !== null;
      const hasMaxRate = max_rate !== undefined && max_rate !== null;

      if (!hasMinRate || !hasMaxRate) {
        return new Response(
          JSON.stringify({
            message: "Hourly rate range is required before profile submission",
          }),
          { status: 400 },
        );
      }

      if (Number(min_rate) > Number(max_rate)) {
        return new Response(
          JSON.stringify({
            message: "Maximum rate must be at least minimum rate",
          }),
          { status: 400 },
        );
      }
    }

    const availableResumeColumns = await getAvailableResumeImportColumns();
    const shouldClearCv = clear_cv === true;
    // Filter out undefined, null, and empty string fields
    const fields: Record<string, unknown> = {
      title,
      description,
      first_name,
      last_name,
      country,
      city,
      phone_country_code,
      phone_number,
      email,
      about_work,
      min_rate: min_rate ?? rate,
      max_rate: max_rate ?? rate,
      rate,
      skills,
      image_url,
      cv_url,
      telegram,
      linkedin,
      github,
      stackoverflow,
      twitter,
      portfolio,
      freelance_only,
      remote_only,
      talent,
      mentor,
      recruiter,
      hide_contact_details,
      availability: availability === true || availability === "true" || availability === "Available" ? true : false, // Normalize to boolean
      wallet_address,
      user_id,
    };
    if (validate === true) {
      fields.inReview = true;
    }
    if (availableResumeColumns.has("resume_experience")) {
      fields.resume_experience = serializeResumeArray(experience);
    }
    if (availableResumeColumns.has("resume_education")) {
      fields.resume_education = serializeResumeArray(education);
    }
    if (availableResumeColumns.has("resume_certifications")) {
      fields.resume_certifications = serializeResumeArray(certifications);
    }
    if (availableResumeColumns.has("resume_projects")) {
      fields.resume_projects = serializeResumeArray(projects);
    }
    if (availableResumeColumns.has("resume_languages")) {
      fields.resume_languages = serializeResumeArray(languages);
    }

    const filteredFields = Object.entries(fields).filter(([key, value]) => {
      if (value === undefined || value === "") {
        return false;
      }

      if (value === null) {
        return key === "cv_url" && shouldClearCv;
      }

      return true;
    });

    const columns = filteredFields.map(([key]) => key).join(", ");
    const values = filteredFields.map(([, value]) => value);
    const placeholders = filteredFields
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    const updateSet = filteredFields
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(", ");

    const query = `
      INSERT INTO goodhive.talents (${columns})
      VALUES (${placeholders})
      ON CONFLICT (user_id)
      DO UPDATE SET ${updateSet}
    `;

    await sql.unsafe(query, values);

    if (validate === true) {
      await sql`
        UPDATE goodhive.users
        SET
          talent_status = CASE
            WHEN ${Boolean(talent)} = true THEN
              CASE
                WHEN talent_status = 'approved' THEN talent_status
                ELSE 'pending'
              END
            ELSE talent_status
          END,
          mentor_status = CASE
            WHEN ${Boolean(mentor)} = true THEN
              CASE
                WHEN mentor_status = 'approved' THEN mentor_status
                ELSE 'pending'
              END
            ELSE mentor_status
          END,
          recruiter_status = CASE
            WHEN ${Boolean(recruiter)} = true THEN
              CASE
                WHEN recruiter_status = 'approved' THEN recruiter_status
                ELSE 'pending'
              END
            ELSE recruiter_status
          END,
          talent_status_reason = CASE
            WHEN ${Boolean(talent)} = true AND talent_status <> 'approved' THEN NULL
            ELSE talent_status_reason
          END,
          mentor_status_reason = CASE
            WHEN ${Boolean(mentor)} = true AND mentor_status <> 'approved' THEN NULL
            ELSE mentor_status_reason
          END,
          recruiter_status_reason = CASE
            WHEN ${Boolean(recruiter)} = true AND recruiter_status <> 'approved' THEN NULL
            ELSE recruiter_status_reason
          END
        WHERE userid = ${user_id}
      `;
    }

    if (referred_by) {
      console.log("Referred By Performed");
      await sql`
      UPDATE goodhive.referrals 
      SET talents = ARRAY_APPEND(COALESCE(talents, ARRAY[]::text[]), ${user_id}::text)
      WHERE referral_code = ${referred_by}
      `;
    }

    return new Response(
      JSON.stringify({ message: "Data inserted or updated successfully" }),
    );
  } catch (error: any) {
    if (
      error.code === "23505" &&
      error.constraint_name === "talents_email_key"
    ) {
      return new Response(
        JSON.stringify({ message: "This email address is already registered" }),
        { status: 400 },
      );
    }

    return new Response(
      JSON.stringify({ message: "Error inserting or updating data" }),
      { status: 500 },
    );
  }
}

// Helper function to safely decode base64 or return original string
function safeBase64Decode(value: string | null | undefined): string {
  if (!value) return "";

  try {
    // Check if the string looks like base64 (contains only base64 characters)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (base64Regex.test(value)) {
      return Buffer.from(value, "base64").toString("utf-8");
    }
    // If it doesn't look like base64, return as is
    return value;
  } catch (error) {
    console.error("Error decoding base64:", error);
    return value || "";
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user_id from query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const viewerUserId =
      request.headers.get("x-user-id") || request.cookies.get("user_id")?.value;

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const availableResumeColumns = await getAvailableResumeImportColumns();
    const resumeColumnSelect = RESUME_IMPORT_COLUMNS.map((column) =>
      availableResumeColumns.has(column)
        ? column
        : `NULL::TEXT AS ${column}`,
    ).join(",\n        ");

    // Fetch talent profile data from database
    const talents = await sql.unsafe(
      `
      SELECT
        title,
        description,
        first_name,
        last_name,
        country,
        city,
        phone_country_code,
        phone_number,
        email,
        telegram,
        about_work,
        min_rate,
        max_rate,
        rate,
        skills,
        image_url,
        cv_url,
        linkedin,
        github,
        stackoverflow,
        twitter,
        portfolio,
        freelance_only,
        remote_only,
        talent,
        mentor,
        recruiter,
        hide_contact_details,
        availability,
        approved,
        inReview,
        user_id,
        last_active,
        ${resumeColumnSelect}
      FROM goodhive.talents
      WHERE user_id = $1
    `,
      [user_id],
    );

    if (talents.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const talent = talents[0];
    const viewerAccess = await getViewerAccess(viewerUserId);
    const isOwner = viewerUserId && viewerUserId === user_id;
    const canViewSensitive = viewerAccess.isApproved || isOwner;
    const canViewBasic = viewerAccess.isAuthenticated || isOwner;

    // Get approved roles from users table
    const users = await sql`
      SELECT approved_roles
      FROM goodhive.users 
      WHERE userid = ${user_id}
    `;

    const maskedName = maskName(talent.first_name, talent.last_name);
    const decodedDescription = talent.description
      ? safeBase64Decode(talent.description)
      : null;
    const decodedAboutWork = talent.about_work
      ? safeBase64Decode(talent.about_work)
      : null;
    const parsedExperience = parseStoredResumeArray<ResumeExperience>(
      talent.resume_experience,
    );
    const parsedEducation = parseStoredResumeArray<ResumeEducation>(
      talent.resume_education,
    );
    const parsedCertifications = parseStoredResumeArray<ResumeCertification>(
      talent.resume_certifications,
    );
    const parsedProjects = parseStoredResumeArray<ResumeProject>(
      talent.resume_projects,
    );
    const parsedLanguages = parseStoredResumeArray<ResumeLanguage>(
      talent.resume_languages,
    );
    const profileData = {
      ...talent,
      first_name: canViewBasic ? talent.first_name : maskedName.firstName,
      last_name: canViewBasic ? talent.last_name : maskedName.lastName,
      email: canViewSensitive ? talent.email : null,
      phone_country_code: canViewSensitive ? talent.phone_country_code : null,
      phone_number: canViewSensitive ? talent.phone_number : null,
      telegram: canViewSensitive ? talent.telegram : null,
      linkedin: canViewSensitive ? talent.linkedin : null,
      github: canViewSensitive ? talent.github : null,
      twitter: canViewSensitive ? talent.twitter : null,
      portfolio: canViewSensitive ? talent.portfolio : null,
      stackoverflow: canViewSensitive ? talent.stackoverflow : null,
      cv_url: canViewSensitive ? talent.cv_url : null,
      description: canViewSensitive
        ? decodedDescription
        : maskNameInText(decodedDescription, talent.first_name, talent.last_name),
      about_work: canViewSensitive
        ? decodedAboutWork
        : maskNameInText(decodedAboutWork, talent.first_name, talent.last_name),
      min_rate:
        talent.min_rate !== null && talent.min_rate !== undefined
          ? Number(talent.min_rate)
          : talent.rate
            ? Number(talent.rate)
            : undefined,
      max_rate:
        talent.max_rate !== null && talent.max_rate !== undefined
          ? Number(talent.max_rate)
          : talent.rate
            ? Number(talent.rate)
            : undefined,
      approved_roles: users.length > 0 ? users[0].approved_roles : [],
      experience: parsedExperience,
      education: parsedEducation,
      certifications: parsedCertifications,
      projects: parsedProjects,
      languages: parsedLanguages,
      years_experience: calculateYearsExperience(parsedExperience),
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Error in my-profile API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
