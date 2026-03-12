import * as React from "react";
import { Resend } from "resend";

import { GoodHiveContractEmail } from "@/app/constants/common";
import AssignmentAcceptedTemplate from "@/app/email-templates/assignment-accepted";
import AssignmentRejectedTemplate from "@/app/email-templates/assignment-rejected";
import AssignmentRequestTemplate from "@/app/email-templates/assignment-request";
import JobApprovedTemplate from "@/app/email-templates/job-approved";
import JobRejectedTemplate from "@/app/email-templates/job-rejected";
import JobSubmittedTemplate from "@/app/email-templates/job-submitted";
import MissionCompletedTemplate from "@/app/email-templates/mission-completed";

const resend = new Resend(process.env.RESEND_API_KEY);
const GOODHIVE_BASE_URL =
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

async function sendEmail(params: {
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

export async function sendJobSubmittedForReviewEmail(params: {
  companyName: string;
  jobId: string;
  jobTitle: string;
}) {
  const adminUrl = `${GOODHIVE_BASE_URL}/admin/job/${params.jobId}`;
  const subject = `New job submitted for review: ${params.jobTitle} by ${params.companyName}`;
  const text = `New job submitted for review.\n\nJob: ${params.jobTitle}\nCompany: ${params.companyName}\nReview: ${adminUrl}`;

  await sendEmail({
    react: React.createElement(JobSubmittedTemplate, {
      companyName: params.companyName,
      jobLink: adminUrl,
      jobTitle: params.jobTitle,
      name: params.companyName,
    }),
    subject,
    text,
    to: GoodHiveContractEmail,
  });
}

export async function sendJobApprovedEmail(params: {
  companyName?: string | null;
  companyEmail: string;
  jobId: string;
  jobTitle: string;
}) {
  const jobUrl = `${GOODHIVE_BASE_URL}/jobs/${params.jobId}`;
  const subject = `Your job "${params.jobTitle}" is approved and live!`;
  const text = `Congratulations. Your job "${params.jobTitle}" is now visible to talents.\n\nView job: ${jobUrl}`;

  await sendEmail({
    react: React.createElement(JobApprovedTemplate, {
      jobLink: jobUrl,
      jobTitle: params.jobTitle,
      name: params.companyName?.trim() || "there",
    }),
    subject,
    text,
    to: params.companyEmail,
  });
}

export async function sendAssignmentRequestEmail(params: {
  talentName: string;
  talentEmail: string;
  companyName: string;
  jobTitle: string;
  jobId: string;
  notes?: string | null;
}) {
  const link = `${GOODHIVE_BASE_URL}/talents/my-assignments`;
  await sendEmail({
    react: React.createElement(AssignmentRequestTemplate, {
      name: params.talentName,
      companyName: params.companyName,
      jobTitle: params.jobTitle,
      jobLink: link,
      message: params.notes ?? undefined,
    }),
    subject: `You've been assigned to "${params.jobTitle}" by ${params.companyName}`,
    text: `${params.companyName} assigned you to "${params.jobTitle}". Log in to accept or decline: ${link}`,
    to: params.talentEmail,
  });
}

export async function sendAssignmentAcceptedEmail(params: {
  companyName: string;
  companyEmail: string;
  talentName: string;
  jobTitle: string;
  jobId: string;
}) {
  await sendEmail({
    react: React.createElement(AssignmentAcceptedTemplate, {
      name: params.companyName,
      toUserName: params.talentName,
      jobTitle: params.jobTitle,
    }),
    subject: `${params.talentName} accepted your assignment for "${params.jobTitle}"`,
    text: `${params.talentName} accepted your assignment for "${params.jobTitle}". Message them: ${GOODHIVE_BASE_URL}/messages`,
    to: params.companyEmail,
  });
}

export async function sendAssignmentRejectedEmail(params: {
  companyName: string;
  companyEmail: string;
  talentName: string;
  jobTitle: string;
  jobId: string;
}) {
  const link = `${GOODHIVE_BASE_URL}/companies/dashboard/jobs`;
  await sendEmail({
    react: React.createElement(AssignmentRejectedTemplate, {
      name: params.companyName,
      toUserName: params.talentName,
      jobTitle: params.jobTitle,
      jobLink: link,
    }),
    subject: `${params.talentName} declined your assignment for "${params.jobTitle}"`,
    text: `${params.talentName} declined your assignment for "${params.jobTitle}". Assign another talent: ${link}`,
    to: params.companyEmail,
  });
}

export async function sendMissionCompletedEmail(params: {
  talentName: string;
  talentEmail: string;
  companyName: string;
  jobTitle: string;
  netAmount: number;
  token: string;
}) {
  const payoutsLink = `${GOODHIVE_BASE_URL}/talents/my-assignments`;
  await sendEmail({
    react: React.createElement(MissionCompletedTemplate, {
      name: params.talentName,
      companyName: params.companyName,
      jobTitle: params.jobTitle,
      netAmount: params.netAmount,
      token: params.token,
      payoutsLink,
    }),
    subject: `Mission completed! Your payout of ${params.netAmount} ${params.token} is incoming`,
    text: `${params.companyName} confirmed your mission for "${params.jobTitle}". Payout of ${params.netAmount} ${params.token} incoming. View: ${payoutsLink}`,
    to: params.talentEmail,
  });
}

export async function sendJobRejectedEmail(params: {
  companyName?: string | null;
  companyEmail: string;
  feedback?: string | null;
  jobId: string;
  jobTitle: string;
}) {
  const editUrl = `${GOODHIVE_BASE_URL}/companies/create-job?id=${params.jobId}`;
  const feedbackText = params.feedback?.trim() || "Please review the job details and submit again.";
  const subject = `Your job "${params.jobTitle}" needs revision`;
  const text = `Your job "${params.jobTitle}" needs revision.\n\nAdmin feedback: ${feedbackText}\n\nEdit job: ${editUrl}`;

  await sendEmail({
    react: React.createElement(JobRejectedTemplate, {
      feedback: feedbackText,
      jobLink: editUrl,
      jobTitle: params.jobTitle,
      name: params.companyName?.trim() || "there",
    }),
    subject,
    text,
    to: params.companyEmail,
  });
}
