import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";

export const ProfileSubmissionAdminTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = (props) => {
  const displayName = props.name || "A GoodHive talent";

  return (
    <div>
      <p>Hi Benoit,</p>
      <p>{displayName} has submitted their profile for review.</p>
      <br />
      <p>GoodHive System</p>
    </div>
  );
};

export default ProfileSubmissionAdminTemplate;
