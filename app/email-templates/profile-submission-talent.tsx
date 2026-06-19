import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";
import { GoodHiveIntroCallUrl } from "@/app/constants/common";

export const ProfileSubmissionTalentTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = (props) => {
  const displayName = props.name || "there";

  return (
    <div>
      <p>Hi {displayName},</p>
      <p>
        Thanks for creating your profile on GoodHive!
      </p>
      <p>
        Quick heads-up: your profile isn&apos;t visible to recruiters yet. Every
        profile on GoodHive is validated through an interview, we answer your
        questions, walk you through how the platform works, and run a detailed
        assessment. That&apos;s how we keep the talent pool credible and why
        clients trust it.
      </p>
      {props.referralLink && (
        <p>
          In the meantime, if you know Web3 talents or clients who could be a
          great fit, feel free to recommend them. Your referral link stays
          active and earns you rewards:
          {" "}
          <a
            href={props.referralLink}
            style={{
              color: "#FFC905",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            {props.referralLink}
          </a>
        </p>
      )}
      <p>
        Book your slot here:{" "}
        <a
          href={GoodHiveIntroCallUrl}
          style={{
            color: "#FFC905",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          {GoodHiveIntroCallUrl}
        </a>
      </p>
      <br />
      <p>Talk soon,</p>
      <p>The GoodHive Team</p>
    </div>
  );
};

export default ProfileSubmissionTalentTemplate;
