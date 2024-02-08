import * as React from "react";
import { EmailTemplateProps } from "@/interfaces/email-template";

export const ContactCompanyTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props
) => {
  const { name, toUserName, userProfile, message } = props;
  return (
    <div>
      <p>Hello {toUserName},</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{message}</p>
      <p>
        Find {name}&apos;s Goodhive profile here :{" "}
        <a href={userProfile}>{`Talent's profile Url`}</a>
      </p>
      <br />
      <br />
      <p>GoodHive Team</p>
      <a href="mailto:contact@goodhive.io">contact@goodhive.io</a>
      <p>GoodHive, 39 rue de l&apos;Arrivée 95880 Enghien les Bains - France</p>
    </div>
  );
};

export default ContactCompanyTemplate;
