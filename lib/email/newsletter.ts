import { Resend } from "resend";
import { createUnsubscribeToken } from "@/lib/newsletter-token";

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's batch endpoint caps out at 100 emails per call.
const BATCH_SIZE = 100;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getBaseUrl(): string {
  return process.env.GOODHIVE_BASE_URL || "https://goodhive.io";
}

function renderNewsletterHtml(subject: string, bodyHtml: string, unsubscribeUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;">
          <div style="background:#f0b429;padding:28px 32px;">
            <span style="color:#111111;font-size:20px;font-weight:700;">GoodHive</span>
          </div>
          <div style="padding:32px;color:#333333;line-height:1.6;">
            <h1 style="font-size:20px;color:#111111;margin:0 0 16px;">${escapeHtml(subject)}</h1>
            ${bodyHtml}
          </div>
          <div style="padding:24px 32px;background:#f9fafb;color:#999999;font-size:12px;text-align:center;">
            <p style="margin:0 0 8px;">You're receiving this because you have a GoodHive account.</p>
            <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#999999;">Unsubscribe</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export interface NewsletterRecipientInput {
  user_id: string;
  email: string;
}

export interface NewsletterSendResult {
  user_id: string;
  email: string;
  status: "sent" | "failed";
  error?: string;
}

export async function sendNewsletterBatch(
  subject: string,
  bodyHtml: string,
  recipients: NewsletterRecipientInput[],
): Promise<NewsletterSendResult[]> {
  const fromAddress = process.env.RESEND_FROM_EMAIL || "GoodHive <no-reply@goodhive.io>";
  const results: NewsletterSendResult[] = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);

    const payload = chunk.map((recipient) => {
      const unsubscribeToken = createUnsubscribeToken(recipient.user_id);
      const unsubscribeUrl = `${getBaseUrl()}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

      return {
        from: fromAddress,
        to: recipient.email,
        subject,
        html: renderNewsletterHtml(subject, bodyHtml, unsubscribeUrl),
      };
    });

    try {
      const { error } = await resend.batch.send(payload);

      if (error) {
        console.error("Newsletter batch send error:", error);
        for (const recipient of chunk) {
          results.push({
            user_id: recipient.user_id,
            email: recipient.email,
            status: "failed",
            error: error.message,
          });
        }
        continue;
      }

      for (const recipient of chunk) {
        results.push({ user_id: recipient.user_id, email: recipient.email, status: "sent" });
      }
    } catch (err) {
      console.error("Newsletter batch send threw:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      for (const recipient of chunk) {
        results.push({ user_id: recipient.user_id, email: recipient.email, status: "failed", error: message });
      }
    }
  }

  return results;
}
