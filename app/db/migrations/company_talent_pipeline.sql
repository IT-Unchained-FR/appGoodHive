-- Company Talent Pipeline (Kanban)
-- Run on: goodhive-dev-database

BEGIN;

CREATE TABLE IF NOT EXISTS goodhive.company_talent_pipeline (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL,
  talent_id    UUID NOT NULL,
  stage        VARCHAR(20) NOT NULL DEFAULT 'shortlisted'
               CHECK (stage IN ('shortlisted', 'contacted', 'interviewing', 'hired', 'rejected')),
  notes        TEXT,
  job_id       UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_company_stage ON goodhive.company_talent_pipeline(company_id, stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_talent       ON goodhive.company_talent_pipeline(talent_id);

-- Unique: one entry per company+talent when no job specified
CREATE UNIQUE INDEX IF NOT EXISTS pipeline_unique_no_job
  ON goodhive.company_talent_pipeline(company_id, talent_id)
  WHERE job_id IS NULL;

-- Unique: one entry per company+talent+job when job is specified
CREATE UNIQUE INDEX IF NOT EXISTS pipeline_unique_with_job
  ON goodhive.company_talent_pipeline(company_id, talent_id, job_id)
  WHERE job_id IS NOT NULL;

COMMIT;
