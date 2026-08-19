-- Admin Newsletter Broadcast
-- Adds opt-out tracking to users and a send log (campaigns + per-recipient status)
-- so admins can email a segment of talents/companies from /admin/newsletter.
--
-- All columns are nullable or defaulted so existing rows stay valid without a backfill.

ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS newsletter_opt_out BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS newsletter_opt_out_at TIMESTAMP WITH TIME ZONE;

-- Excluding opted-out users from every send is the hot query; keep the index tiny
-- since opt-outs are expected to be a small minority of the table.
CREATE INDEX IF NOT EXISTS idx_users_newsletter_opt_out
  ON goodhive.users (newsletter_opt_out)
  WHERE newsletter_opt_out = TRUE;

CREATE TABLE IF NOT EXISTS goodhive.newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    audience_filter JSONB NOT NULL,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'sending'
      CHECK (status IN ('sending', 'sent', 'failed')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS goodhive.newsletter_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES goodhive.newsletter_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'sent', 'failed')),
    error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_campaign
  ON goodhive.newsletter_recipients (campaign_id);
