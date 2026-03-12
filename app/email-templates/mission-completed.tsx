import * as React from "react";

interface MissionCompletedTemplateProps {
  name: string;
  companyName: string;
  jobTitle: string;
  netAmount: number;
  token: string;
  payoutsLink: string;
}

const MissionCompletedTemplate: React.FC<Readonly<MissionCompletedTemplateProps>> = (props) => (
  <div>
    <p>Hi {props.name || "there"},</p>
    <p>
      Great news! <strong>{props.companyName}</strong> has confirmed the completion of your
      mission for <strong>&quot;{props.jobTitle}&quot;</strong>.
    </p>
    <p>
      Your payout of{" "}
      <strong>
        {props.netAmount} {props.token}
      </strong>{" "}
      on Polygon has been initiated.
    </p>
    <p>
      View your payout history:{" "}
      <a
        href={props.payoutsLink}
        style={{ color: "#FFC905", fontWeight: "bold", textDecoration: "none" }}
      >
        My Payouts
      </a>
    </p>
    <br />
    <p>Best regards,</p>
    <p>The GoodHive Team</p>
  </div>
);

export default MissionCompletedTemplate;
