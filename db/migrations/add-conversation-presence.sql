-- Migration: add conversation presence and typing support
-- This stores per-thread transient state so company/talent chat can feel live
-- without introducing a separate realtime service.

ALTER TABLE goodhive.conversation_participants
    ADD COLUMN IF NOT EXISTS typing_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS typing_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversation_participants_thread_typing
    ON goodhive.conversation_participants(thread_id, typing_expires_at DESC)
    WHERE typing_expires_at IS NOT NULL;
