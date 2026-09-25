import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";

export const CompanyApprovedTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props,
) => {
  const recipientName = props.name || "there";
  const createJobLink =
    props.jobLink || "https://app.goodhive.io/companies/create-job";

  return (
    <div>
      <p>Hi, {recipientName}</p>
      <p>
        Great news! Your company profile has been reviewed and approved by the
        GoodHive team.
      </p>
      <p>
        You can now create your first job. Describe the role, skills and
        budget, then submit it for review. Once it&apos;s approved, you publish
        it on the blockchain and add a provision fund to make it live.
      </p>
      <p>
        <a
          href={createJobLink}
          style={{
            color: "#FFC905",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Create your first job →
        </a>
      </p>
      <br />
      <p>Best regards,</p>
      <p>The GoodHive Team</p>
    </div>
  );
};

export default CompanyApprovedTemplate;
