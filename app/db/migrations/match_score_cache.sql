-- Match Score Cache Table
-- Stores AI-computed match scores between a job and a talent profile.
-- Scores are cached for 1 hour (controlled by expires_at) to reduce Gemini API calls.
--
-- Referenced by:
--   app/api/ai/match-score/route.ts
--   app/lib/ai/match-score.ts

CREATE TABLE IF NOT EXISTS goodhive.match_score_cache (
  job_id      UUID        NOT NULL,
  talent_id   UUID        NOT NULL,
  score       SMALLINT,                        -- 0–100
  reasons     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  gaps        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,

  CONSTRAINT match_score_cache_pkey PRIMARY KEY (job_id, talent_id),
  CONSTRAINT match_score_cache_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

-- Index to allow fast lookups for a specific talent (company browsing several jobs)
CREATE INDEX IF NOT EXISTS idx_match_score_cache_talent
  ON goodhive.match_score_cache (talent_id);

-- Index to allow fast expiration sweeps / TTL cleanup
CREATE INDEX IF NOT EXISTS idx_match_score_cache_expires
  ON goodhive.match_score_cache (expires_at);

-- Optional: auto-delete expired rows
-- (Alternative: run a periodic cron job instead)
-- Comment this out if you prefer to keep historical data.
-- CREATE RULE match_score_cache_auto_purge AS
--   ON INSERT TO goodhive.match_score_cache
--   DO ALSO DELETE FROM goodhive.match_score_cache WHERE expires_at < NOW();
