-- Create the OTP table in the goodhive schema
CREATE TABLE IF NOT EXISTS goodhive.otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT otps_email_key UNIQUE (email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otps_email ON goodhive.otps (email);

-- Comment on the table
COMMENT ON TABLE goodhive.otps IS 'Stores one-time passwords for email authentication';
