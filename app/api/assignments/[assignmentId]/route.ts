import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { createNotification } from "@/lib/notifications";
import { sendAssignmentAcceptedEmail, sendAssignmentRejectedEmail } from "@/lib/email/job-review";

export async function GET(
  _request: NextRequest,
  { params }: { params: { assignmentId: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT
        ja.*,
        jo.title AS job_title,
        jo.budget,
        jo.currency,
        t.name AS talent_name,
        t.image_url AS talent_image,
        c.designation AS company_name,
        c.image_url AS company_logo
      FROM goodhive.job_assignments ja
      LEFT JOIN goodhive.job_offers jo ON jo.id = ja.job_id
      LEFT JOIN goodhive.talents t ON t.user_id = ja.talent_user_id
      LEFT JOIN goodhive.companies c ON c.user_id = ja.company_user_id
      WHERE ja.id = ${params.assignmentId}::uuid
        AND (ja.talent_user_id = ${sessionUser.user_id}::uuid OR ja.company_user_id = ${sessionUser.user_id}::uuid)
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Failed to fetch assignment:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch assignment" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { assignmentId: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { action?: unknown };
    if (body.action !== "accept" && body.action !== "reject") {
      return NextResponse.json({ success: false, error: "action must be 'accept' or 'reject'" }, { status: 400 });
    }

    // Fetch assignment — must belong to this talent
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
    if (assignment.status !== "pending") {
      return NextResponse.json({ success: false, error: "Assignment has already been responded to" }, { status: 409 });
    }

    // Check wallet address exists if accepting
    if (body.action === "accept" && !sessionUser.wallet_address) {
      return NextResponse.json(
        { success: false, error: "You must have a wallet address set on your profile before accepting an assignment" },
        { status: 403 },
      );
    }

    const nextStatus = body.action === "accept" ? "active" : "rejected";

    await sql`
      UPDATE goodhive.job_assignments
      SET status = ${nextStatus}, responded_at = NOW()
      WHERE id = ${params.assignmentId}::uuid
    `;

    // Fetch job title for notification
    const jobRows = await sql<{ title: string | null }[]>`
      SELECT title FROM goodhive.job_offers WHERE id = ${assignment.job_id}::uuid LIMIT 1
    `;
    const jobTitle = jobRows[0]?.title ?? "the job";

    // Fetch talent name
    const talentRows = await sql<{ name: string | null }[]>`
      SELECT name FROM goodhive.talents WHERE user_id = ${sessionUser.user_id}::uuid LIMIT 1
    `;
    const talentName = talentRows[0]?.name?.trim() || "The talent";

    // Fetch company email
    const companyRows = await sql<{ email: string | null; designation: string | null }[]>`
      SELECT email, designation FROM goodhive.companies WHERE user_id = ${assignment.company_user_id}::uuid LIMIT 1
    `;
    const companyEmail = companyRows[0]?.email;
    const companyName = companyRows[0]?.designation?.trim() || "Company";

    if (body.action === "accept") {
      await createNotification({
        userId: assignment.company_user_id,
        type: "assignment_accepted",
        title: `${talentName} accepted your assignment for "${jobTitle}"`,
        data: { assignmentId: assignment.id, jobId: assignment.job_id },
      });
      if (companyEmail) {
        sendAssignmentAcceptedEmail({ companyName, companyEmail, talentName, jobTitle, jobId: assignment.job_id })
          .catch((err) => console.error("Failed to send accepted email:", err));
      }
    } else {
      await createNotification({
        userId: assignment.company_user_id,
        type: "assignment_rejected",
        title: `${talentName} declined your assignment for "${jobTitle}"`,
        data: { assignmentId: assignment.id, jobId: assignment.job_id },
      });
      if (companyEmail) {
        sendAssignmentRejectedEmail({ companyName, companyEmail, talentName, jobTitle, jobId: assignment.job_id })
          .catch((err) => console.error("Failed to send rejected email:", err));
      }
    }

    return NextResponse.json({ success: true, data: { assignmentId: assignment.id, status: nextStatus } });
  } catch (error) {
    console.error("Failed to respond to assignment:", error);
    return NextResponse.json({ success: false, error: "Failed to respond to assignment" }, { status: 500 });
  }
}
