"use client";
import { JobCard } from "../../components/job-card";

//ADD REAL DATA TO MAP THE CARD COMPONENT

export default function JobResult() {
  return (
    <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1  xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3">
      <JobCard
        type="Job"
        title="Responsible for In publishing and graphic design, Lorem ipsum."
        postedBy="Company Name"
        details="Responsible for In publishing and graphic design, Lorem ipsum is a placeonly used to demonstrate the visual form of a document or a typeface without relying on meani  Lorem ipsum …see more"
        duration="3 months"
        image="/img/company_img.png"
        countryFlag="/img/country_flag.png"
        city="San Francisco"
        country="US"
        typeEngagement="Full time"
        ratePerHour="120"
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Connect"
      />
      <JobCard
        type="Job"
        title="Responsible for In publishing and graphic design, Lorem ipsum."
        postedBy="Company Name"
        details="Responsible for In publishing and graphic design, Lorem ipsum is a placeonly used to demonstrate the visual form of a document or a typeface without relying on meani  Lorem ipsum …see more"
        duration="3 months"
        image="/img/company_img.png"
        countryFlag="/img/country_flag.png"
        city="San Francisco"
        country="US"
        typeEngagement="Full time"
        ratePerHour="120"
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Connect"
      />
      <JobCard
        type="Job"
        title="Responsible for In publishing and graphic design, Lorem ipsum."
        postedBy="Company Name"
        details="Responsible for In publishing and graphic design, Lorem ipsum is a placeonly used to demonstrate the visual form of a document or a typeface without relying on meani  Lorem ipsum …see more"
        duration="3 months"
        image="/img/company_img.png"
        countryFlag="/img/country_flag.png"
        city="San Francisco"
        country="US"
        typeEngagement="Full time"
        ratePerHour="120"
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Connect"
      />
      <JobCard
        type="Job"
        title="Responsible for In publishing and graphic design, Lorem ipsum."
        postedBy="Company Name"
        details="Responsible for In publishing and graphic design, Lorem ipsum is a placeonly used to demonstrate the visual form of a document or a typeface without relying on meani  Lorem ipsum …see more"
        duration="3 months"
        image="/img/company_img.png"
        countryFlag="/img/country_flag.png"
        city="San Francisco"
        country="US"
        typeEngagement="Full time"
        ratePerHour="120"
        skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
        buttonText="Connect"
      />
    </div>
  );
}
