-- Plan-42: Add job review lifecycle status to job_offers
-- review_status values: draft | pending_review | approved | rejected | active | closed

ALTER TABLE goodhive.job_offers
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Backfill: existing published jobs = approved, others = draft
UPDATE goodhive.job_offers
SET review_status = CASE
  WHEN published = true THEN 'approved'
  ELSE 'draft'
END
WHERE review_status = 'draft';

CREATE INDEX IF NOT EXISTS idx_job_offers_review_status
  ON goodhive.job_offers(review_status);
