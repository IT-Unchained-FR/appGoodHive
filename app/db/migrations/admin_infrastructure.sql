-- Admin settings key-value store
CREATE TABLE IF NOT EXISTS goodhive.admin_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

INSERT INTO goodhive.admin_settings (key, value) VALUES
  ('notifications', '{"emailNotifications":true,"approvalAlerts":true,"weeklyReports":false,"errorAlerts":true}'::jsonb),
  ('system',        '{"maintenanceMode":false,"allowRegistrations":true,"requireEmailVerification":true}'::jsonb),
  ('security',      '{"sessionTimeout":30,"maxLoginAttempts":5}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Admin audit log
CREATE TABLE IF NOT EXISTS goodhive.admin_audit_log (
  id          BIGSERIAL   PRIMARY KEY,
  admin_email TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON goodhive.admin_audit_log (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_idx
  ON goodhive.admin_audit_log (admin_email, created_at DESC);
