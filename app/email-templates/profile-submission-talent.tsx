import * as React from "react";

import { EmailTemplateProps } from "@/interfaces/email-template";
import { GoodHiveIntroCallUrl } from "@/app/constants/common";

export const ProfileSubmissionTalentTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = (props) => {
  const displayName = props.name || "there";

  return (
    <div>
      <p>Hi, {displayName}</p>
      <p>
        Big cheers for hopping on board at GoodHive! You&apos;re now part of
        GoodHive&apos;s journey toward shaping the Future of Work, and we&apos;re
        excited to have you with us.
      </p>
      <p>
        Your profile has been received and sent for review. Our team will review
        it shortly.
      </p>
      <p>
        In the meantime, please book your assessment interview here:{" "}
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
      <p>
        We&apos;re looking forward to learning more about your background, your
        goals, and the kind of opportunities you want to unlock with GoodHive.
      </p>
      {props.referralLink && (
        <p>
          If you know talented people who should join too, you can also share
          your referral link:{" "}
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
      <br />
      <p>Best regards,</p>
      <p>The GoodHive Team</p>
    </div>
  );
};

export default ProfileSubmissionTalentTemplate;
