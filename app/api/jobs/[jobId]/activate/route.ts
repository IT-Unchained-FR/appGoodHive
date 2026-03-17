import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { jobId } = params;

    const jobRows = await sql<{
      id: string;
      payment_token_address: string | null;
      review_status: string | null;
      user_id: string;
    }[]>`
      SELECT id, user_id, review_status, payment_token_address
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

    if (job.user_id !== sessionUser.user_id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (job.review_status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error:
            job.review_status === "active"
              ? "Job is already active"
              : "Job must be in approved state to activate",
        },
        { status: 409 },
      );
    }

    if (!job.payment_token_address) {
      return NextResponse.json(
        {
          success: false,
          error: "Job must be published to the blockchain before activating. Please complete step 1 first.",
        },
        { status: 409 },
      );
    }

    await sql`
      UPDATE goodhive.job_offers
      SET
        review_status = 'active',
        published = true,
        posted_at = COALESCE(posted_at, NOW())
      WHERE id = ${jobId}::uuid
    `;

    return NextResponse.json(
      { success: true, data: { jobId, reviewStatus: "active" } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to activate job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to activate job" },
      { status: 500 },
    );
  }
}
