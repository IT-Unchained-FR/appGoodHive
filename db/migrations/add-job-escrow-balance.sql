-- Escrow balance per job, mirrored from the JobManager contract.
--
-- escrow_amount is a legacy boolean flag, not an amount, so the real balance
-- had nowhere to live and every escrow figure had to be read on-chain.
-- /api/jobs/[jobId]/sync-escrow writes these after funds move (fund,
-- withdraw, payout) and whenever the job's escrow card is viewed.
ALTER TABLE goodhive.job_offers
  ADD COLUMN IF NOT EXISTS escrow_balance numeric(38, 6),
  ADD COLUMN IF NOT EXISTS escrow_synced_at timestamptz;
