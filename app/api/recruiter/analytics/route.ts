import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { isApprovedRecruiterOrCompany } from "@/app/lib/recruiting-auth";
import sql from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const authorized = await isApprovedRecruiterOrCompany(user.user_id);
    if (!authorized)
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const uid = user.user_id;

    // Run queries independently so one failure doesn't kill everything
    const funnelRows = await sql`
      SELECT stage, COUNT(*)::int AS count
      FROM goodhive.company_talent_pipeline
      WHERE company_id = ${uid}::uuid
      GROUP BY stage
    `.catch(() => []);

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

    // Simplified skills query — pull raw candidates and parse in JS
    const skillRows = await sql`
      SELECT candidates
      FROM goodhive.recruiter_search_history
      WHERE recruiter_id = ${uid}::uuid
        AND candidates IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `.catch(() => []);

    // Parse skills from candidates JSON in JS
    const skillCount: Record<string, number> = {};
    for (const row of skillRows) {
      try {
        const candidates = typeof row.candidates === "string"
          ? JSON.parse(row.candidates)
          : row.candidates;
        if (Array.isArray(candidates)) {
          for (const c of candidates) {
            const skills = Array.isArray(c.skills) ? c.skills : [];
            for (const s of skills) {
              if (typeof s === "string" && s.trim()) {
                skillCount[s.trim()] = (skillCount[s.trim()] ?? 0) + 1;
              }
            }
          }
        }
      } catch {
        // skip malformed rows
      }
    }
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({ skill, count }));

    const STAGE_ORDER = ["shortlisted", "contacted", "interviewing", "hired", "rejected"];
    const stageMap = Object.fromEntries(
      (funnelRows as { stage: string; count: number }[]).map((r) => [r.stage, r.count])
    );
    const funnel = STAGE_ORDER.map((s) => ({
      stage: s.charAt(0).toUpperCase() + s.slice(1),
      count: stageMap[s] ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        funnel,
        weeklySearches: weeklyRows,
        topSkills,
        hired: stageMap["hired"] ?? 0,
        rejected: stageMap["rejected"] ?? 0,
      },
    });
  } catch (err) {
    console.error("[analytics] error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
