import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { syncJobEscrowBalance } from "@/lib/jobs/escrow";

export const dynamic = "force-dynamic";

// Refreshes the stored escrow balance from the chain. Called by the client
// after funds move; the balance is always read on-chain, never taken from
// the request, so it's safe to call any number of times.
export async function POST(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [job] = await sql<{
      block_id: string | null;
      id: string;
      payment_token_address: string | null;
      user_id: string;
    }[]>`
      SELECT id, user_id, block_id, payment_token_address
      FROM goodhive.job_offers
      WHERE id = ${params.jobId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    if (job.user_id !== sessionUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const result = await syncJobEscrowBalance(job);
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Job isn't on the blockchain yet" },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to sync escrow balance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read the escrow balance" },
      { status: 502 },
    );
  }
}
