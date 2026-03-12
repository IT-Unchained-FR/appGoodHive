import sql from "@/lib/db";

import { JobReviewStatus, resolveJobReviewStatus } from "@/lib/jobs/review";

export interface CompanyDashboardJob {
  adminFeedback: string | null;
  applicationCount: number;
  assignmentCount: number;
  id: string;
  postedAt: string | null;
  published: boolean;
  reviewStatus: JobReviewStatus;
  title: string;
}

export async function getCompanyDashboardJobs(
  userId: string,
): Promise<CompanyDashboardJob[]> {
  const rows = await sql<{
    admin_feedback: string | null;
    application_count: number | string | null;
    assignment_count: number | string | null;
    id: string;
    posted_at: string | null;
    published: boolean | null;
    review_status: string | null;
    title: string | null;
  }[]>`
    SELECT
      jo.id,
      jo.title,
      jo.review_status,
      COALESCE(jo.published, false) AS published,
      jo.admin_feedback,
      jo.posted_at,
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
    id: row.id,
    postedAt: row.posted_at,
    published: row.published === true,
    reviewStatus: resolveJobReviewStatus(row.review_status, row.published),
    title: row.title?.trim() || "Untitled job",
  }));
}
