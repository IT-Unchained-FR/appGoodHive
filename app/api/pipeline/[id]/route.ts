import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

const VALID_STAGES = ["shortlisted", "contacted", "interviewing", "hired", "rejected"] as const;
type Stage = (typeof VALID_STAGES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { stage?: unknown; notes?: unknown };
    const stage = VALID_STAGES.includes(body.stage as Stage) ? (body.stage as Stage) : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

    if (!stage && notes === undefined) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const existingRows = await sql<{ id: string; company_id: string }[]>`
      SELECT id, company_id FROM goodhive.company_talent_pipeline WHERE id = ${params.id}::uuid LIMIT 1
    `;

    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
    }

    if (existingRows[0].company_id !== sessionUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const result = await sql<{ id: string; stage: string; notes: string | null }[]>`
      UPDATE goodhive.company_talent_pipeline
      SET
        stage = COALESCE(${stage}, stage),
        notes = COALESCE(${notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${params.id}::uuid
      RETURNING id, stage, notes
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Failed to update pipeline entry:", error);
    return NextResponse.json({ success: false, error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const existingRows = await sql<{ id: string; company_id: string }[]>`
      SELECT id, company_id FROM goodhive.company_talent_pipeline WHERE id = ${params.id}::uuid LIMIT 1
    `;

    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
    }

    if (existingRows[0].company_id !== sessionUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await sql`DELETE FROM goodhive.company_talent_pipeline WHERE id = ${params.id}::uuid`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete pipeline entry:", error);
    return NextResponse.json({ success: false, error: "Failed to delete entry" }, { status: 500 });
  }
}
