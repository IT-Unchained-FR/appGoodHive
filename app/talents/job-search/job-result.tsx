"use client";

import { BigNumberish } from "ethers";

import { Card } from "../../components/card";

export interface JobOffer {
  id: number;
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  jobDescription: string;
  duration: string;
  image: string;
  country: string;
  countryFlag: string;
  city: string;
  rate: number;
  typeEngagement: string;
  currency: string;
  skills: string[];
  buttonText: string;
  escrow: BigNumberish;
  walletAddress?: string;
}

export default function JobResult({ jobOffers }: { jobOffers: any[] }) {
  return (
    <div className="grid grid-cols-3 gap-5 md:gap-4 sm:gap-4 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
      {jobOffers.map((jobOffer, index) => (
        <Card
          key={index}
          jobId={jobOffer.id}
          type="company"
          title={jobOffer.title}
          postedBy={jobOffer.companyName} //TODO: connect job_offers table to companies table
          postedOn="posted 2 days ago"
          image={jobOffer.image_url || "/img/company_img.png"} //TODO: connect job_offers table to companies table
          countryFlag="/img/country_flag.png" // TODO: create flag table
          city={jobOffer.city} //TODO: connect job_offers table to companies table
          budget={jobOffer.budget}
          projectType={jobOffer.projectType}
          currency={jobOffer.currency}
          description={jobOffer.jobDescription}
          skills={jobOffer.skills}
          buttonText="Apply"
          walletAddress={jobOffer.walletAddress}
          // escrowAmount={jobOffer.escrowAmount} Add escrowAmount to job_offers table
          // escrowCurrency={jobOffer.escrowCurrency} Add escrowCurrency to job_offers table
        />
      ))}
    </div>
  );
}
