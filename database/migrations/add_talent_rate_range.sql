-- Add min/max rate range fields for talents

ALTER TABLE goodhive.talents
ADD COLUMN IF NOT EXISTS min_rate NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS max_rate NUMERIC(10,2);

-- Backfill from legacy rate when possible
UPDATE goodhive.talents
SET min_rate = COALESCE(min_rate, NULLIF(rate, '')::NUMERIC),
    max_rate = COALESCE(max_rate, NULLIF(rate, '')::NUMERIC)
WHERE (min_rate IS NULL OR max_rate IS NULL)
  AND rate IS NOT NULL
  AND rate <> '';
