import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _request: NextRequest,
  { params }: { params: { assignmentId: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql<{
      id: string;
      status: string;
      talent_user_id: string;
      company_user_id: string;
      job_id: string;
    }[]>`
      SELECT id, status, talent_user_id, company_user_id, job_id
      FROM goodhive.job_assignments
      WHERE id = ${params.assignmentId}::uuid
      LIMIT 1
    `;

    const assignment = rows[0];
    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.talent_user_id !== sessionUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (assignment.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Assignment must be active to request completion" },
        { status: 409 },
      );
    }

    await sql`
      UPDATE goodhive.job_assignments
      SET
        status = 'completion_requested',
        completion_requested_at = NOW(),
        completion_requested_by = ${sessionUser.user_id}::uuid
      WHERE id = ${params.assignmentId}::uuid
    `;

    // Fetch job title and talent name for notification
    const [jobRows, talentRows] = await Promise.all([
      sql<{ title: string | null }[]>`SELECT title FROM goodhive.job_offers WHERE id = ${assignment.job_id}::uuid LIMIT 1`,
      sql<{ name: string | null }[]>`SELECT name FROM goodhive.talents WHERE user_id = ${sessionUser.user_id}::uuid LIMIT 1`,
    ]);

    const jobTitle = jobRows[0]?.title ?? "the job";
    const talentName = talentRows[0]?.name?.trim() || "The talent";

    await createNotification({
      userId: assignment.company_user_id,
      type: "mission_complete_requested",
      title: `${talentName} has requested mission completion for "${jobTitle}"`,
      data: { assignmentId: assignment.id, jobId: assignment.job_id },
    });

    return NextResponse.json({ success: true, data: { assignmentId: assignment.id, status: "completion_requested" } });
  } catch (error) {
    console.error("Failed to request completion:", error);
    return NextResponse.json({ success: false, error: "Failed to request completion" }, { status: 500 });
  }
}
