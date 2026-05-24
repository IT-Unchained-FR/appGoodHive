import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { isApprovedRecruiterOrCompany } from "@/app/lib/recruiting-auth";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const authorized = await isApprovedRecruiterOrCompany(sessionUser.user_id);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Recruiter or company access required" },
        { status: 403 },
      );
    }

    const uid = sessionUser.user_id;

    // ── Search history stats ─────────────────────────────────────────────────
    const [searchTotals] = await sql<{ total: number; this_week: number; last_week: number }[]>`
      SELECT
        COUNT(*)                                                              AS total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')      AS this_week,
        COUNT(*) FILTER (
          WHERE created_at >= NOW() - INTERVAL '14 days'
            AND created_at <  NOW() - INTERVAL '7 days'
        )                                                                     AS last_week
      FROM goodhive.recruiter_search_history
      WHERE recruiter_id = ${uid}::uuid
    `;

    // 12-day rolling sparkline for searches (day 0 = 11 days ago, day 11 = today)
    const searchSparkRows = await sql<{ day: string; cnt: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
        COUNT(*)                                              AS cnt
      FROM goodhive.recruiter_search_history
      WHERE recruiter_id = ${uid}::uuid
        AND created_at >= NOW() - INTERVAL '12 days'
      GROUP BY day
      ORDER BY day ASC
    `;

    // Build a filled 12-slot array (0 for days with no searches)
    const searchSparkline = buildSparkline(searchSparkRows, 12);

    // ── Pipeline stats ───────────────────────────────────────────────────────
    const [pipelineTotals] = await sql<{ added_this_week: number; added_last_week: number }[]>`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  AS added_this_week,
        COUNT(*) FILTER (
          WHERE created_at >= NOW() - INTERVAL '14 days'
            AND created_at <  NOW() - INTERVAL '7 days'
        )                                                                 AS added_last_week
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
    `;

    // 12-day rolling sparkline for pipeline additions
    const pipelineSparkRows = await sql<{ day: string; cnt: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
        COUNT(*)                                              AS cnt
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
        AND created_at >= NOW() - INTERVAL '12 days'
      GROUP BY day
      ORDER BY day ASC
    `;
    const pipelineSparkline = buildSparkline(pipelineSparkRows, 12);

    // ── Interviewing count ───────────────────────────────────────────────────
    const [interviewingRow] = await sql<{ current_count: number; last_week_count: number }[]>`
      SELECT
        COUNT(*) FILTER (WHERE stage = 'interviewing')                              AS current_count,
        COUNT(*) FILTER (
          WHERE stage = 'interviewing'
            AND updated_at < NOW() - INTERVAL '7 days'
        )                                                                            AS last_week_count
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
    `;

    // 12-day sparkline for interviewing-stage entries (by updated_at)
    const interviewSparkRows = await sql<{ day: string; cnt: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', updated_at), 'YYYY-MM-DD') AS day,
        COUNT(*)                                              AS cnt
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
        AND stage = 'interviewing'
        AND updated_at >= NOW() - INTERVAL '12 days'
      GROUP BY day
      ORDER BY day ASC
    `;
    const interviewSparkline = buildSparkline(interviewSparkRows, 12);

    // ── Hired stats ──────────────────────────────────────────────────────────
    const [hiredRow] = await sql<{ this_month: number; last_month: number }[]>`
      SELECT
        COUNT(*) FILTER (
          WHERE stage = 'hired'
            AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW())
        )                       AS this_month,
        COUNT(*) FILTER (
          WHERE stage = 'hired'
            AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        )                       AS last_month
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
    `;

    // 12-day sparkline for hired-stage entries
    const hiredSparkRows = await sql<{ day: string; cnt: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', updated_at), 'YYYY-MM-DD') AS day,
        COUNT(*)                                              AS cnt
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
        AND stage = 'hired'
        AND updated_at >= NOW() - INTERVAL '12 days'
      GROUP BY day
      ORDER BY day ASC
    `;
    const hiredSparkline = buildSparkline(hiredSparkRows, 12);

    return NextResponse.json({
      success: true,
      data: {
        searches: {
          total:     Number(searchTotals?.total     ?? 0),
          thisWeek:  Number(searchTotals?.this_week  ?? 0),
          lastWeek:  Number(searchTotals?.last_week  ?? 0),
          sparkline: searchSparkline,
        },
        pipeline: {
          addedThisWeek: Number(pipelineTotals?.added_this_week ?? 0),
          addedLastWeek: Number(pipelineTotals?.added_last_week ?? 0),
          sparkline: pipelineSparkline,
        },
        interviewing: {
          current:  Number(interviewingRow?.current_count  ?? 0),
          lastWeek: Number(interviewingRow?.last_week_count ?? 0),
          sparkline: interviewSparkline,
        },
        hired: {
          thisMonth: Number(hiredRow?.this_month ?? 0),
          lastMonth: Number(hiredRow?.last_month ?? 0),
          sparkline: hiredSparkline,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch recruiter stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Takes sparse day-bucket rows and returns a dense array of `slots` numbers,
 * one per day from (today - slots + 1) through today.
 * Days with no row default to 0.
 */
function buildSparkline(
  rows: { day: string; cnt: number }[],
  slots: number,
): number[] {
  const map = new Map(rows.map((r) => [r.day, Number(r.cnt)]));
  const result: number[] = [];
  for (let i = slots - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    result.push(map.get(key) ?? 0);
  }
  return result;
}
