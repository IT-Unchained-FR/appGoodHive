import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth/sessionUtils";
import {
  buildCompanyThreadUrl,
  createNotificationEvent,
  markNotificationEmailed,
  sendApplicationSubmittedEmail,
  shouldSendNotificationEmail,
} from "@/lib/notifications/conversationNotifications";

interface SubmitApplicationRequest {
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  portfolioLink?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireSession();
    const body: SubmitApplicationRequest = await request.json();
    const {
      jobId,
      applicantName,
      applicantEmail,
      coverLetter,
      portfolioLink,
    } = body;

    const normalizedApplicantName = applicantName?.trim();
    const normalizedApplicantEmail = applicantEmail?.trim() || sessionUser.email;
    const normalizedCoverLetter = coverLetter?.trim();
    const normalizedPortfolioLink = portfolioLink?.trim() || null;

    if (
      !jobId ||
      !normalizedApplicantName ||
      !normalizedApplicantEmail ||
      !normalizedCoverLetter
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (normalizedCoverLetter.length < 200) {
      return NextResponse.json(
        { message: "Cover letter must be at least 200 characters" },
        { status: 400 },
      );
    }

    const jobs = await sql`
      SELECT
        jo.id,
        jo.user_id,
        jo.title,
        jo.published,
        COALESCE(c.designation, 'Company') AS company_name,
        u.email AS company_email
      FROM goodhive.job_offers
      AS jo
      LEFT JOIN goodhive.companies c
        ON c.user_id = jo.user_id
      LEFT JOIN goodhive.users u
        ON u.userid = jo.user_id
      WHERE jo.id = ${jobId}::uuid
      LIMIT 1
    `;

    if (jobs.length === 0) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const job = jobs[0];

    if (!job.published) {
      return NextResponse.json(
        { message: "This job is no longer accepting applications" },
        { status: 409 },
      );
    }

    if (job.user_id === sessionUser.user_id) {
      return NextResponse.json(
        { message: "You cannot apply to your own job" },
        { status: 403 },
      );
    }

    const previewText = normalizedCoverLetter.replace(/\s+/g, " ").slice(0, 240);

    const result = await sql.begin(async (tx) => {
      const existingApplication = await tx`
        SELECT id
        FROM goodhive.job_applications
        WHERE job_id = ${jobId}::uuid
          AND applicant_user_id = ${sessionUser.user_id}::uuid
        LIMIT 1
      `;

      if (existingApplication.length > 0) {
        const duplicateError = new Error("DUPLICATE_APPLICATION");
        duplicateError.name = "DUPLICATE_APPLICATION";
        throw duplicateError;
      }

      const applicationResult = await tx`
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
          ${sessionUser.user_id}::uuid,
          ${job.user_id}::uuid,
          ${normalizedApplicantName},
          ${normalizedApplicantEmail},
          ${normalizedCoverLetter},
          ${normalizedPortfolioLink},
          'new',
          NOW(),
          NOW()
        )
        RETURNING id, created_at
      `;

      const application = applicationResult[0];

      const threadResult = await tx`
        INSERT INTO goodhive.conversation_threads (
          thread_type,
          job_id,
          company_user_id,
          talent_user_id,
          job_application_id,
          status,
          created_by_user_id,
          last_message_at,
          last_message_preview,
          created_at,
          updated_at
        ) VALUES (
          'job_application',
          ${jobId}::uuid,
          ${job.user_id}::uuid,
          ${sessionUser.user_id}::uuid,
          ${application.id},
          'awaiting_company',
          ${sessionUser.user_id}::uuid,
          NOW(),
          ${previewText},
          NOW(),
          NOW()
        )
        RETURNING id, status, created_at
      `;

      const thread = threadResult[0];

      const messageResult = await tx`
        INSERT INTO goodhive.conversation_messages (
          thread_id,
          sender_user_id,
          sender_role,
          message_type,
          body,
          body_plaintext,
          metadata,
          created_at
        ) VALUES (
          ${thread.id}::uuid,
          ${sessionUser.user_id}::uuid,
          'talent',
          'application_intro',
          ${normalizedCoverLetter},
          ${normalizedCoverLetter},
          ${JSON.stringify({
            applicationId: application.id,
            jobId,
            jobTitle: job.title,
          })}::jsonb,
          NOW()
        )
        RETURNING id, created_at
      `;

      const initialMessage = messageResult[0];

      await tx`
        UPDATE goodhive.job_applications
        SET conversation_thread_id = ${thread.id}::uuid,
            updated_at = NOW()
        WHERE id = ${application.id}
      `;

      await tx`
        INSERT INTO goodhive.conversation_participants (
          thread_id,
          user_id,
          participant_role,
          is_active,
          is_blocked,
          last_read_message_id,
          last_read_at,
          created_at,
          updated_at
        ) VALUES
          (
            ${thread.id}::uuid,
            ${sessionUser.user_id}::uuid,
            'talent',
            true,
            false,
            ${initialMessage.id}::uuid,
            ${initialMessage.created_at},
            NOW(),
            NOW()
          ),
          (
            ${thread.id}::uuid,
            ${job.user_id}::uuid,
            'company',
            true,
            false,
            NULL,
            NULL,
            NOW(),
            NOW()
          )
      `;

      return {
        applicationId: application.id,
        threadId: thread.id,
        threadStatus: thread.status,
        initialMessageId: initialMessage.id,
        createdAt: application.created_at,
      };
    });

    const notificationEventId = await createNotificationEvent({
      userId: job.user_id,
      eventType: "application_submitted",
      threadId: result.threadId,
      jobApplicationId: result.applicationId,
      messageId: result.initialMessageId,
      metadata: {
        jobId,
        jobTitle: job.title,
        applicantName: normalizedApplicantName,
        applicantEmail: normalizedApplicantEmail,
      },
    });

    if (job.company_email) {
      const shouldEmail = await shouldSendNotificationEmail({
        userId: job.user_id,
        threadId: result.threadId,
        eventType: "application_submitted",
      });

      if (shouldEmail) {
        const emailSent = await sendApplicationSubmittedEmail({
          recipientEmail: job.company_email,
          recipientName: job.company_name || "there",
          applicantName: normalizedApplicantName,
          jobTitle: job.title,
          coverLetter: normalizedCoverLetter,
          threadUrl: buildCompanyThreadUrl(result.threadId),
        });

        if (emailSent && notificationEventId) {
          await markNotificationEmailed(notificationEventId);
        }
      }
    }

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicationId: result.applicationId,
        threadId: result.threadId,
        threadStatus: result.threadStatus,
        createdAt: result.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    if (
      (error instanceof Error && error.name === "DUPLICATE_APPLICATION") ||
      (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505")
    ) {
      return NextResponse.json(
        {
          message: "You have already applied to this job",
          code: "DUPLICATE_APPLICATION",
        },
        { status: 409 },
      );
    }

    console.error("Error submitting application:", error);
    return NextResponse.json(
      { message: "Failed to submit application" },
      { status: 500 },
    );
  }
}
