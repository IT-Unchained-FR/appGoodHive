import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";

const INTRO_CALL_URL = "https://calendly.com/benoit-goodhive";

export const ProfileSubmissionTalentTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = (props) => {
  const displayName = props.name || "there";

  return (
    <div>
      <p>Hi, {displayName}</p>
      <p>
        Thank you for submitting your profile. Benoit will review it shortly.
      </p>
      <p>
        In the meantime, feel free to book an intro call:{" "}
        <a
          href={INTRO_CALL_URL}
          style={{
            color: "#FFC905",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          {INTRO_CALL_URL}
        </a>
      </p>
      <br />
      <p>Best regards,</p>
      <p>The GoodHive Team</p>
    </div>
  );
};

export default ProfileSubmissionTalentTemplate;
