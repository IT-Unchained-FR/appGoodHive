-- Check the current state of job_offers table
-- Run this query to see what values are stored for talent, mentor, and recruiter columns

SELECT 
    id,
    title,
    talent,
    mentor,
    recruiter,
    escrow_amount,
    published,
    in_saving_stage
FROM goodhive.job_offers 
ORDER BY id DESC 
LIMIT 10;

-- Check data types of the columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'goodhive' 
AND table_name = 'job_offers'
AND column_name IN ('talent', 'mentor', 'recruiter', 'escrow_amount');

-- Count jobs by their open-to status
SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN talent = 'true' THEN 1 END) as open_to_talents,
    COUNT(CASE WHEN mentor = 'true' THEN 1 END) as open_to_mentors,
    COUNT(CASE WHEN recruiter = 'true' THEN 1 END) as open_to_recruiters,
    COUNT(CASE WHEN escrow_amount = true THEN 1 END) as with_escrow,
    COUNT(CASE WHEN published = true THEN 1 END) as published_jobs
FROM goodhive.job_offers;
