import * as React from "react";
import { Resend } from "resend";

import ContactCompanyTemplate from "@/app/email-templates/contact-company";
import ContactTalentTemplate from "@/app/email-templates/contact-talent";
import ContactUsTemplate from "@/app/email-templates/contact-us";
import ContactUsConfirmationTemplate from "@/app/email-templates/contact-us-confirmation";
import JobAppliedTemplate from "@/app/email-templates/job-applied";
import CompanyRegistrationTemplate from "@/app/email-templates/new-company-user";
import TalentRegistrationTemplate from "@/app/email-templates/new-talent-user";
import { GoodHiveContractEmail } from "@constants/common";

const resend = new Resend(process.env.RESEND_API_KEY);

const TEMPLATES = {
  "contact-talent": ContactTalentTemplate,
  "job-applied": JobAppliedTemplate,
  "contact-company": ContactCompanyTemplate,
  "contact-us": ContactUsTemplate,
  "contact-us-confirmation": ContactUsConfirmationTemplate,
  "new-talent": TalentRegistrationTemplate,
  "new-company": CompanyRegistrationTemplate,
};

interface RequestContentType {
  name: string;
  toUserName?: string;
  email: string;
  type:
    | "contact-talent"
    | "job-applied"
    | "contact-company"
    | "contact-us"
    | "contact-us-confirmation"
    | "new-talent"
    | "new-company";
  subject: string;
  userEmail?: string;
  message: string;
  jobtitle?: string;
  userProfile?: string;
  jobLink?: string;
  referralLink?: string;
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
    referralLink,
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
    const isDev = process.env.NODE_ENV !== "production";
    const testEmail = process.env.TEST_EMAIL || "jubayerjuhan.dev@gmail.com";
    
    // In development, redirect all emails to the test address
    const recipientEmail = isDev ? testEmail : email;
    const teamRecipientEmail = isDev ? testEmail : GoodHiveContractEmail;
    const senderRecipientEmail = isDev && userEmail ? testEmail : userEmail;

    if (type === "contact-us") {
      // Send email to GoodHive team
      const teamEmailResult = await resend.emails.send({
        from: "GoodHive <no-reply@goodhive.io>",
        to: teamRecipientEmail,
        subject: isDev ? `[TEST] ${subject}` : subject,
        react: TEMPLATES[type]({ name, email, message }) as React.ReactElement,
      });

      // Send confirmation email to user
      const userEmailResult = await resend.emails.send({
        from: "GoodHive <no-reply@goodhive.io>",
        to: recipientEmail,
        subject: isDev ? `[TEST] 🍯 Thank you for contacting GoodHive!` : "🍯 Thank you for contacting GoodHive!",
        react: TEMPLATES["contact-us-confirmation"]({
          name,
          email,
          message,
        }) as React.ReactElement,
      });

      if (teamEmailResult.error || userEmailResult.error) {
        console.error("Email sending errors:", {
          teamEmail: teamEmailResult.error,
          userEmail: userEmailResult.error,
        });
        return new Response(
          JSON.stringify({
            message: "Error sending email",
            errors: {
              teamEmail: teamEmailResult.error,
              userEmail: userEmailResult.error,
            },
          }),
          {
            status: 500,
          },
        );
      }
    } else {
      // 1. Send to Receiver (Original)
      const recipient = [recipientEmail];
      const receiverPromise = resend.emails.send({
        from: "GoodHive <no-reply@goodhive.io>",
        to: recipient,
        subject: isDev ? `[TEST] ${subject}` : subject,
        react: TEMPLATES[type]({
          name,
          toUserName,
          message,
          userProfile,
          jobLink,
          referralLink,
          email: userEmail || email,
        }) as React.ReactElement,
      });

      // 2. Send to Sender (Confirmation)
      let senderPromise: any = Promise.resolve({ error: null });
      if (userEmail) {
        const senderHtml = `
           <div style="font-family: sans-serif; padding: 20px; color: #333;">
             <h2 style="color: #f59e0b;">Message Sent Successfully 🐝</h2>
             <p>Hi <strong>${name}</strong>,</p>
             <p>Your message to <strong>${toUserName || "the recipient"}</strong> has been sent successfully.</p>
             <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #f59e0b;">
               <strong style="color: #92400e;">Your Message:</strong><br/>
               <p style="margin-top: 10px; white-space: pre-wrap;">${message}</p>
             </div>
             <p>We'll notify you when they reply.</p>
             <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
             <p style="font-size: 14px; color: #666;">GoodHive Team</p>
           </div>
        `;
        senderPromise = resend.emails.send({
          from: "GoodHive <no-reply@goodhive.io>",
          to: senderRecipientEmail as string,
          subject: isDev ? `[TEST] Confirmation: Message sent to ${toUserName || "recipient"}` : `Confirmation: Message sent to ${toUserName || "recipient"}`,
          html: senderHtml,
        });
      }

      // 3. Send to Admin (High Level View)
      const adminHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
           <h2 style="color: #111;">🍯 New Message Notification</h2>
           <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
             <h3 style="margin-top: 0;">Communication Details</h3>
             <ul style="list-style: none; padding: 0;">
               <li style="margin-bottom: 8px;"><strong>Type:</strong> ${type}</li>
               <li style="margin-bottom: 8px;"><strong>Subject:</strong> ${subject}</li>
               <li style="margin-bottom: 8px;"><strong>Sender:</strong> ${name} (${userEmail || "No email provided"})</li>
               <li style="margin-bottom: 8px;"><strong>Receiver:</strong> ${toUserName || "N/A"} (${email})</li>
             </ul>
           </div>
           
           <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border: 1px solid #f59e0b;">
             <strong style="color: #92400e;">Message Content:</strong><br/>
             <p style="margin-top: 10px; white-space: pre-wrap;">${message}</p>
           </div>
           
           <div style="margin-top: 20px; font-size: 14px; color: #666;">
             ${userProfile ? `<p><strong>Sender Profile:</strong> <a href="${userProfile}">${userProfile}</a></p>` : ""}
             ${jobLink ? `<p><strong>Job Link:</strong> <a href="${jobLink}">${jobLink}</a></p>` : ""}
           </div>
        </div>
      `;
      
      const adminPromise = resend.emails.send({
        from: "GoodHive System <no-reply@goodhive.io>",
        to: teamRecipientEmail,
        subject: isDev ? `[TEST] [Admin] ${type}: ${name} -> ${toUserName}` : `[Admin] ${type}: ${name} -> ${toUserName}`,
        html: adminHtml,
      });

      const [receiverResult, senderResult, adminResult] = await Promise.all([
        receiverPromise,
        senderPromise,
        adminPromise,
      ]);

      if (receiverResult.error) {
        console.error("Resend error (Receiver) >>", receiverResult.error);
        return new Response(
          JSON.stringify({
            message: "Error sending email to receiver",
            error: receiverResult.error,
          }),
          {
            status: 500,
          },
        );
      }
      
      // Log errors for sender/admin but don't fail the request if receiver got it
      if (senderResult?.error) console.error("Resend error (Sender) >>", senderResult.error);
      if (adminResult?.error) console.error("Resend error (Admin) >>", adminResult.error);
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
