import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";

export async function POST(
  request: NextRequest,
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
    const body = (await request.json()) as {
      blockchainJobId?: unknown;
      chain?: unknown;
      paymentTokenAddress?: unknown;
    };

    const rawBlockchainJobId = body.blockchainJobId;
    const rawTokenAddress = body.paymentTokenAddress;
    const chain =
      typeof body.chain === "string" && body.chain.trim()
        ? body.chain.trim()
        : null;

    if (
      rawBlockchainJobId === undefined ||
      rawBlockchainJobId === null ||
      rawBlockchainJobId === ""
    ) {
      return NextResponse.json(
        { success: false, error: "blockchainJobId is required" },
        { status: 400 },
      );
    }

    const blockchainJobIdNum = Number(rawBlockchainJobId);
    if (Number.isNaN(blockchainJobIdNum) || blockchainJobIdNum < 0) {
      return NextResponse.json(
        { success: false, error: "blockchainJobId must be a non-negative number" },
        { status: 400 },
      );
    }

    const tokenAddress =
      typeof rawTokenAddress === "string" && rawTokenAddress.trim()
        ? rawTokenAddress.trim()
        : null;

    // Verify ownership and that job is in approved state
    const jobRows = await sql<{
      id: string;
      review_status: string | null;
      user_id: string;
    }[]>`
      SELECT id, user_id, review_status
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
          error: "Job must be in approved state before publishing to blockchain",
        },
        { status: 409 },
      );
    }

    await sql`
      UPDATE goodhive.job_offers
      SET
        block_id = ${blockchainJobIdNum},
        payment_token_address = ${tokenAddress},
        chain = COALESCE(${chain}, chain)
      WHERE id = ${jobId}::uuid
    `;

    return NextResponse.json(
      {
        success: true,
        data: { jobId, blockchainJobId: blockchainJobIdNum, paymentTokenAddress: tokenAddress },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to save blockchain publish data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save blockchain publish data" },
      { status: 500 },
    );
  }
}
