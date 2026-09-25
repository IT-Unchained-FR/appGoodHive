import { NextRequest, NextResponse } from "next/server";

import { verifyAdminToken } from "@/app/lib/admin-auth";
import {
  sendJobApprovedEmail,
  sendJobRejectedEmail,
} from "@/lib/email/job-review";
import sql from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { logAdminAction } from "@/app/lib/admin-audit";

type ReviewAction = "approve" | "reject";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isReviewAction(value: unknown): value is ReviewAction {
  return value === "approve" || value === "reject";
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      action?: unknown;
      feedback?: unknown;
    };

    if (!isReviewAction(body.action)) {
      return NextResponse.json(
        { success: false, error: "Invalid review action" },
        { status: 400 },
      );
    }

    const { jobId } = params;
    const jobRows = await sql<{
      company_email: string | null;
      company_name: string | null;
      id: string;
      title: string | null;
      user_id: string;
    }[]>`
      SELECT
        jo.id,
        jo.user_id,
        jo.title,
        jo.company_name,
        -- Fall back to the account email when the profile has none.
        COALESCE(NULLIF(TRIM(c.email), ''), NULLIF(TRIM(u.email), '')) AS company_email
      FROM goodhive.job_offers jo
      LEFT JOIN goodhive.companies c ON c.user_id = jo.user_id
      LEFT JOIN goodhive.users u ON u.userid = jo.user_id
      WHERE jo.id = ${jobId}::uuid
      LIMIT 1
    `;

    const job = jobRows[0];
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 },
      );
    }

    const rawReviewerId =
      typeof admin.id === "string"
        ? admin.id
        : typeof admin.userId === "string"
          ? admin.userId
          : null;
    const reviewerId =
      rawReviewerId && UUID_PATTERN.test(rawReviewerId) ? rawReviewerId : null;
    const feedback =
      typeof body.feedback === "string" ? body.feedback.trim() : "";

    const updatedRows = await sql<{
      admin_feedback: string | null;
      id: string;
      review_status: string;
    }[]>`
      UPDATE goodhive.job_offers
      SET
        review_status = ${body.action === "approve" ? "approved" : "rejected"},
        published = false,
        admin_feedback = ${body.action === "reject" ? feedback || null : null},
        reviewed_at = NOW(),
        reviewed_by = ${reviewerId}::uuid
      WHERE id = ${jobId}::uuid
      RETURNING id, review_status, admin_feedback
    `;

    const jobTitle = job.title?.trim() || "GoodHive job";
    await createNotification({
      userId: job.user_id,
      type: body.action === "approve" ? "job_approved" : "job_rejected",
      title:
        body.action === "approve"
          ? `"${jobTitle}" is approved`
          : `"${jobTitle}" needs changes`,
      body:
        body.action === "approve"
          ? "Publish it on the blockchain and add funds to make it live."
          : feedback || "See the feedback from the GoodHive team.",
      data: { jobId },
    });

    try {
      if (job.company_email?.trim()) {
        if (body.action === "approve") {
          await sendJobApprovedEmail({
            companyName: job.company_name,
            companyEmail: job.company_email.trim(),
            jobId,
            jobTitle: job.title?.trim() || "GoodHive job",
          });
        } else {
          await sendJobRejectedEmail({
            companyName: job.company_name,
            companyEmail: job.company_email.trim(),
            feedback,
            jobId,
            jobTitle: job.title?.trim() || "GoodHive job",
          });
        }
      }
    } catch (error) {
      console.error("Failed to send job review outcome email:", error);
    }

    await logAdminAction({
      action: body.action === "approve" ? "job.approved" : "job.rejected",
      targetType: "job",
      targetId: jobId,
      details: body.action === "reject" ? { feedback: feedback || null } : {},
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: updatedRows[0]?.id ?? jobId,
          review_status:
            updatedRows[0]?.review_status ??
            (body.action === "approve" ? "approved" : "rejected"),
          admin_feedback: updatedRows[0]?.admin_feedback ?? null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to review job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to review job" },
      { status: 500 },
    );
  }
}
