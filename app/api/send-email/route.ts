import { Resend } from "resend";
import * as React from "react";

import JobAppliedTemplate from "@/app/email-templates/job-applied";
import ContactTalentTemplate from "@/app/email-templates/contact-talent";
import ContactCompanyTemplate from "@/app/email-templates/contact-company";
import ContactUsTemplate from "@/app/email-templates/contact-us";
import { GoodHiveContractEmail } from "@constants/common";
import TalentRegistrationTemplate from "@/app/email-templates/new-talent-user";
import CompanyRegistrationTemplate from "@/app/email-templates/new-company-user";

const resend = new Resend(process.env.RESEND_API_KEY);

const TEMPLATES = {
  "contact-talent": ContactTalentTemplate,
  "job-applied": JobAppliedTemplate,
  "contact-company": ContactCompanyTemplate,
  "contact-us": ContactUsTemplate,
  "new-talent": TalentRegistrationTemplate,
  "new-company": CompanyRegistrationTemplate,
};

interface RequestContentType {
  name: string;
  toUserName?: string;
  email: string;
  type: "contact-talent" | "job-applied" | "contact-us";
  subject: string;
  userEmail?: string;
  message: string;
  jobtitle?: string;
  userProfile?: string;
  jobLink?: string;
}

export async function POST(request: Request) {
  const {
    name,
    toUserName,
    email,
    type,
    subject,
    userEmail,
    message,
    userProfile,
    jobLink,
  }: RequestContentType = await request.json();
  console.log(
    email,
    type,
    subject,
    toUserName,
    name,
    message,
    userProfile,
    "send-email-body",
  );
  try {
    // For contact-us emails, send to GoodHive team instead of user
    const recipient = type === "contact-us" ? GoodHiveContractEmail : [email];
    
    const { data, error } = await resend.emails.send({
      from: "GoodHive <no-reply@goodhive.io>",
      to: recipient,
      subject,
      bcc: type !== "contact-us" ? GoodHiveContractEmail : undefined,
      react: TEMPLATES[type]({
        name,
        toUserName,
        email: type === "contact-us" ? email : undefined,
        message,
        userProfile,
        jobLink,
      }) as React.ReactElement,
    });

    if (error) {
      console.error("Resend error >>", error);
    }
    return new Response(JSON.stringify({ message: "Email sent" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ message: "Error sending email" }), {
      status: 500,
    });
  }
}
