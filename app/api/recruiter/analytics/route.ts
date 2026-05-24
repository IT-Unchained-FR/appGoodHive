import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { isApprovedRecruiterOrCompany } from "@/app/lib/recruiting-auth";
import { sql } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const authorized = await isApprovedRecruiterOrCompany(user.user_id);
  if (!authorized)
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const uid = user.user_id;

  const [funnelRows, weeklyRows, topSkillsRows] = await Promise.all([
    // Pipeline funnel by stage
    sql`
      SELECT stage, COUNT(*)::int AS count
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
      GROUP BY stage
    `,
    // Searches per week (last 8 weeks)
    sql`
      SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'Mon DD') AS week,
        COUNT(*)::int AS searches
      FROM goodhive.recruiter_search_history
      WHERE recruiter_id = ${uid}::uuid
        AND created_at > NOW() - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY DATE_TRUNC('week', created_at)
    `,
    // Top skills across all searches (from candidates JSON)
    sql`
      SELECT skill, COUNT(*)::int AS count
      FROM goodhive.recruiter_search_history,
        LATERAL jsonb_array_elements(
          CASE WHEN candidates IS NOT NULL AND jsonb_typeof(candidates) = 'array'
               THEN candidates ELSE '[]'::jsonb END
        ) AS c,
        LATERAL jsonb_array_elements_text(
          CASE WHEN c ? 'skills' AND jsonb_typeof(c->'skills') = 'array'
               THEN c->'skills' ELSE '[]'::jsonb END
        ) AS skill
      WHERE recruiter_id = ${uid}::uuid
      GROUP BY skill
      ORDER BY count DESC
      LIMIT 8
    `,
  ]);

  const STAGE_ORDER = ["shortlisted", "contacted", "interviewing", "hired", "rejected"];
  const stageMap = Object.fromEntries(funnelRows.map((r: { stage: string; count: number }) => [r.stage, r.count]));
  const funnel = STAGE_ORDER.map((s) => ({
    stage: s.charAt(0).toUpperCase() + s.slice(1),
    count: stageMap[s] ?? 0,
  }));

  const hired = stageMap["hired"] ?? 0;
  const rejected = stageMap["rejected"] ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      funnel,
      weeklySearches: weeklyRows,
      topSkills: topSkillsRows,
      hired,
      rejected,
    },
  });
}
