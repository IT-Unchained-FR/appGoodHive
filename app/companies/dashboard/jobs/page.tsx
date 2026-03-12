import { redirect } from "next/navigation";

import JobsManagementClient from "@/app/companies/dashboard/jobs/JobsManagementClient";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { getCompanyDashboardJobs } from "@/lib/jobs/company-jobs";

export const dynamic = "force-dynamic";

interface JobsDashboardPageProps {
  searchParams?: {
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

  const companyRows = await sql<{ user_id: string }[]>`
    SELECT user_id
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
      initialJobs={jobs}
      initialOpenJobId={searchParams?.jobId ?? null}
    />
  );
}
