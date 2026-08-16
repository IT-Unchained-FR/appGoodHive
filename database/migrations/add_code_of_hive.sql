-- Code of the Hive — MVP
-- Run on: goodhive-prod (Neon, eu-west-2) — applied 2026-08-16
-- Adds signature tracking to talent profiles.
--
-- All columns are nullable or defaulted so existing talent rows stay valid
-- without a backfill. Safe to run before the application code ships.

ALTER TABLE goodhive.talents
ADD COLUMN IF NOT EXISTS code_of_hive_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS code_of_hive_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS code_of_hive_version VARCHAR(10),
-- Cohort the signature belongs to. The badge artwork carries a season label
-- ("Nuptial Flight 2026"), so future artwork is a config change, not a migration.
ADD COLUMN IF NOT EXISTS code_of_hive_cohort VARCHAR(50);

-- Phase 2 placeholders for the Soulbound Token. Unused in MVP — no wallet
-- interaction or chain transaction happens at signing time.
ALTER TABLE goodhive.talents
ADD COLUMN IF NOT EXISTS code_of_hive_token_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS code_of_hive_token_chain VARCHAR(50),
ADD COLUMN IF NOT EXISTS code_of_hive_token_tx VARCHAR(255);

-- Partial index: the only query that matters is "who has signed", and signatories
-- are a small subset of the table.
CREATE INDEX IF NOT EXISTS idx_talents_code_of_hive_signed
  ON goodhive.talents (code_of_hive_signed)
  WHERE code_of_hive_signed = TRUE;
