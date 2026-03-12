import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";

export const JobRejectedTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props,
) => {
  const recipientName = props.name || "there";
  const jobTitle = props.jobTitle || "your job";
  const editLink = props.jobLink || "https://app.goodhive.io/companies/create-job";
  const feedback =
    props.feedback?.trim() ||
    "Please review the job details, make the requested updates, and submit it again.";

  return (
    <div>
      <p>Hi, {recipientName}</p>
      <p>
        Your job "{jobTitle}" needs revision before it can go live on GoodHive.
      </p>
      <p>
        <strong>Admin feedback:</strong> {feedback}
      </p>
      <p>
        You can update and re-submit it here:{" "}
        <a
          href={editLink}
          style={{
            color: "#FFC905",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          {editLink}
        </a>
      </p>
      <p>Once updated, submit it again for review.</p>
      <br />
      <p>Best regards,</p>
      <p>The GoodHive Team</p>
    </div>
  );
};

export default JobRejectedTemplate;
