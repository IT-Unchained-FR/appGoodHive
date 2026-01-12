-- Migration: Add deferred and rejected statuses for talent, mentor, and recruiter roles
-- Date: 2026-01-09
-- Description: Adds 'deferred' and 'rejected' statuses to all role status fields,
--              plus tracking fields for deferred dates and rejection reasons

-- Step 1: Drop existing CHECK constraints
ALTER TABLE goodhive.users DROP CONSTRAINT IF EXISTS check_talent_status;
ALTER TABLE goodhive.users DROP CONSTRAINT IF EXISTS check_mentor_status;
ALTER TABLE goodhive.users DROP CONSTRAINT IF EXISTS check_recruiter_status;

-- Step 2: Add new CHECK constraints with all 4 statuses: pending, approved, rejected, deferred
ALTER TABLE goodhive.users
ADD CONSTRAINT check_talent_status
CHECK (talent_status IN ('pending', 'approved', 'rejected', 'deferred'));

ALTER TABLE goodhive.users
ADD CONSTRAINT check_mentor_status
CHECK (mentor_status IN ('pending', 'approved', 'rejected', 'deferred'));

ALTER TABLE goodhive.users
ADD CONSTRAINT check_recruiter_status
CHECK (recruiter_status IN ('pending', 'approved', 'rejected', 'deferred'));

-- Step 3: Add deferred_until date fields (when they can reapply)
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS talent_deferred_until TIMESTAMP WITH TIME ZONE;

ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS mentor_deferred_until TIMESTAMP WITH TIME ZONE;

ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS recruiter_deferred_until TIMESTAMP WITH TIME ZONE;

-- Step 4: Add rejection/deferral reason fields
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS talent_status_reason TEXT;

ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS mentor_status_reason TEXT;

ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS recruiter_status_reason TEXT;

-- Step 5: Add status_updated_at fields to track when status was last changed
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS talent_status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS mentor_status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS recruiter_status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 6: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_talent_status ON goodhive.users(talent_status);
CREATE INDEX IF NOT EXISTS idx_users_mentor_status ON goodhive.users(mentor_status);
CREATE INDEX IF NOT EXISTS idx_users_recruiter_status ON goodhive.users(recruiter_status);
CREATE INDEX IF NOT EXISTS idx_users_talent_deferred_until ON goodhive.users(talent_deferred_until) WHERE talent_status = 'deferred';
CREATE INDEX IF NOT EXISTS idx_users_mentor_deferred_until ON goodhive.users(mentor_deferred_until) WHERE mentor_status = 'deferred';
CREATE INDEX IF NOT EXISTS idx_users_recruiter_deferred_until ON goodhive.users(recruiter_deferred_until) WHERE recruiter_status = 'deferred';

-- Step 7: Add helpful comments
COMMENT ON COLUMN goodhive.users.talent_status IS 'Status: pending, approved, rejected, deferred';
COMMENT ON COLUMN goodhive.users.mentor_status IS 'Status: pending, approved, rejected, deferred';
COMMENT ON COLUMN goodhive.users.recruiter_status IS 'Status: pending, approved, rejected, deferred';
COMMENT ON COLUMN goodhive.users.talent_deferred_until IS 'Date when user can reapply for talent role (if deferred)';
COMMENT ON COLUMN goodhive.users.mentor_deferred_until IS 'Date when user can reapply for mentor role (if deferred)';
COMMENT ON COLUMN goodhive.users.recruiter_deferred_until IS 'Date when user can reapply for recruiter role (if deferred)';
COMMENT ON COLUMN goodhive.users.talent_status_reason IS 'Admin notes for rejection/deferral reason';
COMMENT ON COLUMN goodhive.users.mentor_status_reason IS 'Admin notes for rejection/deferral reason';
COMMENT ON COLUMN goodhive.users.recruiter_status_reason IS 'Admin notes for rejection/deferral reason';

-- Migration complete!
-- To rollback, run: rollback_deferred_rejected_statuses.sql
