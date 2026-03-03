ALTER TABLE goodhive.talents
ADD COLUMN IF NOT EXISTS resume_experience TEXT,
ADD COLUMN IF NOT EXISTS resume_education TEXT,
ADD COLUMN IF NOT EXISTS resume_certifications TEXT,
ADD COLUMN IF NOT EXISTS resume_projects TEXT,
ADD COLUMN IF NOT EXISTS resume_languages TEXT;
