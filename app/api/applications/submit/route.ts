import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

interface SubmitApplicationRequest {
  jobId: string;
  applicantUserId: string;
  companyUserId: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  portfolioLink?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitApplicationRequest = await request.json();

    const {
      jobId,
      applicantUserId,
      companyUserId,
      applicantName,
      applicantEmail,
      coverLetter,
      portfolioLink,
    } = body;

    // Validate required fields
    if (!jobId || !applicantUserId || !companyUserId || !applicantName || !applicantEmail || !coverLetter) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if application already exists
    const existingApplication = await sql`
      SELECT id FROM goodhive.job_applications
      WHERE job_id = ${jobId}::uuid AND applicant_user_id = ${applicantUserId}::uuid
    `;

    if (existingApplication.length > 0) {
      return NextResponse.json(
        { message: "You have already applied to this job", code: "DUPLICATE_APPLICATION" },
        { status: 409 }
      );
    }

    // Insert the application
    const result = await sql`
      INSERT INTO goodhive.job_applications (
        job_id,
        applicant_user_id,
        company_user_id,
        applicant_name,
        applicant_email,
        cover_letter,
        portfolio_link,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${jobId}::uuid,
        ${applicantUserId}::uuid,
        ${companyUserId}::uuid,
        ${applicantName},
        ${applicantEmail},
        ${coverLetter},
        ${portfolioLink || null},
        'new',
        NOW(),
        NOW()
      )
      RETURNING id, created_at
    `;

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicationId: result[0].id,
        createdAt: result[0].created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { message: "Failed to submit application" },
      { status: 500 }
    );
  }
}
