import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";
import { evaluateAndStoreTalentProfile, AI_PROFILE_SUMMARY_VERSION } from "@/app/lib/ai/evaluate-talent-profile";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verify(token, getAdminJWTSecret()) as { role: string };
    if (decoded.role !== "admin") {
      throw new Error("Not authorized");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

/**
 * Evaluates up to `limit` approved talents whose cached AI profile evaluation is missing, stale,
 * or written under an older schema version. Covers two cases the approval-time trigger doesn't:
 * talents approved before this feature shipped, and talents whose evaluation failed at approval
 * time and never self-healed via a search. Safe to call repeatedly / on a schedule.
 */
export async function POST(req: NextRequest) {
  try {
    await verifyAdminToken();

    let limit = DEFAULT_LIMIT;
    try {
      const body = await req.json();
      if (typeof body?.limit === "number" && Number.isFinite(body.limit)) {
        limit = Math.min(MAX_LIMIT, Math.max(1, Math.round(body.limit)));
      }
    } catch {
      // No body provided — use the default limit.
    }

    const pending = await sql<{ user_id: string }[]>`
      SELECT user_id
      FROM goodhive.talents
      WHERE approved = true
        AND (
          ai_profile_summary IS NULL
          OR ai_profile_summary_version IS DISTINCT FROM ${AI_PROFILE_SUMMARY_VERSION}
          OR ai_profile_stale = true
        )
      ORDER BY ai_profile_evaluated_at ASC NULLS FIRST
      LIMIT ${limit}
    `;

    const results = await Promise.all(
      pending.map(async ({ user_id }) => {
        try {
          const summary = await evaluateAndStoreTalentProfile(user_id);
          return { userId: user_id, ok: Boolean(summary) };
        } catch (error) {
          console.error(`evaluate-pending: failed for ${user_id}:`, error);
          return { userId: user_id, ok: false };
        }
      }),
    );

    return new Response(
      JSON.stringify({
        message: `Evaluated ${results.filter((r) => r.ok).length}/${results.length} pending talent(s)`,
        results,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("evaluate-pending error:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }
    return new Response(JSON.stringify({ message: "Error evaluating pending talents" }), {
      status: 500,
    });
  }
}
