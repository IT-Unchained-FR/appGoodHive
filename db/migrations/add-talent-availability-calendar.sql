ALTER TABLE goodhive.talents
  ADD COLUMN IF NOT EXISTS availability_status TEXT,
  ADD COLUMN IF NOT EXISTS availability_updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE goodhive.talents
SET availability_status = CASE
  WHEN availability = true OR LOWER(CAST(availability AS TEXT)) = 'available' THEN 'immediately'
  ELSE 'not_looking'
END
WHERE availability_status IS NULL;

ALTER TABLE goodhive.talents
  ALTER COLUMN availability_status SET DEFAULT 'not_looking',
  ALTER COLUMN availability_updated_at SET DEFAULT NOW();

DO $$
BEGIN
  ALTER TABLE goodhive.talents
    ADD CONSTRAINT talents_availability_status_check
    CHECK (
      availability_status IN (
        'immediately',
        'weeks_2',
        'weeks_4',
        'months_3',
        'not_looking'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS goodhive.talent_availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES goodhive.users(userid) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('available', 'busy')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_talent_availability_blocks_talent_start
  ON goodhive.talent_availability_blocks(talent_id, start_date);
