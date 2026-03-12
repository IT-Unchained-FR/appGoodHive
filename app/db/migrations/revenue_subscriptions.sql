-- Revenue: Company Subscriptions + Featured Profile Listings
-- Run on: goodhive-dev-database

BEGIN;

-- Company subscriptions (USDC on Polygon)
CREATE TABLE IF NOT EXISTS goodhive.company_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_user_id UUID NOT NULL,
  plan            VARCHAR(20) NOT NULL DEFAULT 'pro'
                  CHECK (plan IN ('pro', 'enterprise')),
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'expired', 'cancelled')),
  tx_hash         VARCHAR(100),
  amount_usdc     NUMERIC(10, 2) NOT NULL,
  chain           VARCHAR(30) NOT NULL DEFAULT 'polygon',
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company
  ON goodhive.company_subscriptions(company_user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires
  ON goodhive.company_subscriptions(expires_at);

-- Featured talent profile listings (talent pays USDC to be promoted)
CREATE TABLE IF NOT EXISTS goodhive.featured_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_user_id  UUID NOT NULL,
  tx_hash         VARCHAR(100),
  amount_usdc     NUMERIC(10, 2) NOT NULL,
  chain           VARCHAR(30) NOT NULL DEFAULT 'polygon',
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'expired')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_talent
  ON goodhive.featured_profiles(talent_user_id, status);
CREATE INDEX IF NOT EXISTS idx_featured_expires
  ON goodhive.featured_profiles(expires_at);
CREATE INDEX IF NOT EXISTS idx_featured_active
  ON goodhive.featured_profiles(status, expires_at)
  WHERE status = 'active';

COMMIT;
