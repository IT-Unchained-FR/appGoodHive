import * as React from "react";

import CompanyApprovedTemplate from "@/app/email-templates/company-approved";
import CompanyRejectedTemplate from "@/app/email-templates/company-rejected";
import sql from "@/lib/db";
import { GOODHIVE_BASE_URL, sendEmail } from "@/lib/email/resend-sender";

// Keeps a bulk review from opening hundreds of Resend requests at once.
const SEND_CONCURRENCY = 10;

interface CompanyRecipient {
  user_id: string;
  name: string | null;
  email: string | null;
}

async function sendCompanyApprovedEmail(recipient: CompanyRecipient & { email: string }) {
  const createJobUrl = `${GOODHIVE_BASE_URL}/companies/create-job`;
  await sendEmail({
    react: React.createElement(CompanyApprovedTemplate, {
      jobLink: createJobUrl,
      name: recipient.name?.trim() || "there",
    }),
    subject: "Your company is approved on GoodHive — create your first job",
    text: `Great news! Your company profile has been approved by the GoodHive team.\n\nYou can now create your first job: ${createJobUrl}`,
    to: recipient.email,
  });
}

async function sendCompanyRejectedEmail(
  recipient: CompanyRecipient & { email: string },
  reason?: string | null,
) {
  const profileUrl = `${GOODHIVE_BASE_URL}/companies/my-profile`;
  const feedback = reason?.trim() || undefined;
  await sendEmail({
    react: React.createElement(CompanyRejectedTemplate, {
      feedback,
      jobLink: profileUrl,
      name: recipient.name?.trim() || "there",
    }),
    subject: "Your GoodHive company profile needs a few changes",
    text: `Your company profile needs a few changes before it can be approved.${
      feedback ? `\n\nFeedback from our team: ${feedback}` : ""
    }\n\nUpdate and re-submit: ${profileUrl}`,
    to: recipient.email,
  });
}

/**
 * Emails companies the outcome of an admin review. Never throws: an email
 * failure is logged and must not undo or fail the review itself.
 */
export async function notifyCompanyReviewOutcome(params: {
  userIds: string[];
  outcome: "approved" | "rejected";
  reason?: string | null;
}) {
  if (params.userIds.length === 0) return;

  try {
    const recipients = await sql<CompanyRecipient[]>`
      SELECT
        c.user_id,
        c.designation AS name,
        COALESCE(NULLIF(TRIM(c.email), ''), NULLIF(TRIM(u.email), '')) AS email
      FROM goodhive.companies c
      LEFT JOIN goodhive.users u ON u.userid = c.user_id
      WHERE c.user_id = ANY(${params.userIds})
    `;

    for (let i = 0; i < recipients.length; i += SEND_CONCURRENCY) {
      const chunk = recipients.slice(i, i + SEND_CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map((recipient) => {
          if (!recipient.email) {
            console.warn(
              `No email for company ${recipient.user_id} — skipping ${params.outcome} email`,
            );
            return Promise.resolve();
          }
          const withEmail = { ...recipient, email: recipient.email };
          return params.outcome === "approved"
            ? sendCompanyApprovedEmail(withEmail)
            : sendCompanyRejectedEmail(withEmail, params.reason);
        }),
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to send company ${params.outcome} email to ${chunk[index].user_id}:`,
            result.reason,
          );
        }
      });
    }
  } catch (error) {
    console.error(`Failed to send company ${params.outcome} emails:`, error);
  }
}
