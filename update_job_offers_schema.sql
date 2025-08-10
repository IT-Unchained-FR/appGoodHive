-- Migration to update job_offers table to use proper boolean types
-- This will convert the character varying columns to boolean

-- Step 1: Add new boolean columns
ALTER TABLE goodhive.job_offers 
ADD COLUMN talent_boolean BOOLEAN DEFAULT false,
ADD COLUMN mentor_boolean BOOLEAN DEFAULT false,
ADD COLUMN recruiter_boolean BOOLEAN DEFAULT false;

-- Step 2: Update the new columns with data from existing columns
UPDATE goodhive.job_offers 
SET 
    talent_boolean = CASE WHEN talent = 'true' THEN true ELSE false END,
    mentor_boolean = CASE WHEN mentor = 'true' THEN true ELSE false END,
    recruiter_boolean = CASE WHEN recruiter = 'true' THEN true ELSE false END;

-- Step 3: Drop the old character varying columns
ALTER TABLE goodhive.job_offers 
DROP COLUMN talent,
DROP COLUMN mentor,
DROP COLUMN recruiter;

-- Step 4: Rename the new boolean columns to the original names
ALTER TABLE goodhive.job_offers 
RENAME COLUMN talent_boolean TO talent;

ALTER TABLE goodhive.job_offers 
RENAME COLUMN mentor_boolean TO mentor;

ALTER TABLE goodhive.job_offers 
RENAME COLUMN recruiter_boolean TO recruiter;

-- Step 5: Add NOT NULL constraints
ALTER TABLE goodhive.job_offers 
ALTER COLUMN talent SET NOT NULL,
ALTER COLUMN mentor SET NOT NULL,
ALTER COLUMN recruiter SET NOT NULL;

-- Step 6: Set default values
ALTER TABLE goodhive.job_offers 
ALTER COLUMN talent SET DEFAULT false,
ALTER COLUMN mentor SET DEFAULT false,
ALTER COLUMN recruiter SET DEFAULT false;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'goodhive' 
AND table_name = 'job_offers'
AND column_name IN ('talent', 'mentor', 'recruiter');
