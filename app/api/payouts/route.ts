import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionUser.user_id;

    const rows = await sql`
      SELECT
        p.id,
        p.assignment_id,
        p.job_id,
        p.talent_user_id,
        p.company_user_id,
        p.amount,
        p.token,
        p.chain,
        p.tx_hash,
        p.status,
        p.platform_fee,
        p.net_amount,
        p.created_at,
        p.confirmed_at,
        jo.title AS job_title,
        t.name AS talent_name,
        c.designation AS company_name
      FROM goodhive.payouts p
      LEFT JOIN goodhive.job_offers jo ON jo.id = p.job_id
      LEFT JOIN goodhive.talents t ON t.user_id = p.talent_user_id
      LEFT JOIN goodhive.companies c ON c.user_id = p.company_user_id
      WHERE p.talent_user_id = ${userId}::uuid
         OR p.company_user_id = ${userId}::uuid
      ORDER BY p.created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to fetch payouts:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payouts" }, { status: 500 });
  }
}
