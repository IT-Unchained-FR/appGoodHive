import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const talentId = request.nextUrl.searchParams.get("talentId");
    if (!talentId) {
      return NextResponse.json({ success: false, error: "talentId required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT stage
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${sessionUser.user_id}::uuid
        AND talent_id = ${talentId}::uuid
      LIMIT 1
    `;

    return NextResponse.json({
      success: true,
      data: { inPipeline: rows.length > 0, stage: rows[0]?.stage ?? null },
    });
  } catch (error) {
    console.error("Failed to check pipeline:", error);
    return NextResponse.json({ success: false, error: "Failed to check pipeline" }, { status: 500 });
  }
}
