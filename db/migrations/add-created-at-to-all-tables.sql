-- Add created_at to all tables that don't have it
-- Migration created: 2025-11-29
-- Backfills existing records with November 28, 2025
BEGIN;

-- Users table
ALTER TABLE goodhive.users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE goodhive.users
SET created_at = COALESCE(created_at, last_active, '2025-11-28 00:00:00+00'::TIMESTAMPTZ)
WHERE created_at IS NULL;

-- Talents table
ALTER TABLE goodhive.talents
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE goodhive.talents
SET created_at = COALESCE(created_at, last_active, '2025-11-28 00:00:00+00'::TIMESTAMPTZ)
WHERE created_at IS NULL;

-- Companies table
ALTER TABLE goodhive.companies
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE goodhive.companies
SET created_at = COALESCE(created_at, '2025-11-28 00:00:00+00'::TIMESTAMPTZ)
WHERE created_at IS NULL;

-- Admins table
ALTER TABLE goodhive.admin
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE goodhive.admin
SET created_at = COALESCE(created_at, '2025-11-28 00:00:00+00'::TIMESTAMPTZ)
WHERE created_at IS NULL;

COMMIT;
