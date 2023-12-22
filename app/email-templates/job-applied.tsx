import * as React from "react";

interface EmailTemplateProps {
  name: string;
  userProfile: string;
}

export const JobAppliedTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props
) => {
  const { name, userProfile } = props;
  return (
    <div>
      <p>Hi,</p>
      <p>{name} applied in your job</p>
      <a href={userProfile}>User Profile link</a>
      <br />
      <br />
      <br />
      <p>GoodHive</p>
    </div>
  );
};

export default JobAppliedTemplate;
