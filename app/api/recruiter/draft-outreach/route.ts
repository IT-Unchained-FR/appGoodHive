import { NextRequest, NextResponse } from "next/server";

import { generateOutreachEmail } from "@/app/lib/ai/outreach-email";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

async function getApprovedRecruiter(userId: string) {
  const rows = await sql<{ recruiter_status: string | null }[]>`
    SELECT recruiter_status
    FROM goodhive.users
    WHERE userid = ${userId}::uuid
    LIMIT 1
  `;
  const row = rows[0];
  return row?.recruiter_status === "approved" ? row : null;
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const recruiter = await getApprovedRecruiter(sessionUser.user_id);
    if (!recruiter) {
      return NextResponse.json(
        { success: false, error: "Approved recruiter profile required" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      talentName?: unknown;
      talentTitle?: unknown;
      talentSkills?: unknown;
      jobDescription?: unknown;
    };

    const talentName = typeof body.talentName === "string" ? body.talentName.trim() : "";
    const talentTitle = typeof body.talentTitle === "string" ? body.talentTitle.trim() : "";
    const talentSkills = Array.isArray(body.talentSkills)
      ? body.talentSkills.filter((s): s is string => typeof s === "string")
      : [];
    const jobDescription =
      typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";

    if (!talentName || !jobDescription) {
      return NextResponse.json(
        { success: false, error: "talentName and jobDescription are required" },
        { status: 400 },
      );
    }

    const email = await generateOutreachEmail({
      talentName,
      talentTitle,
      talentSkills,
      jobDescription,
    });

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error("Failed to draft outreach email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to draft outreach email" },
      { status: 500 },
    );
  }
}
