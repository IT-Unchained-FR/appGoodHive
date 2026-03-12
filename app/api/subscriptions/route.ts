import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

// Subscription plans: pricing in USDC, duration in days
const PLANS = {
  pro: { amountUsdc: 49, durationDays: 30 },
  enterprise: { amountUsdc: 199, durationDays: 30 },
} as const;

type Plan = keyof typeof PLANS;

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql<{
      id: string;
      plan: string;
      status: string;
      amount_usdc: number;
      starts_at: string;
      expires_at: string;
      tx_hash: string | null;
    }[]>`
      SELECT id, plan, status, amount_usdc, starts_at, expires_at, tx_hash
      FROM goodhive.company_subscriptions
      WHERE company_user_id = ${sessionUser.user_id}::uuid
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const active = rows.find(
      (r) => r.status === "active" && new Date(r.expires_at) > new Date(),
    ) ?? null;

    return NextResponse.json({ success: true, data: { active, history: rows } });
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Called after company completes on-chain USDC payment
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { plan?: unknown; txHash?: unknown };
    const plan = (Object.keys(PLANS).includes(String(body.plan)) ? body.plan : null) as Plan | null;
    const txHash = typeof body.txHash === "string" && body.txHash.trim() ? body.txHash.trim() : null;

    if (!plan) {
      return NextResponse.json({ success: false, error: "plan must be 'pro' or 'enterprise'" }, { status: 400 });
    }
    if (!txHash) {
      return NextResponse.json({ success: false, error: "txHash is required" }, { status: 400 });
    }

    // Prevent duplicate tx
    const dupCheck = await sql`
      SELECT id FROM goodhive.company_subscriptions WHERE tx_hash = ${txHash} LIMIT 1
    `;
    if (dupCheck.length > 0) {
      return NextResponse.json({ success: false, error: "Transaction already recorded" }, { status: 409 });
    }

    const { amountUsdc, durationDays } = PLANS[plan];
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const result = await sql<{ id: string }[]>`
      INSERT INTO goodhive.company_subscriptions
        (company_user_id, plan, status, tx_hash, amount_usdc, chain, expires_at)
      VALUES
        (${sessionUser.user_id}::uuid, ${plan}, 'active', ${txHash}, ${amountUsdc}, 'polygon', ${expiresAt}::timestamptz)
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      data: { subscriptionId: result[0].id, plan, expiresAt, amountUsdc },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to record subscription:", error);
    return NextResponse.json({ success: false, error: "Failed to record subscription" }, { status: 500 });
  }
}
