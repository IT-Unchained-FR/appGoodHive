"use client";
import { Card } from "../../components/card";

//ADD REAL DATA TO MAP THE CARD COMPONENT

export default function JobResult() {
  return (
    <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1  xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3">
      <Card
        type="talent"
        title="Talent 3 Position"
        postedBy="Talent Name"
        postedOn="Active 2 days ago"
        image="/img/talent_avatar.png"
        countryFlag="/img/country_flag.png"
        city="San Francisco"
        rate="120"
        currency="USD"
        description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod."
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Connect"
        escrowFee=""
      />
      <Card
        type="talent"
        title="Talent 3 Position"
        postedBy="Talent Name"
        postedOn="Active 2 days ago"
        image="/img/talent_avatar.png"
        countryFlag="/img/country_flag.png"
        city="San Francisco"
        rate="120"
        currency="USD"
        description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod."
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Connect"
        escrowFee=""
      />
      <Card
        type="talent"
        title="Talent 3 Position"
        postedBy="Talent Name"
        postedOn="Active 2 days ago"
        image="/img/talent_avatar.png"
        countryFlag="/img/country_flag.png"
        city="San Francisco"
        rate="120"
        currency="USD"
        description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod."
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Connect"
        escrowFee=""
      />
      <Card
        type="talent"
        title="Talent 3 Position"
        postedBy="Talent Name"
        postedOn="Active 2 days ago"
        image="/img/talent_avatar.png"
        countryFlag="/img/country_flag.png"
        city="San Francisco"
        rate="120"
        currency="USD"
        description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod."
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Connect"
        escrowFee=""
      />
    </div>
  );
}
