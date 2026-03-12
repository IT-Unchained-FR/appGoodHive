import * as React from "react";
import { EmailTemplateProps } from "@/interfaces/email-template";

const AssignmentAcceptedTemplate: React.FC<Readonly<EmailTemplateProps>> = (props) => (
  <div>
    <p>Hi {props.name || "there"},</p>
    <p>
      Great news! <strong>{props.toUserName || "The talent"}</strong> has accepted your
      assignment for <strong>&quot;{props.jobTitle || "your job"}&quot;</strong>.
    </p>
    <p>
      You can now message them to coordinate next steps:{" "}
      <a href="https://app.goodhive.io/messages"
        style={{ color: "#FFC905", fontWeight: "bold", textDecoration: "none" }}>
        Open Messages
      </a>
    </p>
    <br />
    <p>Best regards,</p>
    <p>The GoodHive Team</p>
  </div>
);

export default AssignmentAcceptedTemplate;
