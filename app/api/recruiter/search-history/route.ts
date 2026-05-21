import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

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

export async function GET(_request: NextRequest) {
  try {
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

    const rows = await sql<
      {
        id: string;
        job_description: string;
        candidates: unknown;
        scored_count: number;
        created_at: string;
      }[]
    >`
      SELECT id, job_description, candidates, scored_count, created_at
      FROM goodhive.recruiter_search_history
      WHERE recruiter_id = ${sessionUser.user_id}::uuid
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const data = Array.from(rows).map((row) => ({
      ...row,
      // Guard against legacy rows where candidates was stored as a JSON string
      // rather than a JSONB array (postgres driver returns strings as-is).
      candidates: typeof row.candidates === "string"
        ? JSON.parse(row.candidates as string)
        : row.candidates,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Failed to fetch search history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch search history" },
      { status: 500 },
    );
  }
}
