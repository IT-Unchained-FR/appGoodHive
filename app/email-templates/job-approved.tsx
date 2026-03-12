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
        Congratulations. Your job "{jobTitle}" has been approved and is now live
        on GoodHive.
      </p>
      <p>
        Talents can now discover and apply to it here:{" "}
        <a
          href={jobLink}
          style={{
            color: "#FFC905",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          {jobLink}
        </a>
      </p>
      <br />
      <p>Best regards,</p>
      <p>The GoodHive Team</p>
    </div>
  );
};

export default JobApprovedTemplate;
