-- Add creation timestamps for users, talents, and companies
-- Purpose: Track when accounts and profiles are created going forward

BEGIN;

-- Users: add created_at and backfill from last_active as best proxy
ALTER TABLE goodhive.users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE goodhive.users
SET created_at = COALESCE(created_at, last_active, NOW())
WHERE created_at IS NULL;

-- Talents: add created_at and backfill from last_active as best proxy
ALTER TABLE goodhive.talents
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE goodhive.talents
SET created_at = COALESCE(created_at, last_active, NOW())
WHERE created_at IS NULL;

-- Companies: add created_at and backfill to now()
ALTER TABLE goodhive.companies
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE goodhive.companies
SET created_at = COALESCE(created_at, NOW())
WHERE created_at IS NULL;

COMMIT;
