-- Recruiter daily talent watchlist
-- One row per recruiter — stores the saved search description and when it was last run

CREATE TABLE IF NOT EXISTS goodhive.recruiter_watchlist (
  recruiter_id  UUID PRIMARY KEY,
  description   TEXT                     NOT NULL,
  last_run_at   TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE goodhive.recruiter_watchlist IS
  'Stores each recruiter''s standing talent-search description that AI auto-refreshes daily.';
