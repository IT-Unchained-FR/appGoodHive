import { redirect } from "next/navigation";

import JobsManagementClient from "@/app/companies/dashboard/jobs/JobsManagementClient";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { getCompanyDashboardJobs } from "@/lib/jobs/company-jobs";
import { isCompanyHidden } from "@/lib/jobs/company-onboarding";

export const dynamic = "force-dynamic";

interface JobsDashboardPageProps {
  searchParams?: {
    activate?: string;
    jobId?: string;
  };
}

export default async function JobsDashboardPage({
  searchParams,
}: JobsDashboardPageProps) {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.user_id ?? null;

  if (!userId) {
    redirect("/auth/login?redirect=%2Fcompanies%2Fdashboard%2Fjobs");
  }

  const companyRows = await sql<{
    approved: boolean | null;
    published: boolean | null;
    user_id: string;
  }[]>`
    SELECT user_id, approved, published
    FROM goodhive.companies
    WHERE user_id = ${userId}::uuid
    LIMIT 1
  `;

  if (companyRows.length === 0) {
    redirect("/companies/my-profile");
  }

  const jobs = await getCompanyDashboardJobs(userId);

  return (
    <JobsManagementClient
      companyUserId={userId}
      companyHidden={isCompanyHidden(companyRows[0])}
      initialJobs={jobs}
      initialOpenJobId={searchParams?.jobId ?? null}
      initialActivateJobId={searchParams?.activate ?? null}
    />
  );
}
