import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";

export const JobSubmittedTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props,
) => {
  const companyName = props.companyName || props.name || "A GoodHive company";
  const jobTitle = props.jobTitle || "Untitled job";
  const adminLink = props.jobLink || "https://app.goodhive.io/admin";

  return (
    <div>
      <p>Hi Benoit,</p>
      <p>
        A new job has been submitted for review on GoodHive.
      </p>
      <p>
        <strong>Job title:</strong> {jobTitle}
      </p>
      <p>
        <strong>Company:</strong> {companyName}
      </p>
      <p>
        Review it here:{" "}
        <a
          href={adminLink}
          style={{
            color: "#FFC905",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          {adminLink}
        </a>
      </p>
      <br />
      <p>GoodHive System</p>
    </div>
  );
};

export default JobSubmittedTemplate;
