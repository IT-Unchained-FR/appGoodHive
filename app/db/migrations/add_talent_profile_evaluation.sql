ALTER TABLE goodhive.talents
  ADD COLUMN IF NOT EXISTS cv_text TEXT,
  ADD COLUMN IF NOT EXISTS ai_profile_summary JSONB,
  ADD COLUMN IF NOT EXISTS ai_profile_summary_version SMALLINT,
  ADD COLUMN IF NOT EXISTS ai_profile_evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_profile_stale BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_talents_needs_evaluation
  ON goodhive.talents (approved)
  WHERE approved = true AND (ai_profile_evaluated_at IS NULL OR ai_profile_stale = true);
