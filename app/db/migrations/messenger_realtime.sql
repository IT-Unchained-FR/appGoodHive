-- Messenger real-time: pg_notify trigger + email cooldown table
-- Run on dev first, then prod. All statements are non-destructive (CREATE OR REPLACE / CREATE TABLE IF NOT EXISTS).

-- 1. Function: fires pg_notify on every new message insert
--    Notifies two channel types:
--      messenger_thread:{thread_id}  — per-thread SSE subscribers (open chat)
--      messenger_user:{user_id}      — per-user SSE subscribers (nav unread badge)
CREATE OR REPLACE FUNCTION goodhive.notify_new_messenger_message()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  payload := json_build_object(
    'message_id',     NEW.id,
    'thread_id',      NEW.thread_id,
    'sender_user_id', NEW.sender_user_id,
    'message_type',   NEW.message_type,
    'message_text',   LEFT(NEW.message_text, 500),
    'attachment_url', NEW.attachment_url,
    'created_at',     NEW.created_at
  )::text;

  -- Notify per-thread channel (active chat window subscribers)
  PERFORM pg_notify('messenger_thread:' || NEW.thread_id::text, payload);

  -- Notify the company participant if they are NOT the sender (unread badge)
  PERFORM pg_notify('messenger_user:' || t.company_user_id::text, payload)
  FROM goodhive.messenger_threads t
  WHERE t.id = NEW.thread_id
    AND t.company_user_id <> NEW.sender_user_id;

  -- Notify the talent participant if they are NOT the sender (unread badge)
  PERFORM pg_notify('messenger_user:' || t.talent_user_id::text, payload)
  FROM goodhive.messenger_threads t
  WHERE t.id = NEW.thread_id
    AND t.talent_user_id <> NEW.sender_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger: attach function to messenger_messages INSERT
DROP TRIGGER IF EXISTS trg_notify_new_messenger_message ON goodhive.messenger_messages;
CREATE TRIGGER trg_notify_new_messenger_message
  AFTER INSERT ON goodhive.messenger_messages
  FOR EACH ROW EXECUTE FUNCTION goodhive.notify_new_messenger_message();

-- 3. Email cooldown table: prevents email notification spam
--    One row per (thread, recipient). Updated after each email send.
--    API checks: skip email if last_sent_at > NOW() - INTERVAL '5 minutes'
CREATE TABLE IF NOT EXISTS goodhive.messenger_email_cooldowns (
  thread_id    UUID        NOT NULL,
  user_id      UUID        NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);
