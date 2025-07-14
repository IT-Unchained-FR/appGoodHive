-- Add new columns to users table
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS okto_wallet_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS mentor_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS recruiter_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS talent_status VARCHAR(50) DEFAULT 'pending';

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON goodhive.users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_okto_wallet_address ON goodhive.users(okto_wallet_address); 