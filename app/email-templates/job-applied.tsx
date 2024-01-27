import * as React from "react";

interface EmailTemplateProps {
  name: string;
  toUserName: string;
  userProfile: string;
  message: string;
  jobLink?: string;
}

export const JobAppliedTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  props
) => {
  const { name, toUserName, userProfile, message, jobLink } = props;
  return (
    <div>
      <p>Hello {toUserName},</p>

      <p>Cover Letter:</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{message}</p>
      <br />
      <p>
        Find {name}&apos;s Goodhive profile here :{" "}
        <a href={userProfile}>{`Talent's profile Url`}</a>
      </p>
      <a href={jobLink}>Your Job Url</a>
      <br />
      <br />
      <p>GoodHive Team</p>
    </div>
  );
};

export default JobAppliedTemplate;
