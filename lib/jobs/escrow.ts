import { formatUnits } from "viem";

import sql from "@/lib/db";
import { getTokenInfo } from "@/lib/contracts/erc20";
import { getJobBalance } from "@/lib/contracts/jobManager";

export interface EscrowSyncResult {
  balance: string;
  syncedAt: string;
}

/**
 * Reads a job's escrow balance from the JobManager contract and mirrors it
 * into goodhive.job_offers.escrow_balance. The chain stays the source of
 * truth; the copy lets dashboards and checklists show balances without an
 * RPC call per job. Returns null for a job that isn't on-chain.
 */
export async function syncJobEscrowBalance(job: {
  block_id: string | number | null;
  id: string;
  payment_token_address: string | null;
}): Promise<EscrowSyncResult | null> {
  // block_id is generated for every job; only a blockchain publish writes
  // payment_token_address, so that's what marks a job as on-chain.
  if (!job.payment_token_address || job.block_id === null) return null;

  const [raw, token] = await Promise.all([
    getJobBalance(String(job.block_id)),
    getTokenInfo(job.payment_token_address),
  ]);
  const balance = formatUnits(raw, token.decimals);

  const [row] = await sql<{ escrow_synced_at: Date }[]>`
    UPDATE goodhive.job_offers
    SET escrow_balance = ${balance}::numeric, escrow_synced_at = NOW()
    WHERE id = ${job.id}::uuid
    RETURNING escrow_synced_at
  `;

  return { balance, syncedAt: new Date(row.escrow_synced_at).toISOString() };
}
