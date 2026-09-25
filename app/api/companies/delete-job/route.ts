import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { canCompanyDeleteJob } from "@/lib/jobs/review";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Permanently deletes one of the signed-in company's own jobs. Only allowed
// before the job reaches the blockchain; after that it must be closed so its
// escrow stays manageable.
export async function DELETE(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ message: "Invalid job id" }, { status: 400 });
    }

    const [job] = await sql<{
      payment_token_address: string | null;
      review_status: string | null;
      user_id: string;
    }[]>`
      SELECT user_id, review_status, payment_token_address
      FROM goodhive.job_offers
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    if (job.user_id !== sessionUser.user_id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!canCompanyDeleteJob(job)) {
      return NextResponse.json(
        {
          message:
            "This job is already on the blockchain, so it can't be deleted. Close it from My Jobs instead.",
        },
        { status: 409 },
      );
    }

    await sql`
      DELETE FROM goodhive.job_offers
      WHERE id = ${id}::uuid AND user_id = ${sessionUser.user_id}::uuid
    `;

    return NextResponse.json({ message: "Job deleted" });
  } catch (error) {
    console.error("Failed to delete job:", error);
    return NextResponse.json({ message: "Failed to delete job" }, { status: 500 });
  }
}
