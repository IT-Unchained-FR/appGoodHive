import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { createNotification } from "@/lib/notifications";
import { sendAssignmentRequestEmail } from "@/lib/email/job-review";

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { talentUserId?: string; notes?: string };
    if (!body.talentUserId) {
      return NextResponse.json({ success: false, error: "talentUserId is required" }, { status: 400 });
    }

    const { jobId } = params;

    // Verify job exists, is approved, and belongs to this company
    const jobRows = await sql<{ id: string; title: string; review_status: string | null; user_id: string }[]>`
      SELECT id, title, review_status, user_id
      FROM goodhive.job_offers
      WHERE id = ${jobId}::uuid
      LIMIT 1
    `;
    const job = jobRows[0];
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    if (job.user_id !== sessionUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (job.review_status !== "approved") {
      return NextResponse.json({ success: false, error: "Job must be approved before assigning talents" }, { status: 403 });
    }

    // Verify company is approved
    const companyRows = await sql<{ status: string | null; designation: string | null }[]>`
      SELECT status, designation FROM goodhive.companies WHERE user_id = ${sessionUser.user_id}::uuid LIMIT 1
    `;
    if (!companyRows[0]) {
      return NextResponse.json({ success: false, error: "Company profile not found" }, { status: 403 });
    }

    // Verify talent exists and is approved
    const talentRows = await sql<{ user_id: string; first_name: string | null; last_name: string | null; email: string | null }[]>`
      SELECT t.user_id, t.first_name, t.last_name, u.email
      FROM goodhive.talents t
      LEFT JOIN goodhive.users u ON u.userid = t.user_id
      WHERE t.user_id = ${body.talentUserId}::uuid LIMIT 1
    `;
    if (!talentRows[0]) {
      return NextResponse.json({ success: false, error: "Talent not found" }, { status: 404 });
    }

    // Insert assignment (unique constraint prevents duplicates)
    let assignmentId: string;
    try {
      const result = await sql<{ id: string }[]>`
        INSERT INTO goodhive.job_assignments (job_id, talent_user_id, company_user_id, notes)
        VALUES (${jobId}::uuid, ${body.talentUserId}::uuid, ${sessionUser.user_id}::uuid, ${body.notes ?? null})
        RETURNING id
      `;
      assignmentId = result[0].id;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
        return NextResponse.json({ success: false, error: "This talent has already been assigned to this job" }, { status: 409 });
      }
      throw err;
    }

    const companyName = companyRows[0].designation?.trim() || "A company";

    // Send email to talent (non-blocking)
    const talentEmail = talentRows[0]?.email;
    const talentName = [talentRows[0]?.first_name, talentRows[0]?.last_name].filter(Boolean).join(" ").trim() || "Talent";
    if (talentEmail) {
      sendAssignmentRequestEmail({
        talentName,
        talentEmail,
        companyName,
        jobTitle: job.title?.trim() || jobId,
        jobId,
        notes: body.notes,
      }).catch((err) => console.error("Failed to send assignment email:", err));
    }

    // Create in-app notification for talent
    await createNotification({
      userId: body.talentUserId,
      type: "assignment_request",
      title: `${companyName} assigned you to "${job.title}"`,
      body: body.notes ?? undefined,
      data: { jobId, assignmentId, companyUserId: sessionUser.user_id },
    });

    return NextResponse.json({ success: true, data: { assignmentId } }, { status: 201 });
  } catch (error) {
    console.error("Failed to assign talent:", error);
    return NextResponse.json({ success: false, error: "Failed to assign talent" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = params;

    // Must be job owner
    const jobRows = await sql<{ user_id: string }[]>`
      SELECT user_id FROM goodhive.job_offers WHERE id = ${jobId}::uuid LIMIT 1
    `;
    if (!jobRows[0] || jobRows[0].user_id !== sessionUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const assignments = await sql`
      SELECT
        ja.id,
        ja.status,
        ja.notes,
        ja.assigned_at,
        ja.responded_at,
        ja.talent_user_id,
        TRIM(CONCAT_WS(' ', t.first_name, t.last_name)) AS talent_name,
        t.image_url AS talent_image
      FROM goodhive.job_assignments ja
      LEFT JOIN goodhive.talents t ON t.user_id = ja.talent_user_id
      WHERE ja.job_id = ${jobId}::uuid
      ORDER BY ja.assigned_at DESC
    `;

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch assignments" }, { status: 500 });
  }
}
