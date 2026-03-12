-- Plan-42: Notification system
-- type values: job_approved | job_rejected | assignment_request | assignment_accepted
--              assignment_rejected | application_received | mission_complete_requested
--              mission_completed | payout_released | new_message

CREATE TABLE IF NOT EXISTS goodhive.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON goodhive.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON goodhive.notifications(user_id, read);
