-- Migration: add application conversation tables and linkage
-- This creates one private thread per job application so company and talent
-- communication can move in-app without breaking the current application flow.

CREATE SCHEMA IF NOT EXISTS goodhive;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE goodhive.conversation_thread_status AS ENUM (
        'open',
        'awaiting_company',
        'awaiting_talent',
        'archived',
        'closed',
        'job_closed',
        'blocked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goodhive.conversation_message_type AS ENUM (
        'application_intro',
        'text',
        'system'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE goodhive.job_applications
    ADD COLUMN IF NOT EXISTS conversation_thread_id UUID;

CREATE TABLE IF NOT EXISTS goodhive.conversation_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_type TEXT NOT NULL DEFAULT 'job_application',
    job_id UUID NOT NULL REFERENCES goodhive.job_offers(id) ON DELETE CASCADE,
    company_user_id UUID NOT NULL,
    talent_user_id UUID NOT NULL,
    job_application_id INTEGER UNIQUE REFERENCES goodhive.job_applications(id) ON DELETE CASCADE,
    status goodhive.conversation_thread_status NOT NULL DEFAULT 'awaiting_company',
    created_by_user_id UUID NOT NULL,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_preview TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_threads_job_company_talent_type
    ON goodhive.conversation_threads(job_id, company_user_id, talent_user_id, thread_type);

CREATE INDEX IF NOT EXISTS idx_conversation_threads_company_last_message
    ON goodhive.conversation_threads(company_user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_threads_talent_last_message
    ON goodhive.conversation_threads(talent_user_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS goodhive.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES goodhive.conversation_threads(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('company', 'talent', 'admin', 'system')),
    message_type goodhive.conversation_message_type NOT NULL DEFAULT 'text',
    body TEXT NOT NULL,
    body_plaintext TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread_created_at
    ON goodhive.conversation_messages(thread_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_created_at
    ON goodhive.conversation_messages(sender_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS goodhive.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES goodhive.conversation_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    participant_role TEXT NOT NULL CHECK (participant_role IN ('company', 'talent', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    last_read_message_id UUID,
    last_read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_active
    ON goodhive.conversation_participants(user_id, is_active);

CREATE TABLE IF NOT EXISTS goodhive.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    thread_id UUID REFERENCES goodhive.conversation_threads(id) ON DELETE CASCADE,
    job_application_id INTEGER REFERENCES goodhive.job_applications(id) ON DELETE CASCADE,
    message_id UUID REFERENCES goodhive.conversation_messages(id) ON DELETE CASCADE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    emailed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_user_read_created
    ON goodhive.notification_events(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_events_thread_created
    ON goodhive.notification_events(thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_events_type_created
    ON goodhive.notification_events(event_type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_conversation_thread_id
    ON goodhive.job_applications(conversation_thread_id)
    WHERE conversation_thread_id IS NOT NULL;

ALTER TABLE goodhive.job_applications
    DROP CONSTRAINT IF EXISTS job_applications_conversation_thread_id_fkey;

ALTER TABLE goodhive.job_applications
    ADD CONSTRAINT job_applications_conversation_thread_id_fkey
    FOREIGN KEY (conversation_thread_id)
    REFERENCES goodhive.conversation_threads(id)
    ON DELETE SET NULL;

COMMENT ON TABLE goodhive.conversation_threads IS 'Private communication threads created from job applications';
COMMENT ON TABLE goodhive.conversation_messages IS 'Immutable message history for job-application conversations';
COMMENT ON TABLE goodhive.conversation_participants IS 'Authorized participants and read state per conversation thread';
COMMENT ON TABLE goodhive.notification_events IS 'In-app and email notification event log for conversation activity';

INSERT INTO goodhive.conversation_threads (
    thread_type,
    job_id,
    company_user_id,
    talent_user_id,
    job_application_id,
    status,
    created_by_user_id,
    last_message_at,
    last_message_preview,
    created_at,
    updated_at
)
SELECT
    'job_application',
    ja.job_id,
    ja.company_user_id,
    ja.applicant_user_id,
    ja.id,
    'awaiting_company',
    ja.applicant_user_id,
    COALESCE(ja.updated_at, ja.created_at, NOW()),
    LEFT(REGEXP_REPLACE(ja.cover_letter, '\s+', ' ', 'g'), 240),
    COALESCE(ja.created_at, NOW()),
    COALESCE(ja.updated_at, ja.created_at, NOW())
FROM goodhive.job_applications ja
WHERE NOT EXISTS (
    SELECT 1
    FROM goodhive.conversation_threads ct
    WHERE ct.job_application_id = ja.id
);

UPDATE goodhive.job_applications ja
SET conversation_thread_id = ct.id
FROM goodhive.conversation_threads ct
WHERE ct.job_application_id = ja.id
  AND ja.conversation_thread_id IS NULL;

INSERT INTO goodhive.conversation_messages (
    thread_id,
    sender_user_id,
    sender_role,
    message_type,
    body,
    body_plaintext,
    metadata,
    created_at
)
SELECT
    ct.id,
    ja.applicant_user_id,
    'talent',
    'application_intro',
    ja.cover_letter,
    ja.cover_letter,
    jsonb_build_object(
        'applicationId', ja.id,
        'jobId', ja.job_id,
        'jobTitle', jo.title
    ),
    COALESCE(ja.created_at, NOW())
FROM goodhive.conversation_threads ct
INNER JOIN goodhive.job_applications ja
    ON ja.id = ct.job_application_id
INNER JOIN goodhive.job_offers jo
    ON jo.id = ja.job_id
WHERE NOT EXISTS (
    SELECT 1
    FROM goodhive.conversation_messages cm
    WHERE cm.thread_id = ct.id
);

INSERT INTO goodhive.conversation_participants (
    thread_id,
    user_id,
    participant_role,
    is_active,
    is_blocked,
    last_read_message_id,
    last_read_at,
    created_at,
    updated_at
)
SELECT
    ct.id,
    ct.talent_user_id,
    'talent',
    true,
    false,
    latest_message.id,
    latest_message.created_at,
    COALESCE(ct.created_at, NOW()),
    COALESCE(ct.updated_at, ct.created_at, NOW())
FROM goodhive.conversation_threads ct
LEFT JOIN LATERAL (
    SELECT id, created_at
    FROM goodhive.conversation_messages
    WHERE thread_id = ct.id
    ORDER BY created_at DESC, id DESC
    LIMIT 1
) latest_message ON TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM goodhive.conversation_participants cp
    WHERE cp.thread_id = ct.id
      AND cp.user_id = ct.talent_user_id
);

INSERT INTO goodhive.conversation_participants (
    thread_id,
    user_id,
    participant_role,
    is_active,
    is_blocked,
    last_read_message_id,
    last_read_at,
    created_at,
    updated_at
)
SELECT
    ct.id,
    ct.company_user_id,
    'company',
    true,
    false,
    NULL,
    NULL,
    COALESCE(ct.created_at, NOW()),
    COALESCE(ct.updated_at, ct.created_at, NOW())
FROM goodhive.conversation_threads ct
WHERE NOT EXISTS (
    SELECT 1
    FROM goodhive.conversation_participants cp
    WHERE cp.thread_id = ct.id
      AND cp.user_id = ct.company_user_id
);
