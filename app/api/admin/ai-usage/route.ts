import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

const verifyAdminToken = async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = verify(token, getAdminJWTSecret()) as { role: string };
      if (decoded.role === "admin") return decoded;
    } catch {
      // fall through
    }
  }
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("No token provided");
  const decoded = verify(token, getAdminJWTSecret()) as { role: string };
  if (decoded.role !== "admin") throw new Error("Not authorized");
  return decoded;
};

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req);

    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get("days") ?? "30"), 90);

    // Ensure table exists (idempotent)
    await sql`
      CREATE TABLE IF NOT EXISTS goodhive.groq_usage (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        model TEXT NOT NULL,
        feature TEXT NOT NULL DEFAULT 'unknown',
        prompt_tokens INT NOT NULL DEFAULT 0,
        completion_tokens INT NOT NULL DEFAULT 0,
        total_tokens INT NOT NULL DEFAULT 0
      )
    `;

    const [todayStats, dailyStats, modelStats, featureStats] = await Promise.all([
      // Today's totals
      sql`
        SELECT
          COUNT(*)::int AS requests,
          COALESCE(SUM(total_tokens), 0)::int AS total_tokens,
          COALESCE(SUM(prompt_tokens), 0)::int AS prompt_tokens,
          COALESCE(SUM(completion_tokens), 0)::int AS completion_tokens
        FROM goodhive.groq_usage
        WHERE created_at >= NOW()::date
      `,
      // Daily breakdown (last N days)
      sql`
        WITH date_series AS (
          SELECT generate_series(
            (NOW() - (${days} || ' days')::interval)::date,
            NOW()::date,
            '1 day'::interval
          ) AS date
        ),
        counts AS (
          SELECT
            DATE(created_at) AS date,
            COUNT(*)::int AS requests,
            COALESCE(SUM(total_tokens), 0)::int AS total_tokens
          FROM goodhive.groq_usage
          WHERE created_at >= NOW() - (${days} || ' days')::interval
          GROUP BY DATE(created_at)
        )
        SELECT
          ds.date::date AS date,
          COALESCE(c.requests, 0) AS requests,
          COALESCE(c.total_tokens, 0) AS total_tokens
        FROM date_series ds
        LEFT JOIN counts c ON ds.date = c.date
        ORDER BY ds.date ASC
      `,
      // Per-model breakdown
      sql`
        SELECT
          model,
          COUNT(*)::int AS requests,
          COALESCE(SUM(total_tokens), 0)::int AS total_tokens
        FROM goodhive.groq_usage
        WHERE created_at >= NOW() - (${days} || ' days')::interval
        GROUP BY model
        ORDER BY requests DESC
      `,
      // Per-feature breakdown
      sql`
        SELECT
          feature,
          COUNT(*)::int AS requests,
          COALESCE(SUM(total_tokens), 0)::int AS total_tokens
        FROM goodhive.groq_usage
        WHERE created_at >= NOW() - (${days} || ' days')::interval
        GROUP BY feature
        ORDER BY requests DESC
        LIMIT 10
      `,
    ]);

    const payload = {
      today: todayStats[0] ?? { requests: 0, total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 },
      daily: dailyStats.map((r) => ({
        date: String(r.date).split("T")[0],
        requests: Number(r.requests),
        total_tokens: Number(r.total_tokens),
      })),
      byModel: modelStats.map((r) => ({
        model: r.model,
        requests: Number(r.requests),
        total_tokens: Number(r.total_tokens),
      })),
      byFeature: featureStats.map((r) => ({
        feature: r.feature,
        requests: Number(r.requests),
        total_tokens: Number(r.total_tokens),
      })),
    };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ["No token provided", "Invalid token", "Not authorized"].includes(error.message)
    ) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("ai-usage API error:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch AI usage" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
