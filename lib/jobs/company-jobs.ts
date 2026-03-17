import sql from "@/lib/db";

import { JobReviewStatus, resolveJobReviewStatus } from "@/lib/jobs/review";

export interface CompanyDashboardJob {
  adminFeedback: string | null;
  applicationCount: number;
  assignmentCount: number;
  blockchainJobId: number | null;
  chain: string | null;
  id: string;
  mentorService: boolean;
  paymentTokenAddress: string | null;
  postedAt: string | null;
  published: boolean;
  recruiterService: boolean;
  reviewStatus: JobReviewStatus;
  talentService: boolean;
  title: string;
}

export async function getCompanyDashboardJobs(
  userId: string,
): Promise<CompanyDashboardJob[]> {
  const rows = await sql<{
    admin_feedback: string | null;
    application_count: number | string | null;
    assignment_count: number | string | null;
    block_id: number | null;
    chain: string | null;
    id: string;
    mentor: boolean | string | null;
    payment_token_address: string | null;
    posted_at: string | null;
    published: boolean | null;
    recruiter: boolean | string | null;
    review_status: string | null;
    talent: boolean | string | null;
    title: string | null;
  }[]>`
    SELECT
      jo.id,
      jo.title,
      jo.review_status,
      COALESCE(jo.published, false) AS published,
      jo.admin_feedback,
      jo.posted_at,
      jo.block_id,
      jo.payment_token_address,
      jo.chain,
      jo.talent,
      jo.recruiter,
      jo.mentor,
      COALESCE(app_counts.application_count, 0) AS application_count,
      0::int AS assignment_count
    FROM goodhive.job_offers jo
    LEFT JOIN (
      SELECT
        job_id,
        COUNT(*)::int AS application_count
      FROM goodhive.job_applications
      GROUP BY job_id
    ) app_counts ON app_counts.job_id = jo.id
    WHERE jo.user_id = ${userId}::uuid
    ORDER BY COALESCE(jo.created_at, jo.posted_at, NOW()) DESC
  `;

  return rows.map((row) => ({
    adminFeedback: row.admin_feedback ?? null,
    applicationCount: Number(row.application_count || 0),
    assignmentCount: Number(row.assignment_count || 0),
    blockchainJobId: row.block_id !== null && row.block_id !== undefined ? Number(row.block_id) : null,
    chain: row.chain ?? null,
    id: row.id,
    mentorService: row.mentor === true || row.mentor === "true",
    paymentTokenAddress: row.payment_token_address ?? null,
    postedAt: row.posted_at,
    published: row.published === true,
    recruiterService: row.recruiter === true || row.recruiter === "true",
    reviewStatus: resolveJobReviewStatus(row.review_status, row.published),
    talentService: row.talent === true || row.talent === "true",
    title: row.title?.trim() || "Untitled job",
  }));
}
