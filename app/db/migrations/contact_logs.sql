-- Unified contact log for direct contacts and job requests.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS goodhive.contact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_user_id UUID NOT NULL,
  talent_user_id UUID NOT NULL,
  job_id UUID REFERENCES goodhive.job_offers(id) ON DELETE SET NULL,
  thread_id UUID REFERENCES goodhive.messenger_threads(id) ON DELETE SET NULL,
  job_request_id UUID REFERENCES goodhive.job_requests(id) ON DELETE SET NULL,
  actor_user_id UUID NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('company', 'talent')),
  contact_type TEXT NOT NULL CHECK (contact_type IN ('direct', 'job_request')),
  message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_logs_distinct_participants CHECK (company_user_id <> talent_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_logs_company_created
  ON goodhive.contact_logs(company_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_logs_talent_created
  ON goodhive.contact_logs(talent_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_logs_thread
  ON goodhive.contact_logs(thread_id);

CREATE INDEX IF NOT EXISTS idx_contact_logs_job_request
  ON goodhive.contact_logs(job_request_id);
