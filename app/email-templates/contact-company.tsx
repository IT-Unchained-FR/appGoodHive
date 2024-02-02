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
      <br />
      <p>
        Find {name}&apos;s Goodhive profile here :{" "}
        <a href={userProfile}>{`Talent's profile Url`}</a>
      </p>
      <br />
      <br />
      <p>GoodHive Team</p>
    </div>
  );
};

export default ContactCompanyTemplate;
