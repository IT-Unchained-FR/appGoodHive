-- Rollback Migration: Remove deferred and rejected statuses
-- Date: 2026-01-09
-- Description: Reverts the add_deferred_rejected_statuses.sql migration

-- WARNING: This will remove the new columns and revert statuses back to pending/approved only
-- Any users with 'deferred' or 'rejected' status will be set to 'pending'

-- Step 1: Update any deferred/rejected statuses back to pending (data migration)
UPDATE goodhive.users SET talent_status = 'pending' WHERE talent_status IN ('deferred', 'rejected');
UPDATE goodhive.users SET mentor_status = 'pending' WHERE mentor_status IN ('deferred', 'rejected');
UPDATE goodhive.users SET recruiter_status = 'pending' WHERE recruiter_status IN ('deferred', 'rejected');

-- Step 2: Drop indexes
DROP INDEX IF EXISTS goodhive.idx_users_talent_status;
DROP INDEX IF EXISTS goodhive.idx_users_mentor_status;
DROP INDEX IF EXISTS goodhive.idx_users_recruiter_status;
DROP INDEX IF EXISTS goodhive.idx_users_talent_deferred_until;
DROP INDEX IF EXISTS goodhive.idx_users_mentor_deferred_until;
DROP INDEX IF EXISTS goodhive.idx_users_recruiter_deferred_until;

-- Step 3: Drop new columns
ALTER TABLE goodhive.users DROP COLUMN IF EXISTS talent_deferred_until;
ALTER TABLE goodhive.users DROP COLUMN IF EXISTS mentor_deferred_until;
ALTER TABLE goodhive.users DROP COLUMN IF EXISTS recruiter_deferred_until;
ALTER TABLE goodhive.users DROP COLUMN IF EXISTS talent_status_reason;
ALTER TABLE goodhive.users DROP COLUMN IF EXISTS mentor_status_reason;
ALTER TABLE goodhive.users DROP COLUMN IF EXISTS recruiter_status_reason;
ALTER TABLE goodhive.users DROP COLUMN IF EXISTS talent_status_updated_at;
ALTER TABLE goodhive.users DROP COLUMN IF EXISTS mentor_status_updated_at;
ALTER TABLE goodhive.users DROP COLUMN IF EXISTS recruiter_status_updated_at;

-- Step 4: Restore original CHECK constraints (only pending and approved)
ALTER TABLE goodhive.users DROP CONSTRAINT IF EXISTS check_talent_status;
ALTER TABLE goodhive.users DROP CONSTRAINT IF EXISTS check_mentor_status;
ALTER TABLE goodhive.users DROP CONSTRAINT IF EXISTS check_recruiter_status;

ALTER TABLE goodhive.users
ADD CONSTRAINT check_talent_status
CHECK (talent_status IN ('pending', 'approved'));

ALTER TABLE goodhive.users
ADD CONSTRAINT check_mentor_status
CHECK (mentor_status IN ('pending', 'approved'));

ALTER TABLE goodhive.users
ADD CONSTRAINT check_recruiter_status
CHECK (recruiter_status IN ('pending', 'approved'));

-- Rollback complete!
