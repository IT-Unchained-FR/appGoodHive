import * as React from "react";

interface EmailTemplateProps {
  name: string;
  userProfile: string;
  coverLetter: string;
}

export const JobAppliedTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props
) => {
  const { name, userProfile, coverLetter } = props;
  return (
    <div>
      <p>Hi,</p>
      <p>{name} applied to your job</p>
      <a href={userProfile}>{`${name}'s`} Profile link</a>
      <p>Cover Letter:</p>
      <p>{coverLetter}</p>
      <br />
      <br />
      <br />
      <p>GoodHive</p>
    </div>
  );
};

export default JobAppliedTemplate;
