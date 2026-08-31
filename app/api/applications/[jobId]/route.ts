import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { readViewerAccess } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { message: "Job ID is required" },
        { status: 400 }
      );
    }

    // Ownership is derived from the session, never from a query parameter.
    // The previous `if (companyUserId)` check was skipped entirely when the
    // caller simply omitted the param, exposing every applicant's name, email,
    // and cover letter for any job id.
    const access = await readViewerAccess();

    if (!access.isAuthenticated && !access.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const jobOwner = await sql<{ user_id: string }[]>`
      SELECT user_id FROM goodhive.job_offers WHERE id = ${jobId}::uuid
    `;

    if (jobOwner.length === 0) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    if (!access.isAdmin && jobOwner[0].user_id !== access.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Fetch applications with applicant details
    const applications = await sql`
      SELECT
        ja.id,
        ja.job_id,
        ja.applicant_user_id,
        ja.company_user_id,
        ja.applicant_name,
        ja.applicant_email,
        ja.cover_letter,
        ja.portfolio_link,
        ja.status,
        ja.internal_notes,
        ja.rating,
        ja.created_at,
        ja.updated_at,
        t.image_url as applicant_image_url,
        COALESCE(t.title, t.about_work, t.description) as applicant_headline
      FROM goodhive.job_applications ja
      LEFT JOIN goodhive.talents t ON ja.applicant_user_id = t.user_id
      WHERE ja.job_id = ${jobId}::uuid
      ORDER BY ja.created_at DESC
    `;

    return NextResponse.json(applications, {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { message: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
