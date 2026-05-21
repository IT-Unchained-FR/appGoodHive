import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const existingRows = await sql<{ id: string; recruiter_id: string }[]>`
      SELECT id, recruiter_id
      FROM goodhive.recruiter_search_history
      WHERE id = ${params.id}::uuid
      LIMIT 1
    `;

    if (existingRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "History item not found" },
        { status: 404 },
      );
    }

    if (existingRows[0].recruiter_id !== sessionUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await sql`
      DELETE FROM goodhive.recruiter_search_history
      WHERE id = ${params.id}::uuid
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete search history item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete history item" },
      { status: 500 },
    );
  }
}
