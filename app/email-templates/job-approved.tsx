import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";

export const JobApprovedTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props,
) => {
  const recipientName = props.name || "there";
  const jobTitle = props.jobTitle || "your job";
  const jobLink = props.jobLink || "https://app.goodhive.io/jobs";

  return (
    <div>
      <p>Hi, {recipientName}</p>
      <p>
        Great news! Your job &ldquo;{jobTitle}&rdquo; has been reviewed and
        approved by our team.
      </p>
      <p>
        To make it visible to talents, please log in to your dashboard and
        complete the blockchain activation — publish the job to Polygon and add
        a provision fund so talents can be paid on-chain.
      </p>
      <p>
        <a
          href={jobLink}
          style={{
            color: "#FFC905",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Go to your dashboard →
        </a>
      </p>
      <br />
      <p>Best regards,</p>
      <p>The GoodHive Team</p>
    </div>
  );
};

export default JobApprovedTemplate;
