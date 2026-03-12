-- Superbot v2: Career Coach persistent conversation history
-- Run on: goodhive-dev-database (main GoodHive DB)

BEGIN;

CREATE TABLE IF NOT EXISTS goodhive.superbot_coach_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_user_created
  ON goodhive.superbot_coach_messages(user_id, created_at DESC);

COMMIT;
