import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";

export const CompanyRejectedTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props,
) => {
  const recipientName = props.name || "there";
  const profileLink =
    props.jobLink || "https://app.goodhive.io/companies/my-profile";
  const feedback =
    props.feedback?.trim() ||
    "Please review your company details, make sure they are complete, and submit your profile again.";

  return (
    <div>
      <p>Hi, {recipientName}</p>
      <p>
        Your company profile needs a few changes before it can be approved on
        GoodHive.
      </p>
      <p>
        <strong>Feedback from our team:</strong> {feedback}
      </p>
      <p>
        You can update and re-submit it here:{" "}
        <a
          href={profileLink}
          style={{
            color: "#FFC905",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          {profileLink}
        </a>
      </p>
      <br />
      <p>Best regards,</p>
      <p>The GoodHive Team</p>
    </div>
  );
};

export default CompanyRejectedTemplate;
