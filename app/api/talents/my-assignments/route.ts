import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT
        ja.id,
        ja.status,
        ja.notes,
        ja.assigned_at,
        ja.responded_at,
        ja.job_id,
        jo.title AS job_title,
        jo.budget,
        jo.currency,
        ja.company_user_id,
        c.designation AS company_name,
        c.image_url AS company_logo
      FROM goodhive.job_assignments ja
      LEFT JOIN goodhive.job_offers jo ON jo.id = ja.job_id
      LEFT JOIN goodhive.companies c ON c.user_id = ja.company_user_id
      WHERE ja.talent_user_id = ${sessionUser.user_id}::uuid
      ORDER BY ja.assigned_at DESC
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to fetch talent assignments:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch assignments" }, { status: 500 });
  }
}
