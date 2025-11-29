-- Add created_at to referrals table
-- Migration created: 2025-11-29
BEGIN;

ALTER TABLE goodhive.referrals
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing records
UPDATE goodhive.referrals
SET created_at = NOW()
WHERE created_at IS NULL;

COMMIT;
