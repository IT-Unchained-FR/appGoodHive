import * as React from "react";

interface EmailTemplateProps {
  name: string;
  userProfile: string;
  message: string;
}

export const ContactTalentTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props
) => {
  const { name, userProfile, message } = props;
  return (
    <div>
      <p>Hi,</p>
      <p>{name} interested in your profile</p>
      <a href={userProfile}>{name} company link</a>
      <p>{message}</p>
      <br />
      <br />
      <br />
      <p>GoodHive</p>
    </div>
  );
};

export default ContactTalentTemplate;
