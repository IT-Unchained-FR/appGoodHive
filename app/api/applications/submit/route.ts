import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { sendApplicationReceivedEmail } from "@/lib/email/application-received";
import { createNotification } from "@/lib/notifications";

interface SubmitApplicationRequest {
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  portfolioLink?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    // The applicant is always the signed-in user, and the company always
    // comes from the job — never from the request body.
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ message: "Please sign in to apply" }, { status: 401 });
    }
    const applicantUserId = sessionUser.user_id;

    const body = (await request.json().catch(() => ({}))) as Partial<SubmitApplicationRequest>;
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    const applicantName = body.applicantName?.trim() ?? "";
    const applicantEmail = body.applicantEmail?.trim() ?? "";
    const coverLetter = body.coverLetter?.trim() ?? "";
    const portfolioLink = body.portfolioLink?.trim() || null;

    if (!UUID_PATTERN.test(jobId) || !applicantName || !applicantEmail || !coverLetter) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const [job] = await sql<{
      company_email: string | null;
      company_name: string | null;
      published: boolean | null;
      title: string | null;
      user_id: string;
    }[]>`
      SELECT jo.user_id, jo.title, jo.published, c.email AS company_email,
        COALESCE(c.designation, jo.company_name) AS company_name
      FROM goodhive.job_offers jo
      LEFT JOIN goodhive.companies c ON c.user_id = jo.user_id
      WHERE jo.id = ${jobId}::uuid
      LIMIT 1
    `;

    if (!job || job.published !== true) {
      return NextResponse.json(
        { message: "This job isn't open for applications" },
        { status: 404 }
      );
    }
    const companyUserId = job.user_id;

    if (companyUserId === applicantUserId) {
      return NextResponse.json(
        { message: "You can't apply to your own job" },
        { status: 400 }
      );
    }

    const [talent] = await sql<{ approved: boolean | null }[]>`
      SELECT approved FROM goodhive.talents WHERE user_id = ${applicantUserId}::uuid LIMIT 1
    `;
    if (talent?.approved !== true) {
      return NextResponse.json(
        { message: "Your talent profile must be approved before you can apply" },
        { status: 403 }
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
        ${portfolioLink},
        'new',
        NOW(),
        NOW()
      )
      RETURNING id, created_at
    `;

    const jobTitle = job.title?.trim() || "your job";

    // Tell the company. Both are best-effort: the application is saved.
    await createNotification({
      userId: companyUserId,
      type: "application_received",
      title: `New application for "${jobTitle}"`,
      body: `${applicantName} applied.`,
      data: { jobId, applicationId: result[0].id, applicantUserId },
    });

    if (job.company_email?.trim()) {
      try {
        await sendApplicationReceivedEmail({
          applicantName,
          applicantUserId,
          companyEmail: job.company_email.trim(),
          companyName: job.company_name,
          coverLetter,
          jobId,
          jobTitle,
          portfolioLink,
        });
      } catch (error) {
        console.error("Failed to send application email:", error);
      }
    }

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
