-- Maintenance Script: Sync Company Published Status
-- Date: 2025-12-14
-- Description: Ensures published status matches approved status for all companies
-- Run this script periodically or after manual data changes to maintain consistency

-- Ensure published status matches approved status
UPDATE goodhive.companies
SET published = approved
WHERE published != approved OR published IS NULL;

-- Report any inconsistencies found and fixed
SELECT
  user_id,
  designation as company_name,
  approved,
  published,
  inreview,
  created_at
FROM goodhive.companies
WHERE published != approved
ORDER BY created_at DESC;

-- Summary report of current company status distribution
SELECT
  approved,
  published,
  COUNT(*) as count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM goodhive.companies)), 2) as percentage
FROM goodhive.companies
GROUP BY approved, published
ORDER BY approved DESC, published DESC;

-- Companies that should be reviewed (edge cases)
-- Companies that are approved but not published (should be rare after auto-publish implementation)
SELECT
  user_id,
  designation as company_name,
  email,
  approved,
  published,
  inreview,
  created_at
FROM goodhive.companies
WHERE approved = true AND published = false
ORDER BY created_at DESC;

-- Companies that are published but not approved (data inconsistency)
SELECT
  user_id,
  designation as company_name,
  email,
  approved,
  published,
  inreview,
  created_at
FROM goodhive.companies
WHERE published = true AND approved = false
ORDER BY created_at DESC;
