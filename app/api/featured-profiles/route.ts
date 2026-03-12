import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

// 7-day featured listing: 9 USDC
const FEATURED_AMOUNT_USDC = 9;
const FEATURED_DURATION_DAYS = 7;

export async function GET() {
  // Returns currently featured talents (public)
  try {
    const rows = await sql`
      SELECT
        fp.id,
        fp.talent_user_id,
        fp.expires_at,
        t.name,
        t.image_url,
        t.title,
        t.skills,
        t.about_work,
        t.city,
        t.country
      FROM goodhive.featured_profiles fp
      LEFT JOIN goodhive.talents t ON t.user_id = fp.talent_user_id
      WHERE fp.status = 'active' AND fp.expires_at > NOW()
      ORDER BY fp.starts_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to fetch featured profiles:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch featured profiles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Called after talent completes on-chain USDC payment to feature their profile
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { txHash?: unknown };
    const txHash = typeof body.txHash === "string" && body.txHash.trim() ? body.txHash.trim() : null;

    if (!txHash) {
      return NextResponse.json({ success: false, error: "txHash is required" }, { status: 400 });
    }

    // Prevent duplicate tx
    const dupCheck = await sql`
      SELECT id FROM goodhive.featured_profiles WHERE tx_hash = ${txHash} LIMIT 1
    `;
    if (dupCheck.length > 0) {
      return NextResponse.json({ success: false, error: "Transaction already recorded" }, { status: 409 });
    }

    // Check talent profile exists
    const talentRows = await sql`
      SELECT user_id FROM goodhive.talents WHERE user_id = ${sessionUser.user_id}::uuid AND talent_status = 'approved' LIMIT 1
    `;
    if (talentRows.length === 0) {
      return NextResponse.json({ success: false, error: "Approved talent profile required" }, { status: 403 });
    }

    const expiresAt = new Date(Date.now() + FEATURED_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const result = await sql<{ id: string }[]>`
      INSERT INTO goodhive.featured_profiles
        (talent_user_id, tx_hash, amount_usdc, chain, expires_at)
      VALUES
        (${sessionUser.user_id}::uuid, ${txHash}, ${FEATURED_AMOUNT_USDC}, 'polygon', ${expiresAt}::timestamptz)
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      data: {
        featuredId: result[0].id,
        expiresAt,
        amountUsdc: FEATURED_AMOUNT_USDC,
        durationDays: FEATURED_DURATION_DAYS,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to record featured profile:", error);
    return NextResponse.json({ success: false, error: "Failed to record featured profile" }, { status: 500 });
  }
}
