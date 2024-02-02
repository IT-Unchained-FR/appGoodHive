import * as React from "react";
import { EmailTemplateProps } from "@/interfaces/email-template";

export const ContactTalentTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props
) => {
  const { toUserName, userProfile, message } = props;
  return (
    <div>
      <p>Hello {toUserName},</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{message}</p>
      <br />
      <p>
        Discover more about us on GoodHive by visiting our{" "}
        <a href={userProfile}>company profile</a>
      </p>
      <br />
      <p>GoodHive Team</p>
    </div>
  );
};

export default ContactTalentTemplate;
