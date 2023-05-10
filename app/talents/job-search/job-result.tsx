"use client";
import { Card } from "../../components/card";

//ADD REAL DATA TO MAP THE CARD COMPONENT

export default function JobResult() {
  return (
    <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1  xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3">
      <Card
        type="company"
        title="Job Title 3"
        postedBy="by Goodhive"
        postedOn="posted 2 days ago"
        image="/img/company_img.png"
        countryFlag="/img/country_flag.png"
        city=""
        rate=""
        currency=""
        description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Apply"
        escrowFee="500"
      />{" "}
      <Card
        type="company"
        title="Job Title 3"
        postedBy="by Goodhive"
        postedOn="posted 2 days ago"
        image="/img/company_img.png"
        countryFlag="/img/country_flag.png"
        city=""
        rate=""
        currency=""
        description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Apply"
        escrowFee="500"
      />{" "}
      <Card
        type="company"
        title="Job Title 3"
        postedBy="by Goodhive"
        postedOn="posted 2 days ago"
        image="/img/company_img.png"
        countryFlag="/img/country_flag.png"
        city=""
        rate=""
        currency=""
        description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Apply"
        escrowFee="500"
      />{" "}
      <Card
        type="company"
        title="Job Title 3"
        postedBy="by Goodhive"
        postedOn="posted 2 days ago"
        image="/img/company_img.png"
        countryFlag="/img/country_flag.png"
        city=""
        rate=""
        currency=""
        description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Apply"
        escrowFee="500"
      />
    </div>
  );
}
