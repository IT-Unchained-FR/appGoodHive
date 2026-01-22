-- Migration: Add job applications table
-- This enables persistent storage of job applications for tracking

-- Create enum for application status
DO $$ BEGIN
    CREATE TYPE goodhive.application_status AS ENUM ('new', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the job_applications table
CREATE TABLE IF NOT EXISTS goodhive.job_applications (
    id SERIAL PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES goodhive.job_offers(id) ON DELETE CASCADE,
    applicant_user_id UUID NOT NULL,
    company_user_id UUID NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    cover_letter TEXT NOT NULL,
    portfolio_link VARCHAR(500),
    status goodhive.application_status DEFAULT 'new',
    internal_notes TEXT,
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (job_id, applicant_user_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON goodhive.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company_user_id ON goodhive.job_applications(company_user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_user_id ON goodhive.job_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON goodhive.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON goodhive.job_applications(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE goodhive.job_applications IS 'Stores job applications submitted by talents to company job postings';
