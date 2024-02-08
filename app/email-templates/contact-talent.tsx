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
      <p>
        Discover more about us on GoodHive by visiting our{" "}
        <a href={userProfile}>company profile</a>
      </p>
      <br />
      <p>GoodHive Team</p>
      <a href="mailto:contact@goodhive.io">contact@goodhive.io</a>
      <p>GoodHive, 39 rue de l&apos;Arrivée 95880 Enghien les Bains - France</p>
    </div>
  );
};

export default ContactTalentTemplate;
