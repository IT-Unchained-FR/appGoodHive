"use client";
import { BigNumberish } from "ethers";
import { Card } from "../../components/card";

interface JobOffer {
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  description: string;
  duration: string;
  image: string;
  country: string;
  countryFlag: string;
  city: string;
  rate: BigNumberish;
  typeEngagement: string;
  currency: string;
  skills: string[];
  buttonText: string;
}

export default function JobResult({ jobOffers }: { jobOffers: JobOffer[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobOffers.map((jobOffer, index) => (
        <Card
          key={index}
          type="company"
          title={jobOffer.title}
          postedBy="Company Name" //TODO: connect job_offers table to companies table
          postedOn="posted 2 days ago"
          image="/img/company_img.png" //TODO: connect job_offers table to companies table
          countryFlag="/img/country_flag.png" // TODO: create flag table
          city="City" //TODO: connect job_offers table to companies table
          rate={jobOffer.rate}
          currency={jobOffer.currency}
          description={jobOffer.description}
          skills={jobOffer.skills}
          buttonText="Apply"
          escrowFee="500"
        />
      ))}
    </div>
  );
}
