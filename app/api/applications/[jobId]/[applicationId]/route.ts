import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ApplicationStatus } from "@/interfaces/job-application";

const VALID_STATUSES: ApplicationStatus[] = ['new', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; applicationId: string }> }
) {
  try {
    const { jobId, applicationId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const companyUserId = searchParams.get("companyUserId");

    if (!jobId || !applicationId) {
      return NextResponse.json(
        { message: "Job ID and Application ID are required" },
        { status: 400 }
      );
    }

    // Fetch the application with details
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
        COALESCE(t.title, t.about_work, t.description) as applicant_headline,
        jo.title as job_title
      FROM goodhive.job_applications ja
      LEFT JOIN goodhive.talents t ON ja.applicant_user_id = t.user_id
      LEFT JOIN goodhive.job_offers jo ON ja.job_id = jo.id
      WHERE ja.job_id = ${jobId}::uuid AND ja.id = ${applicationId}::int
    `;

    if (applications.length === 0) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    const application = applications[0];

    // Check authorization
    if (companyUserId && application.company_user_id !== companyUserId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json(application, { status: 200 });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { message: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; applicationId: string }> }
) {
  try {
    const { jobId, applicationId } = await params;
    const body = await request.json();
    const { status, internalNotes, rating, companyUserId } = body;

    if (!jobId || !applicationId) {
      return NextResponse.json(
        { message: "Job ID and Application ID are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingApp = await sql`
      SELECT company_user_id FROM goodhive.job_applications
      WHERE job_id = ${jobId}::uuid AND id = ${applicationId}::int
    `;

    if (existingApp.length === 0) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    if (companyUserId && existingApp[0].company_user_id !== companyUserId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: Record<string, any> = {};

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { message: "Invalid status value" },
          { status: 400 }
        );
      }
      updates.push("status");
      values.status = status;
    }

    if (internalNotes !== undefined) {
      updates.push("internal_notes");
      values.internalNotes = internalNotes;
    }

    if (rating !== undefined) {
      if (rating !== null && (rating < 1 || rating > 5)) {
        return NextResponse.json(
          { message: "Rating must be between 1 and 5" },
          { status: 400 }
        );
      }
      updates.push("rating");
      values.rating = rating;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    // Execute update
    const result = await sql`
      UPDATE goodhive.job_applications
      SET
        status = COALESCE(${values.status || null}::goodhive.application_status, status),
        internal_notes = COALESCE(${values.internalNotes ?? null}, internal_notes),
        rating = ${values.rating !== undefined ? values.rating : null}::smallint,
        updated_at = NOW()
      WHERE job_id = ${jobId}::uuid AND id = ${applicationId}::int
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Failed to update application" },
        { status: 500 }
      );
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { message: "Failed to update application" },
      { status: 500 }
    );
  }
}
