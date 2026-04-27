import { NextResponse } from "next/server";

import { getHiringCoachContext } from "@/lib/ai/company-hiring-coach";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const context = await getHiringCoachContext(sessionUser.user_id);
    if (!context) {
      return NextResponse.json(
        { success: false, error: "Company profile not found" },
        { status: 403 },
      );
    }

    const clientContext = {
      company: {
        name: context.company.name,
        headline: context.company.headline,
        location: context.company.location,
      },
      jobs: context.jobs.map((job) => ({
        id: job.id,
        title: job.title,
        applicationCount: job.applicationCount,
        reviewStatus: job.reviewStatus,
        published: job.published,
      })),
      applications: context.applications.map((application) => ({
        id: application.id,
        jobId: application.jobId,
        applicantName: application.applicantName,
        applicantHeadline: application.applicantHeadline,
        status: application.status,
      })),
    };

    return NextResponse.json({ success: true, data: clientContext }, { status: 200 });
  } catch (error) {
    console.error("Failed to load hiring coach context:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load hiring coach context" },
      { status: 500 },
    );
  }
}
