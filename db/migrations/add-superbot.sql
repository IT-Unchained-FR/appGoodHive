-- Migration: Add superbot tables (sessions, messages, leads, handoffs, events, content items)

CREATE SCHEMA IF NOT EXISTS goodhive;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS goodhive.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,
    telegram_chat_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    flow TEXT,
    step TEXT,
    fields JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (telegram_chat_id)
);

CREATE TABLE IF NOT EXISTS goodhive.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES goodhive.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    text TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created_at
    ON goodhive.chat_messages(session_id, created_at);

CREATE TABLE IF NOT EXISTS goodhive.consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES goodhive.chat_sessions(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_session_created_at
    ON goodhive.consents(session_id, created_at);

CREATE TABLE IF NOT EXISTS goodhive.superbot_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES goodhive.chat_sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    score INTEGER NOT NULL DEFAULT 0,
    fields JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_superbot_leads_session_type
    ON goodhive.superbot_leads(session_id, type);

CREATE TABLE IF NOT EXISTS goodhive.handoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES goodhive.superbot_leads(id) ON DELETE CASCADE,
    assigned_to TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handoffs_lead_created_at
    ON goodhive.handoffs(lead_id, created_at);

CREATE TABLE IF NOT EXISTS goodhive.superbot_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES goodhive.chat_sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_superbot_events_session_created_at
    ON goodhive.superbot_events(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_superbot_events_type_created_at
    ON goodhive.superbot_events(type, created_at);

CREATE TABLE IF NOT EXISTS goodhive.content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    cta_label TEXT NOT NULL,
    cta_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_items_type_status
    ON goodhive.content_items(type, status);

COMMENT ON TABLE goodhive.chat_sessions IS 'Superbot chat sessions across channels';
COMMENT ON TABLE goodhive.chat_messages IS 'Superbot message transcript';
COMMENT ON TABLE goodhive.consents IS 'User consent records for superbot channels';
COMMENT ON TABLE goodhive.superbot_leads IS 'Superbot lead scoring records';
COMMENT ON TABLE goodhive.handoffs IS 'Superbot handoff tracking';
COMMENT ON TABLE goodhive.superbot_events IS 'Superbot analytics events';
COMMENT ON TABLE goodhive.content_items IS 'Superbot content items used for scripted prompts';
