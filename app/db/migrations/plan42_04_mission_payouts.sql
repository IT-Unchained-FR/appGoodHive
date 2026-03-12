-- Plan-42 Phase 5: Mission completion + payout tracking
-- Run on: goodhive schema

BEGIN;

-- 1. Add completion fields to job_assignments
ALTER TABLE goodhive.job_assignments
  ADD COLUMN IF NOT EXISTS completion_requested_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_requested_by  UUID,
  ADD COLUMN IF NOT EXISTS completed_at             TIMESTAMPTZ;

-- Update status enum to include completion states
-- (If status is stored as text/varchar, we just use the new string values directly)
-- Existing values: pending, active, rejected, completed
-- New values: completion_requested
-- No enum change needed if status column is text.

-- 2. Create payouts table
CREATE TABLE IF NOT EXISTS goodhive.payouts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id     UUID NOT NULL REFERENCES goodhive.job_assignments(id),
  job_id            UUID NOT NULL,
  talent_user_id    UUID NOT NULL,
  company_user_id   UUID NOT NULL,
  amount            NUMERIC(18, 6) NOT NULL,
  token             VARCHAR(10) NOT NULL DEFAULT 'USDC',   -- USDC | USDT | HONEY
  chain             VARCHAR(30) NOT NULL DEFAULT 'polygon',
  tx_hash           VARCHAR(100),                          -- set after on-chain confirmation
  status            VARCHAR(20) NOT NULL DEFAULT 'pending_tx',
                    -- pending_tx | confirmed | failed
  platform_fee      NUMERIC(18, 6),
  net_amount        NUMERIC(18, 6),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at      TIMESTAMPTZ,
  CONSTRAINT payouts_assignment_unique UNIQUE (assignment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_talent      ON goodhive.payouts(talent_user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_company     ON goodhive.payouts(company_user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status      ON goodhive.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at  ON goodhive.payouts(created_at DESC);

COMMIT;
