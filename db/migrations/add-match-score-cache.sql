CREATE TABLE IF NOT EXISTS goodhive.match_score_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  score INTEGER,
  reasons JSONB DEFAULT '[]',
  gaps JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, talent_id)
);

CREATE INDEX IF NOT EXISTS idx_match_score_cache_lookup
  ON goodhive.match_score_cache(job_id, talent_id, expires_at);
