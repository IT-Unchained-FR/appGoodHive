-- Migration: Add job request + messenger foundation for Upwork-like proposal and chat workflows

CREATE SCHEMA IF NOT EXISTS goodhive;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Job requests sent between companies and talents (parallel to existing job applications)
CREATE TABLE IF NOT EXISTS goodhive.job_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_user_id UUID NOT NULL,
    talent_user_id UUID NOT NULL,
    job_id UUID REFERENCES goodhive.job_offers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    request_message TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'withdrawn', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_requests_company_created_at
    ON goodhive.job_requests(company_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_requests_talent_created_at
    ON goodhive.job_requests(talent_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_requests_status
    ON goodhive.job_requests(status);

-- Conversation threads that can be attached to applications, requests, jobs, or direct messages
CREATE TABLE IF NOT EXISTS goodhive.messenger_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_user_id UUID NOT NULL,
    talent_user_id UUID NOT NULL,
    thread_type TEXT NOT NULL DEFAULT 'direct' CHECK (thread_type IN ('direct', 'application', 'request', 'job')),
    job_id UUID REFERENCES goodhive.job_offers(id) ON DELETE SET NULL,
    job_application_id INTEGER REFERENCES goodhive.job_applications(id) ON DELETE SET NULL,
    job_request_id UUID REFERENCES goodhive.job_requests(id) ON DELETE SET NULL,
    created_by_user_id UUID NOT NULL,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_application_id),
    UNIQUE (job_request_id)
);

CREATE INDEX IF NOT EXISTS idx_messenger_threads_company_updated_at
    ON goodhive.messenger_threads(company_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messenger_threads_talent_updated_at
    ON goodhive.messenger_threads(talent_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messenger_threads_job_id
    ON goodhive.messenger_threads(job_id);

CREATE INDEX IF NOT EXISTS idx_messenger_threads_last_message_at
    ON goodhive.messenger_threads(last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS goodhive.messenger_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES goodhive.messenger_threads(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    message_text TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (length(trim(message_text)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_messenger_messages_thread_created_at
    ON goodhive.messenger_messages(thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messenger_messages_sender_created_at
    ON goodhive.messenger_messages(sender_user_id, created_at DESC);

-- Per-user read checkpoint per thread (enables unread counts)
CREATE TABLE IF NOT EXISTS goodhive.messenger_thread_reads (
    thread_id UUID NOT NULL REFERENCES goodhive.messenger_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_messenger_thread_reads_user_id
    ON goodhive.messenger_thread_reads(user_id, updated_at DESC);

COMMENT ON TABLE goodhive.job_requests IS 'Request/proposal records between companies and talents';
COMMENT ON TABLE goodhive.messenger_threads IS 'Conversation threads for job applications, requests, jobs, and direct messaging';
COMMENT ON TABLE goodhive.messenger_messages IS 'Thread messages exchanged between participants';
COMMENT ON TABLE goodhive.messenger_thread_reads IS 'Last read checkpoint per user and thread';
