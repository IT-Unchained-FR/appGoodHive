import * as React from "react";
import { EmailTemplateProps } from "@/interfaces/email-template";

const AssignmentRequestTemplate: React.FC<Readonly<EmailTemplateProps>> = (props) => (
  <div>
    <p>Hi {props.name || "there"},</p>
    <p>
      <strong>{props.companyName || "A company"}</strong> has assigned you to the job{" "}
      <strong>&quot;{props.jobTitle || "a job"}&quot;</strong> on GoodHive.
    </p>
    {props.message && (
      <p>
        Their message: <em>&quot;{props.message}&quot;</em>
      </p>
    )}
    <p>
      Log in to accept or decline:{" "}
      <a href={props.jobLink || "https://app.goodhive.io/talents/my-assignments"}
        style={{ color: "#FFC905", fontWeight: "bold", textDecoration: "none" }}>
        View Assignment
      </a>
    </p>
    <br />
    <p>Best regards,</p>
    <p>The GoodHive Team</p>
  </div>
);

export default AssignmentRequestTemplate;
