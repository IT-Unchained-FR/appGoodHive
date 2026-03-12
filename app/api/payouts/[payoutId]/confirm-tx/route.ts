import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } },
) {
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

    const rows = await sql<{ id: string; company_user_id: string; status: string }[]>`
      SELECT id, company_user_id, status
      FROM goodhive.payouts
      WHERE id = ${params.payoutId}::uuid
      LIMIT 1
    `;

    const payout = rows[0];
    if (!payout) {
      return NextResponse.json({ success: false, error: "Payout not found" }, { status: 404 });
    }

    if (payout.company_user_id !== sessionUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (payout.status !== "pending_tx") {
      return NextResponse.json({ success: false, error: "Payout already confirmed" }, { status: 409 });
    }

    await sql`
      UPDATE goodhive.payouts
      SET status = 'confirmed', tx_hash = ${txHash}, confirmed_at = NOW()
      WHERE id = ${params.payoutId}::uuid
    `;

    return NextResponse.json({ success: true, data: { payoutId: payout.id, txHash, status: "confirmed" } });
  } catch (error) {
    console.error("Failed to confirm payout tx:", error);
    return NextResponse.json({ success: false, error: "Failed to confirm payout" }, { status: 500 });
  }
}
