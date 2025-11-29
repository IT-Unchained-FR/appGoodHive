-- Add indexes for admin panel filtering performance
-- Migration created: 2025-11-29
BEGIN;

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_created_at ON goodhive.users(created_at DESC);

-- Talents table
CREATE INDEX IF NOT EXISTS idx_talents_created_at ON goodhive.talents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_talents_approved ON goodhive.talents(approved);
CREATE INDEX IF NOT EXISTS idx_talents_in_review ON goodhive.talents(inReview);

-- Companies table
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON goodhive.companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_approved ON goodhive.companies(approved);
CREATE INDEX IF NOT EXISTS idx_companies_in_review ON goodhive.companies(inReview);

-- Jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON goodhive.job_offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_published ON goodhive.job_offers(published);

-- Admins table
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON goodhive.admin(created_at DESC);

COMMIT;
