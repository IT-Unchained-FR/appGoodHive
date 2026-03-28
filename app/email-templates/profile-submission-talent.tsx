import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";
import { BenoitIntroCallUrl } from "@/app/constants/common";

export const ProfileSubmissionTalentTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = (props) => {
  const displayName = props.name || "there";

  return (
    <div>
      <p>Hi, {displayName}</p>
      <p>
        Thank you for submitting your profile. Our GoodHive team will review it shortly.
      </p>
      <p>
        In the meantime, please book your assessment interview:{" "}
        <a
          href={BenoitIntroCallUrl}
          style={{
            color: "#FFC905",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          {BenoitIntroCallUrl}
        </a>
      </p>
      <br />
      <p>Best regards,</p>
      <p>The GoodHive Team</p>
    </div>
  );
};

export default ProfileSubmissionTalentTemplate;
