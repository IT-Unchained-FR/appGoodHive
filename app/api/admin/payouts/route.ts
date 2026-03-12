import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { verifyAdminToken } from "@/app/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
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
      ORDER BY p.created_at DESC
      LIMIT 500
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to fetch payouts (admin):", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payouts" }, { status: 500 });
  }
}
