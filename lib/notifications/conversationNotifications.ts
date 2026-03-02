import sql from "@/lib/db";
import { sendEmail } from "@/lib/email/emailService";

export type ConversationNotificationEventType =
  | "application_submitted"
  | "new_message";

interface CreateNotificationEventParams {
  userId: string;
  eventType: ConversationNotificationEventType;
  threadId?: string | null;
  jobApplicationId?: number | null;
  messageId?: string | null;
  metadata?: Record<string, unknown>;
}

interface ApplicationSubmittedEmailParams {
  recipientEmail: string;
  recipientName: string;
  applicantName: string;
  jobTitle: string;
  coverLetter: string;
  talentProfileUrl?: string;
  threadUrl?: string;
}

interface ConversationMessageEmailParams {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  jobTitle: string;
  messageBody: string;
  threadUrl?: string;
}

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.GOODHIVE_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function createNotificationEvent({
  userId,
  eventType,
  threadId,
  jobApplicationId,
  messageId,
  metadata = {},
}: CreateNotificationEventParams): Promise<string | null> {
  const rows = await sql`
    INSERT INTO goodhive.notification_events (
      user_id,
      event_type,
      thread_id,
      job_application_id,
      message_id,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      ${userId}::uuid,
      ${eventType},
      ${threadId ?? null}::uuid,
      ${jobApplicationId ?? null},
      ${messageId ?? null}::uuid,
      ${JSON.stringify(metadata)}::jsonb,
      NOW(),
      NOW()
    )
    RETURNING id
  `;

  return rows[0]?.id ?? null;
}

export async function shouldSendNotificationEmail({
  userId,
  threadId,
  eventType,
  cooldownMinutes = 30,
}: {
  userId: string;
  threadId?: string | null;
  eventType: ConversationNotificationEventType;
  cooldownMinutes?: number;
}) {
  const recentRows = await sql`
    SELECT id
    FROM goodhive.notification_events
    WHERE user_id = ${userId}::uuid
      AND event_type = ${eventType}
      AND (
        (${threadId ?? null}::uuid IS NULL AND thread_id IS NULL)
        OR thread_id = ${threadId ?? null}::uuid
      )
      AND emailed_at IS NOT NULL
      AND emailed_at > NOW() - make_interval(mins => ${cooldownMinutes})
    LIMIT 1
  `;

  return recentRows.length === 0;
}

export async function markNotificationEmailed(eventId: string) {
  await sql`
    UPDATE goodhive.notification_events
    SET emailed_at = NOW(),
        updated_at = NOW()
    WHERE id = ${eventId}::uuid
  `;
}

export async function sendApplicationSubmittedEmail({
  recipientEmail,
  recipientName,
  applicantName,
  jobTitle,
  coverLetter,
  talentProfileUrl,
  threadUrl,
}: ApplicationSubmittedEmailParams) {
  const safeRecipientName = escapeHtml(recipientName || "there");
  const safeApplicantName = escapeHtml(applicantName);
  const safeJobTitle = escapeHtml(jobTitle);
  const safeCoverLetter = escapeHtml(coverLetter);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6; padding: 24px; background: #f8fafc;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
        <div style="padding: 28px; background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); color: white;">
          <div style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.9; font-weight: 700;">New application</div>
          <h1 style="margin: 12px 0 0; font-size: 28px; line-height: 1.2;">${safeApplicantName} applied to ${safeJobTitle}</h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin-top: 0;">Hi ${safeRecipientName},</p>
          <p>You have a new applicant in GoodHive. Their application has already opened a private conversation thread so you can reply in context.</p>
          <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; background: #fffef7;">
            <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #b45309; font-weight: 700; margin-bottom: 10px;">Application message</div>
            <div style="white-space: pre-wrap; color: #334155;">${safeCoverLetter}</div>
          </div>
          <div style="margin-top: 24px;">
            ${
              threadUrl
                ? `<a href="${threadUrl}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:linear-gradient(135deg,#fbbf24 0%,#f97316 100%);color:white;text-decoration:none;font-weight:700;">Open applicant conversation</a>`
                : ""
            }
            ${
              talentProfileUrl
                ? `<a href="${talentProfileUrl}" style="display:inline-block;margin-left:12px;padding:14px 22px;border-radius:12px;border:1px solid #cbd5e1;color:#334155;text-decoration:none;font-weight:600;">View talent profile</a>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `New application from ${applicantName} for ${jobTitle}`,
    html,
    text: `${applicantName} applied to ${jobTitle}. Review the new application in GoodHive.`,
  });
}

export async function sendConversationMessageEmail({
  recipientEmail,
  recipientName,
  senderName,
  jobTitle,
  messageBody,
  threadUrl,
}: ConversationMessageEmailParams) {
  const safeRecipientName = escapeHtml(recipientName || "there");
  const safeSenderName = escapeHtml(senderName);
  const safeJobTitle = escapeHtml(jobTitle);
  const safeMessageBody = escapeHtml(messageBody);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6; padding: 24px; background: #f8fafc;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
        <div style="padding: 28px; background: linear-gradient(135deg, #111827 0%, #1f2937 100%); color: white;">
          <div style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.9; font-weight: 700;">New message</div>
          <h1 style="margin: 12px 0 0; font-size: 28px; line-height: 1.2;">${safeSenderName} sent a reply about ${safeJobTitle}</h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin-top: 0;">Hi ${safeRecipientName},</p>
          <p>You have a new message in your GoodHive application conversation.</p>
          <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; background: #f8fafc;">
            <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #475569; font-weight: 700; margin-bottom: 10px;">Message preview</div>
            <div style="white-space: pre-wrap; color: #334155;">${safeMessageBody}</div>
          </div>
          ${
            threadUrl
              ? `<a href="${threadUrl}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:linear-gradient(135deg,#fbbf24 0%,#f97316 100%);color:white;text-decoration:none;font-weight:700;">Open conversation</a>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `New message from ${senderName} about ${jobTitle}`,
    html,
    text: `${senderName} sent a new message about ${jobTitle}. Open GoodHive to continue the conversation.`,
  });
}

export function buildCompanyThreadUrl(threadId?: string | null) {
  const baseUrl = getAppBaseUrl();
  if (!threadId) {
    return `${baseUrl}/companies/dashboard/inbox`;
  }

  return `${baseUrl}/companies/dashboard/inbox?thread=${threadId}`;
}

export function buildTalentThreadUrl(threadId?: string | null) {
  const baseUrl = getAppBaseUrl();
  if (!threadId) {
    return `${baseUrl}/talents/applications`;
  }

  return `${baseUrl}/talents/applications?thread=${threadId}`;
}
