import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { resolveJobReviewStatus } from "@/lib/jobs/review";

export async function POST(
  _request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = params;

    const jobRows = await sql<{ user_id: string; review_status: string | null; published: boolean | null }[]>`
      SELECT user_id, review_status, published
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

    const currentStatus = resolveJobReviewStatus(job.review_status, job.published);
    if (currentStatus === "closed") {
      return NextResponse.json({ success: false, error: "Job is already closed" }, { status: 409 });
    }

    await sql`
      UPDATE goodhive.job_offers
      SET review_status = 'closed', published = false
      WHERE id = ${jobId}::uuid
    `;

    return NextResponse.json({ success: true, data: { jobId, status: "closed" } });
  } catch (error) {
    console.error("Failed to close job:", error);
    return NextResponse.json({ success: false, error: "Failed to close job" }, { status: 500 });
  }
}
