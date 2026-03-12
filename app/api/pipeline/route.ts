import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

const VALID_STAGES = ["shortlisted", "contacted", "interviewing", "hired", "rejected"] as const;
type Stage = (typeof VALID_STAGES)[number];

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get("jobId");

    const rows = await sql`
      SELECT
        p.id,
        p.talent_id,
        p.stage,
        p.notes,
        p.job_id,
        p.created_at,
        p.updated_at,
        t.name AS talent_name,
        t.image_url AS talent_image,
        t.skills AS talent_skills,
        t.title AS talent_title,
        t.about_work AS talent_bio
      FROM goodhive.company_talent_pipeline p
      LEFT JOIN goodhive.talents t ON t.user_id = p.talent_id
      WHERE p.company_id = ${sessionUser.user_id}::uuid
        ${jobId ? sql`AND p.job_id = ${jobId}::uuid` : sql``}
      ORDER BY p.updated_at DESC
    `;

    const rowsArray = Array.from(rows);
    const grouped = VALID_STAGES.reduce<Record<Stage, typeof rowsArray>>((acc, stage) => {
      acc[stage] = rowsArray.filter((r) => r.stage === stage);
      return acc;
    }, {} as Record<Stage, typeof rowsArray>);

    return NextResponse.json({ success: true, data: grouped });
  } catch (error) {
    console.error("Failed to fetch pipeline:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch pipeline" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { talentId?: unknown; jobId?: unknown; stage?: unknown; notes?: unknown };
    const talentId = typeof body.talentId === "string" ? body.talentId.trim() : null;

    if (!talentId) {
      return NextResponse.json({ success: false, error: "talentId is required" }, { status: 400 });
    }

    const stage = VALID_STAGES.includes(body.stage as Stage) ? (body.stage as Stage) : "shortlisted";
    const jobId = typeof body.jobId === "string" && body.jobId.trim() ? body.jobId.trim() : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;

    // Check talent exists
    const talentRows = await sql`SELECT user_id FROM goodhive.talents WHERE user_id = ${talentId}::uuid LIMIT 1`;
    if (talentRows.length === 0) {
      return NextResponse.json({ success: false, error: "Talent not found" }, { status: 404 });
    }

    // Upsert pipeline entry
    const result = await sql<{ id: string; stage: string }[]>`
      INSERT INTO goodhive.company_talent_pipeline (company_id, talent_id, stage, notes, job_id)
      VALUES (
        ${sessionUser.user_id}::uuid,
        ${talentId}::uuid,
        ${stage},
        ${notes},
        ${jobId ? sql`${jobId}::uuid` : sql`NULL`}
      )
      ON CONFLICT ON CONSTRAINT pipeline_unique_no_job DO UPDATE
        SET stage = EXCLUDED.stage, notes = COALESCE(EXCLUDED.notes, goodhive.company_talent_pipeline.notes), updated_at = NOW()
      RETURNING id, stage
    `;

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: unknown) {
    // Handle unique constraint violation for with-job path
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "23505") {
      return NextResponse.json({ success: false, error: "Talent already in pipeline for this job" }, { status: 409 });
    }
    console.error("Failed to add to pipeline:", error);
    return NextResponse.json({ success: false, error: "Failed to add to pipeline" }, { status: 500 });
  }
}
