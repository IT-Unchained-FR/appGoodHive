BEGIN;

CREATE TABLE IF NOT EXISTS goodhive.recruiter_search_history (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id   UUID        NOT NULL,
  job_description TEXT       NOT NULL,
  candidates     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  scored_count   INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_search_history_recruiter
  ON goodhive.recruiter_search_history(recruiter_id, created_at DESC);

COMMIT;
