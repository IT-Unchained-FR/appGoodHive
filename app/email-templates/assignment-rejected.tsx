import * as React from "react";
import { EmailTemplateProps } from "@/interfaces/email-template";

const AssignmentRejectedTemplate: React.FC<Readonly<EmailTemplateProps>> = (props) => (
  <div>
    <p>Hi {props.name || "there"},</p>
    <p>
      <strong>{props.toUserName || "The talent"}</strong> has declined your assignment
      for <strong>&quot;{props.jobTitle || "your job"}&quot;</strong>.
    </p>
    <p>
      You can assign another talent from your job dashboard:{" "}
      <a href={props.jobLink || "https://app.goodhive.io/companies/dashboard/jobs"}
        style={{ color: "#FFC905", fontWeight: "bold", textDecoration: "none" }}>
        Manage Jobs
      </a>
    </p>
    <br />
    <p>Best regards,</p>
    <p>The GoodHive Team</p>
  </div>
);

export default AssignmentRejectedTemplate;
