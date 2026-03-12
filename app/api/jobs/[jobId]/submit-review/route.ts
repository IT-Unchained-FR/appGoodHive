import { NextRequest, NextResponse } from "next/server";

import { sendJobSubmittedForReviewEmail } from "@/lib/email/job-review";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { resolveJobReviewStatus } from "@/lib/jobs/review";

export async function POST(
  _request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const { jobId } = params;

  try {
    const sessionUser = await getSessionUser();
    const actorUserId = sessionUser?.user_id ?? null;
    if (!actorUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const jobRows = await sql<{
      company_name: string | null;
      id: string;
      published: boolean | null;
      review_status: string | null;
      title: string | null;
      user_id: string;
    }[]>`
      SELECT id, user_id, company_name, title, review_status, published
      FROM goodhive.job_offers
      WHERE id = ${jobId}::uuid
      LIMIT 1
    `;

    const job = jobRows[0];
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 },
      );
    }

    if (job.user_id !== actorUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const reviewStatus = resolveJobReviewStatus(job.review_status, job.published);
    if (reviewStatus !== "draft" && reviewStatus !== "rejected") {
      return NextResponse.json(
        {
          success: false,
          error: "Only draft or rejected jobs can be submitted for review.",
        },
        { status: 403 },
      );
    }

    const updatedRows = await sql<{
      id: string;
      review_status: string;
    }[]>`
      UPDATE goodhive.job_offers
      SET
        review_status = 'pending_review',
        published = false,
        in_saving_stage = false,
        admin_feedback = NULL,
        reviewed_at = NULL,
        reviewed_by = NULL
      WHERE id = ${jobId}::uuid
      RETURNING id, review_status
    `;

    const companyRows = await sql<{ designation: string | null }[]>`
      SELECT designation
      FROM goodhive.companies
      WHERE user_id = ${actorUserId}::uuid
      LIMIT 1
    `;

    try {
      await sendJobSubmittedForReviewEmail({
        companyName:
          companyRows[0]?.designation?.trim() ||
          job.company_name?.trim() ||
          "GoodHive Company",
        jobId,
        jobTitle: job.title?.trim() || jobId,
      });
    } catch (error) {
      console.error("Failed to send job submission email:", error);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: updatedRows[0]?.id ?? jobId,
          review_status: updatedRows[0]?.review_status ?? "pending_review",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to submit job for review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit job for review" },
      { status: 500 },
    );
  }
}
