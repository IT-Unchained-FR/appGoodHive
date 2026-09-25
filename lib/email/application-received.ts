import * as React from "react";

import JobAppliedTemplate from "@/app/email-templates/job-applied";
import { GOODHIVE_BASE_URL, sendEmail } from "@/lib/email/resend-sender";

export async function sendApplicationReceivedEmail(params: {
  applicantName: string;
  applicantUserId: string;
  companyEmail: string;
  companyName: string | null;
  coverLetter: string;
  jobId: string;
  jobTitle: string;
  portfolioLink: string | null;
}) {
  // Opens the applicants drawer for this job.
  const applicantsUrl = `${GOODHIVE_BASE_URL}/companies/dashboard/jobs?jobId=${params.jobId}`;
  const profileUrl = `${GOODHIVE_BASE_URL}/talents/${params.applicantUserId}`;
  const message = params.portfolioLink
    ? `${params.coverLetter}\n\nPortfolio/LinkedIn: ${params.portfolioLink}`
    : params.coverLetter;

  await sendEmail({
    react: React.createElement(JobAppliedTemplate, {
      jobLink: applicantsUrl,
      message,
      name: params.applicantName,
      toUserName: params.companyName?.trim() || "there",
      userProfile: profileUrl,
    }),
    subject: `GoodHive - ${params.applicantName} applied for "${params.jobTitle}"`,
    text: `${params.applicantName} applied for "${params.jobTitle}".\n\n${message}\n\nProfile: ${profileUrl}\nReview applicants: ${applicantsUrl}`,
    to: params.companyEmail,
  });
}
