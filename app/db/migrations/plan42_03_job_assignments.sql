-- Plan-42: Job assignments — company assigns talent to a job
-- status values: pending | accepted | rejected | active | completed | cancelled

CREATE TABLE IF NOT EXISTS goodhive.job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES goodhive.job_offers(id) ON DELETE CASCADE,
  talent_user_id UUID NOT NULL,
  company_user_id UUID NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  notes TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  company_confirmed_complete BOOLEAN NOT NULL DEFAULT FALSE,
  talent_confirmed_complete BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(job_id, talent_user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id
  ON goodhive.job_assignments(job_id);

CREATE INDEX IF NOT EXISTS idx_job_assignments_talent
  ON goodhive.job_assignments(talent_user_id);

CREATE INDEX IF NOT EXISTS idx_job_assignments_company
  ON goodhive.job_assignments(company_user_id);
