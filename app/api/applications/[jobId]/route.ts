import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth/sessionUtils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const sessionUser = await requireSession();
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { message: "Job ID is required" },
        { status: 400 }
      );
    }

    const jobOwner = await sql`
      SELECT user_id FROM goodhive.job_offers WHERE id = ${jobId}::uuid
    `;

    if (jobOwner.length === 0) {
      return NextResponse.json(
        { message: "Job not found" },
        { status: 404 }
      );
    }

    if (jobOwner[0].user_id !== sessionUser.user_id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Fetch applications with applicant details
    const applications = await sql`
      SELECT
        ja.id,
        ja.job_id,
        ja.applicant_user_id,
        ja.company_user_id,
        ja.conversation_thread_id,
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
        AND ja.company_user_id = ${sessionUser.user_id}::uuid
      ORDER BY ja.created_at DESC
    `;

    return NextResponse.json(applications, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { message: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
