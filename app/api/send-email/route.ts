import { Resend } from "resend";
import * as React from "react";

import JobAppliedTemplate from "@/app/email-templates/job-applied";
import ContactTalentTemplate from "@/app/email-templates/contact-talent";
import { GoodHiveContractEmail } from "@constants/common";

const resend = new Resend(process.env.RESEND_API_KEY);

const TEMPLATES = {
  "contact-talent": ContactTalentTemplate,
  "job-applied": JobAppliedTemplate,
};

interface RequestContentType {
  name: string;
  email: string;
  type: "contact-talent" | "job-applied";
  subject: string;
  userEmail: string;
  message: string;
  jobtitle: string;
  userProfile: string;
}

export async function POST(request: Request) {
  const {
    name,
    email,
    type,
    subject,
    userEmail,
    message,
    userProfile,
  }: RequestContentType = await request.json();

  try {
    const { data, error } = await resend.emails.send({
      from: "GoodHive <no-reply@goodhive.io>",
      to: [email],
      subject,
      cc: userEmail,
      bcc: GoodHiveContractEmail,
      react: TEMPLATES[type]({
        name,
        message,
        userProfile,
      }) as React.ReactElement,
    });

    if (error) {
      throw new Error("Something went wrong!");
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
