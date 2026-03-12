import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { getCompanyDashboardJobs } from "@/lib/jobs/company-jobs";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.user_id ?? null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const companyRows = await sql<{ user_id: string }[]>`
      SELECT user_id
      FROM goodhive.companies
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `;

    if (companyRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Company profile not found" },
        { status: 403 },
      );
    }

    const jobs = await getCompanyDashboardJobs(userId);

    return NextResponse.json(
      { success: true, data: jobs },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch company jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch company jobs" },
      { status: 500 },
    );
  }
}
