import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
    const {
      jobId,
      blockchainJobId,
      transactionHash,
      tokenAddress,
      contractAddress,
      status = "confirmed"
    } = await request.json();

    if (!jobId || !blockchainJobId || !transactionHash) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Only the job's owner may record its on-chain data.
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const [owner] = await sql<{ user_id: string }[]>`
      SELECT user_id FROM goodhive.job_offers WHERE id = ${jobId}::uuid LIMIT 1
    `;
    if (!owner) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (owner.user_id !== sessionUser.user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update job with blockchain information using block_id
    await sql`
      UPDATE goodhive.job_offers
      SET
        block_id = ${blockchainJobId},
        creation_tx_hash = ${transactionHash},
        blockchain_status = ${status},
        payment_token_address = ${tokenAddress},
        contract_address = ${contractAddress}
      WHERE id = ${jobId}
    `;

    // Record the transaction (try with different column approaches for compatibility)
    try {
      await sql`
        INSERT INTO goodhive.job_transactions (
          job_id,
          blockchain_job_id,
          transaction_hash,
          transaction_type,
          token_address,
          from_address,
          status
        ) VALUES (
          ${jobId},
          ${blockchainJobId},
          ${transactionHash},
          'create_job',
          ${tokenAddress},
          ${contractAddress},
          ${status}
        )
      `;
    } catch (transactionError) {
      console.warn("Transaction insert failed, possibly due to schema differences:", transactionError);
    }

    // Initialize job balance record (try with different column approaches for compatibility)
    if (tokenAddress) {
      try {
        await sql`
          INSERT INTO goodhive.job_balances (
            job_id,
            blockchain_job_id,
            token_address,
            balance,
            last_sync_at
          ) VALUES (
            ${jobId},
            ${blockchainJobId},
            ${tokenAddress},
            0,
            CURRENT_TIMESTAMP
          )
          ON CONFLICT (job_id, blockchain_job_id, token_address)
          DO UPDATE SET last_sync_at = CURRENT_TIMESTAMP
        `;
      } catch (balanceError) {
        console.warn("Balance insert failed, possibly due to schema differences:", balanceError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Job synced with blockchain successfully"
    });

  } catch (error) {
    console.error("Error syncing job with blockchain:", error);
    return NextResponse.json(
      { error: "Failed to sync job with blockchain" },
      { status: 500 }
    );
  }
}
