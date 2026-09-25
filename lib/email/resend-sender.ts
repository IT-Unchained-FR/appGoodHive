import * as React from "react";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const GOODHIVE_BASE_URL =
  process.env.GOODHIVE_BASE_URL?.replace(/\/+$/, "") ??
  "https://app.goodhive.io";

function getRecipient(email: string) {
  const isDev = process.env.NODE_ENV !== "production";
  const testEmail = process.env.TEST_EMAIL?.trim();

  if (isDev && !testEmail) {
    console.warn("TEST_EMAIL env var not set — skipping email in dev");
    return null;
  }

  return isDev ? testEmail ?? null : email;
}

export async function sendEmail(params: {
  react: React.ReactElement;
  subject: string;
  text: string;
  to: string;
}) {
  const recipient = getRecipient(params.to);
  if (!recipient) {
    return;
  }

  const isDev = process.env.NODE_ENV !== "production";
  const { error } = await resend.emails.send({
    from: "GoodHive <no-reply@goodhive.io>",
    to: [recipient],
    subject: isDev ? `[TEST] ${params.subject}` : params.subject,
    react: params.react,
    text: params.text,
  });

  if (error) {
    throw error;
  }
}
