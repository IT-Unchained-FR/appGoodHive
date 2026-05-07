BEGIN;

-- Allow 'link_click' as a valid contact_type
ALTER TABLE goodhive.contact_logs
  DROP CONSTRAINT IF EXISTS contact_logs_contact_type_check;

ALTER TABLE goodhive.contact_logs
  ADD CONSTRAINT contact_logs_contact_type_check
  CHECK (contact_type IN ('direct', 'job_request', 'link_click'));

-- Add new nullable columns (backward-compatible with existing rows)
ALTER TABLE goodhive.contact_logs
  ADD COLUMN IF NOT EXISTS link_type   TEXT CHECK (link_type IN ('github', 'linkedin', 'twitter', 'portfolio', 'website')),
  ADD COLUMN IF NOT EXISTS link_url    TEXT,
  ADD COLUMN IF NOT EXISTS source_page TEXT;

-- Index to speed up admin queries filtering by contact_type
CREATE INDEX IF NOT EXISTS idx_contact_logs_contact_type
  ON goodhive.contact_logs (contact_type);

COMMIT;
