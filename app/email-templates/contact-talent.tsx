import * as React from "react";

interface EmailTemplateProps {
  name: string;
  toUserName: string;
  userProfile: string;
  message: string;
  jobLink?: string;
}

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
        Please visit our profile on GoodHive:
        <a href={userProfile}>{`Company profile url`}</a>
      </p>
      <br />
      <br />
      <p>GoodHive Team</p>
    </div>
  );
};

export default ContactTalentTemplate;
