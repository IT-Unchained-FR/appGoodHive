import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { isApprovedRecruiterOrCompany } from "@/app/lib/recruiting-auth";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const authorized = await isApprovedRecruiterOrCompany(user.user_id);
    if (!authorized)
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const uid = user.user_id;

    // 1. Pipeline funnel by stage
    const funnelRows = await sql`
      SELECT stage, COUNT(*)::int AS count
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
      GROUP BY stage
    `.catch(() => []);

    // 2. Weekly searches (last 8 weeks)
    const weeklyRows = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'Mon DD') AS week,
        COUNT(*)::int AS searches
      FROM goodhive.recruiter_search_history
      WHERE recruiter_id = ${uid}::uuid
        AND created_at > NOW() - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY DATE_TRUNC('week', created_at)
    `.catch(() => []);

    // 3. This week vs last week searches
    const searchTrendRows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS this_week,
        COUNT(*) FILTER (WHERE created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days')::int AS last_week,
        COUNT(*)::int AS total,
        COALESCE(SUM(scored_count), 0)::int AS total_candidates_found
      FROM goodhive.recruiter_search_history
      WHERE recruiter_id = ${uid}::uuid
    `.catch(() => [{ this_week: 0, last_week: 0, total: 0, total_candidates_found: 0 }]);

    // 4. Pipeline added this week vs last week
    const pipelineTrendRows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS this_week,
        COUNT(*) FILTER (WHERE created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days')::int AS last_week
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
    `.catch(() => [{ this_week: 0, last_week: 0 }]);

    // 5. Recent pipeline activity (last 5 entries)
    const recentActivityRows = await sql`
      SELECT p.stage, p.created_at, p.updated_at,
             COALESCE(t.first_name || ' ' || t.last_name, 'Unknown') AS talent_name,
             t.profile_picture AS talent_image
      FROM goodhive.company_talent_pipeline p
      LEFT JOIN goodhive.talents t ON t.user_id = p.talent_id
      WHERE p.company_id = ${uid}::uuid
      ORDER BY p.updated_at DESC
      LIMIT 5
    `.catch(() => []);

    // 6. Skills from candidates JSON (in JS)
    const skillRows = await sql`
      SELECT candidates
      FROM goodhive.recruiter_search_history
      WHERE recruiter_id = ${uid}::uuid
        AND candidates IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `.catch(() => []);

    const skillCount: Record<string, number> = {};
    for (const row of skillRows) {
      try {
        const candidates = typeof row.candidates === "string"
          ? JSON.parse(row.candidates) : row.candidates;
        if (Array.isArray(candidates)) {
          for (const c of candidates) {
            for (const s of (Array.isArray(c.skills) ? c.skills : [])) {
              if (typeof s === "string" && s.trim())
                skillCount[s.trim()] = (skillCount[s.trim()] ?? 0) + 1;
            }
          }
        }
      } catch { /* skip */ }
    }
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({ skill, count }));

    // Build response
    const STAGE_ORDER = ["shortlisted", "contacted", "interviewing", "hired", "rejected"];
    const stageMap = Object.fromEntries(
      (funnelRows as { stage: string; count: number }[]).map((r) => [r.stage, r.count])
    );
    const funnel = STAGE_ORDER.map((s) => ({
      stage: s.charAt(0).toUpperCase() + s.slice(1),
      count: stageMap[s] ?? 0,
    }));

    const trend = (searchTrendRows as { this_week: number; last_week: number; total: number; total_candidates_found: number }[])[0] ?? { this_week: 0, last_week: 0, total: 0, total_candidates_found: 0 };
    const pipeTrend = (pipelineTrendRows as { this_week: number; last_week: number }[])[0] ?? { this_week: 0, last_week: 0 };

    const totalPipeline = STAGE_ORDER.reduce((s, k) => s + (stageMap[k] ?? 0), 0);
    const hired = stageMap["hired"] ?? 0;
    const rejected = stageMap["rejected"] ?? 0;
    const conversionRate = totalPipeline > 0 ? Math.round((hired / totalPipeline) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        funnel,
        weeklySearches: weeklyRows,
        topSkills,
        hired,
        rejected,
        totalPipeline,
        conversionRate,
        totalCandidatesFound: trend.total_candidates_found,
        searchTrend: { thisWeek: trend.this_week, lastWeek: trend.last_week, total: trend.total },
        pipelineTrend: { thisWeek: pipeTrend.this_week, lastWeek: pipeTrend.last_week },
        recentActivity: recentActivityRows,
      },
    });
  } catch (err) {
    console.error("[analytics] error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
