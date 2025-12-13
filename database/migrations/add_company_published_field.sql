-- Migration: Add published column to companies table
-- Date: 2025-12-14
-- Description: Add a published boolean field to control visibility of companies and their content on the public site.
-- When a company is unpublished, all its jobs, profiles, and related content will be hidden from public view.

-- Add published column to companies table
ALTER TABLE goodhive.companies
ADD COLUMN published BOOLEAN DEFAULT false NOT NULL;

-- Create index for performance optimization
CREATE INDEX idx_companies_published ON goodhive.companies(published);

-- Add documentation comment
COMMENT ON COLUMN goodhive.companies.published IS 'Whether company profile and jobs are visible on public site. Auto-set to true when approved, false when rejected.';

-- Migrate existing data: Set published=true for all currently approved companies
UPDATE goodhive.companies
SET published = true
WHERE approved = true;

-- Set published=false for all unapproved companies
UPDATE goodhive.companies
SET published = false
WHERE approved = false OR approved IS NULL;

-- Verify migration results
SELECT
  approved,
  published,
  COUNT(*) as count
FROM goodhive.companies
GROUP BY approved, published
ORDER BY approved, published;
