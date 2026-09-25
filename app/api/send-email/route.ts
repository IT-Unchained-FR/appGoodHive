import * as React from "react";
import { NextResponse } from "next/server";

import ContactTalentTemplate from "@/app/email-templates/contact-talent";
import ContactUsTemplate from "@/app/email-templates/contact-us";
import ContactUsConfirmationTemplate from "@/app/email-templates/contact-us-confirmation";
import CompanyRegistrationTemplate from "@/app/email-templates/new-company-user";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { GOODHIVE_BASE_URL, sendEmail } from "@/lib/email/resend-sender";
import { rateLimit } from "@/lib/rate-limit";
import { GoodHiveContractEmail } from "@constants/common";

// Every email type has server-chosen recipients: callers can only supply
// their own message, never an address to send to. Anything that lets a
// caller pick the recipient would turn this route into an open relay.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 200;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

type Body = Record<string, unknown>;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Public contact form: goes to the GoodHive team, plus a fixed
// confirmation (without the visitor's message) to the address they gave.
async function sendContactUs(request: Request, body: Body) {
  const limit = rateLimit(`send-email:contact-us:${getClientIp(request)}`, {
    windowMs: 10 * 60 * 1000,
    max: 5,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  const name = text(body.name, MAX_NAME);
  const email = text(body.email, 320);
  const subject = text(body.subject, MAX_SUBJECT);
  const message = text(body.message, MAX_MESSAGE);
  if (!name || !EMAIL_PATTERN.test(email) || !message) {
    return badRequest("Name, a valid email and a message are required");
  }

  await sendEmail({
    react: React.createElement(ContactUsTemplate, { name, email, message }),
    subject: subject
      ? `New Contact Message from ${name}: ${subject}`
      : `New Contact Message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    to: GoodHiveContractEmail,
  });

  try {
    await sendEmail({
      react: React.createElement(ContactUsConfirmationTemplate, { name, email }),
      subject: "🍯 Thank you for contacting GoodHive!",
      text: `Hi ${name}, thanks for contacting GoodHive. We've received your message and will get back to you soon.`,
      to: email,
    });
  } catch (error) {
    console.error("Contact confirmation email failed:", error);
  }

  return NextResponse.json({ message: "Email sent" });
}

// A signed-in company contacting a talent. The talent's address and the
// company's name come from the database.
async function sendContactTalent(body: Body) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.user_id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`send-email:contact-talent:${sessionUser.user_id}`, {
    windowMs: 60 * 60 * 1000,
    max: 30,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "You've contacted a lot of talent recently. Please try again later." },
      { status: 429 },
    );
  }

  const talentUserId = text(body.talentUserId, 64);
  const message = text(body.message, MAX_MESSAGE);
  if (!talentUserId || !message) {
    return badRequest("talentUserId and message are required");
  }

  const [company] = await sql<{ designation: string | null; email: string | null }[]>`
    SELECT c.designation, COALESCE(NULLIF(TRIM(c.email), ''), NULLIF(TRIM(u.email), '')) AS email
    FROM goodhive.companies c
    LEFT JOIN goodhive.users u ON u.userid = c.user_id
    WHERE c.user_id = ${sessionUser.user_id}::uuid
    LIMIT 1
  `;
  if (!company) {
    return NextResponse.json({ message: "Only companies can contact talent" }, { status: 403 });
  }

  const [talent] = await sql<{ email: string | null; first_name: string | null; last_name: string | null }[]>`
    SELECT email, first_name, last_name FROM goodhive.talents
    WHERE user_id = ${talentUserId}::uuid
    LIMIT 1
  `.catch(() => []);
  if (!talent?.email?.trim()) {
    return NextResponse.json({ message: "Talent not found" }, { status: 404 });
  }

  const companyName = company.designation?.trim() || "A company";
  const talentName =
    [talent.first_name, talent.last_name].filter(Boolean).join(" ").trim() || "there";
  const companyProfile = `${GOODHIVE_BASE_URL}/companies/${sessionUser.user_id}`;

  await sendEmail({
    react: React.createElement(ContactTalentTemplate, {
      message,
      name: companyName,
      toUserName: talentName,
      userProfile: companyProfile,
    }),
    subject: `GoodHive - ${companyName} is interested in your profile`,
    text: `${companyName} sent you a message on GoodHive:\n\n${message}\n\nView their profile: ${companyProfile}`,
    to: talent.email.trim(),
  });

  // Copies for the sender and the GoodHive team. React escapes the message,
  // so nothing the sender typed is rendered as HTML.
  const copy = (heading: string) =>
    React.createElement(
      "div",
      { style: { fontFamily: "sans-serif", color: "#333" } },
      React.createElement("h2", { style: { color: "#f59e0b" } }, heading),
      React.createElement("p", null, `${companyName} → ${talentName}`),
      React.createElement("p", { style: { whiteSpace: "pre-wrap" } }, message),
    );
  const copies = [
    sendEmail({
      react: copy("🍯 Company contacted a talent"),
      subject: `[Admin] contact-talent: ${companyName} -> ${talentName}`,
      text: `${companyName} -> ${talentName}\n\n${message}`,
      to: GoodHiveContractEmail,
    }),
  ];
  if (company.email?.trim()) {
    copies.push(
      sendEmail({
        react: copy("Message sent successfully 🐝"),
        subject: `Confirmation: Message sent to ${talentName}`,
        text: `Your message to ${talentName} was sent.\n\n${message}`,
        to: company.email.trim(),
      }),
    );
  }
  for (const result of await Promise.allSettled(copies)) {
    if (result.status === "rejected") console.error("Contact copy email failed:", result.reason);
  }

  return NextResponse.json({ message: "Email sent" });
}

// Welcome email to the signed-in company, at the address on its profile.
async function sendNewCompany() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.user_id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [company] = await sql<{ designation: string | null; email: string | null }[]>`
    SELECT c.designation, COALESCE(NULLIF(TRIM(c.email), ''), NULLIF(TRIM(u.email), '')) AS email
    FROM goodhive.companies c
    LEFT JOIN goodhive.users u ON u.userid = c.user_id
    WHERE c.user_id = ${sessionUser.user_id}::uuid
    LIMIT 1
  `;
  if (!company?.email?.trim()) {
    return NextResponse.json({ message: "Company profile not found" }, { status: 404 });
  }

  const name = company.designation?.trim() || "there";
  await sendEmail({
    react: React.createElement(CompanyRegistrationTemplate, { name }),
    subject: `Welcome to GoodHive, ${name}! 🌟 Let's Connect You with Top IT Talent`,
    text: `Welcome to GoodHive, ${name}! Your profile has been sent to our team for review.`,
    to: company.email.trim(),
  });

  return NextResponse.json({ message: "Email sent" });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return badRequest("Invalid request body");

  try {
    switch (body.type) {
      case "contact-us":
        return await sendContactUs(request, body);
      case "contact-talent":
        return await sendContactTalent(body);
      case "new-company":
        return await sendNewCompany();
      default:
        return badRequest("Unsupported email type");
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ message: "Error sending email" }, { status: 500 });
  }
}
