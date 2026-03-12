import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { createNotification } from "@/lib/notifications";
import { sendMissionCompletedEmail } from "@/lib/email/job-review";

export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      amount?: unknown;
      token?: unknown;
    };

    const amount = typeof body.amount === "number" && body.amount > 0 ? body.amount : null;
    const token = body.token === "USDT" ? "USDT" : "USDC";

    if (!amount) {
      return NextResponse.json({ success: false, error: "amount (number > 0) is required" }, { status: 400 });
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

    if (assignment.company_user_id !== sessionUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (assignment.status !== "completion_requested") {
      return NextResponse.json(
        { success: false, error: "Assignment is not in completion_requested state" },
        { status: 409 },
      );
    }

    // GoodHive platform fee: 5%
    const PLATFORM_FEE_RATE = 0.05;
    const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 1_000_000) / 1_000_000;
    const netAmount = Math.round((amount - platformFee) * 1_000_000) / 1_000_000;

    // Mark assignment completed
    await sql`
      UPDATE goodhive.job_assignments
      SET status = 'completed', completed_at = NOW()
      WHERE id = ${params.assignmentId}::uuid
    `;

    // Create payout record (pending tx — frontend will do the actual on-chain tx then call /confirm-tx)
    const payoutRows = await sql<{ id: string }[]>`
      INSERT INTO goodhive.payouts (
        assignment_id, job_id, talent_user_id, company_user_id,
        amount, token, chain, platform_fee, net_amount, status
      ) VALUES (
        ${assignment.id}::uuid,
        ${assignment.job_id}::uuid,
        ${assignment.talent_user_id}::uuid,
        ${assignment.company_user_id}::uuid,
        ${amount},
        ${token},
        'polygon',
        ${platformFee},
        ${netAmount},
        'pending_tx'
      )
      RETURNING id
    `;

    const payoutId = payoutRows[0]?.id;

    // Fetch names/emails for notification
    const [jobRows, talentRows, companyRows] = await Promise.all([
      sql<{ title: string | null }[]>`SELECT title FROM goodhive.job_offers WHERE id = ${assignment.job_id}::uuid LIMIT 1`,
      sql<{ email: string | null; name: string | null; wallet_address: string | null }[]>`
        SELECT
          t.name,
          u.email,
          COALESCE(
            NULLIF(u.thirdweb_wallet_address, ''),
            NULLIF(u.wallet_address, '')
          ) AS wallet_address
        FROM goodhive.talents t
        LEFT JOIN goodhive.users u ON u.userid = t.user_id
        WHERE t.user_id = ${assignment.talent_user_id}::uuid LIMIT 1
      `,
      sql<{ designation: string | null; email: string | null }[]>`
        SELECT designation, email FROM goodhive.companies WHERE user_id = ${sessionUser.user_id}::uuid LIMIT 1
      `,
    ]);

    const jobTitle = jobRows[0]?.title ?? "the job";
    const talentName = talentRows[0]?.name?.trim() || "The talent";
    const talentEmail = talentRows[0]?.email;
    const talentWalletAddress = talentRows[0]?.wallet_address?.trim() || null;
    const companyName = companyRows[0]?.designation?.trim() || "Company";

    await createNotification({
      userId: assignment.talent_user_id,
      type: "mission_completed",
      title: `Mission completed! ${companyName} confirmed your work on "${jobTitle}". Payout of ${netAmount} ${token} incoming.`,
      data: { assignmentId: assignment.id, jobId: assignment.job_id, payoutId },
    });

    if (talentEmail) {
      sendMissionCompletedEmail({
        talentName,
        talentEmail,
        companyName,
        jobTitle,
        netAmount,
        token,
      }).catch((err) => console.error("Failed to send mission completed email:", err));
    }

    return NextResponse.json({
      success: true,
      data: {
        assignmentId: assignment.id,
        payoutId,
        amount,
        netAmount,
        platformFee,
        talentWalletAddress,
        token,
        status: "pending_tx",
      },
    });
  } catch (error) {
    console.error("Failed to confirm completion:", error);
    return NextResponse.json({ success: false, error: "Failed to confirm completion" }, { status: 500 });
  }
}
