"use client";
import moment from "moment";

import { BigNumberish } from "ethers";

import { Card } from "../../components/card";
import "@/app/styles/rich-text.css";

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
  city: string;
  rate: number;
  typeEngagement: string;
  currency: string;
  skills: string[];
  buttonText: string;
  escrowAmount: string;
  walletAddress?: string;
}

export default function JobResult({ jobOffers }: { jobOffers: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {jobOffers.map((jobOffer, index) => {
        if (jobOffer.in_saving_stage) return null;
        return (
          <Card
            uniqueId={jobOffer?.user_id}
            key={index}
            jobId={jobOffer.id}
            type="company"
            title={jobOffer.title}
            postedBy={jobOffer.company_name}
            postedOn={`Posted On ${moment(jobOffer.posted_at).format(
              "MMMM Do YYYY",
            )}`}
            image={jobOffer.image_url || "/img/company_img.png"}
            country={jobOffer.country}
            city={jobOffer.city}
            budget={jobOffer.budget}
            projectType={jobOffer.project_type}
            currency={jobOffer.currency}
            description={jobOffer.description}
            skills={jobOffer.skills}
            buttonText="Apply"
            walletAddress={jobOffer.wallet_address}
            mentor={jobOffer.mentor}
            recruiter={jobOffer.recruiter}
            escrowAmount={jobOffer.escrow_amount}
          />
        );
      })}
    </div>
  );
}

export const JobResultModal = ({
  jobOffer,
  onClose,
}: {
  jobOffer: JobOffer;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{jobOffer.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="rich-text-content mt-4">
          <div dangerouslySetInnerHTML={{ __html: jobOffer.jobDescription }} />
        </div>

        <div className="mt-4">
          <p className="text-gray-600">
            <strong>Duration:</strong> {jobOffer.duration}
          </p>
          <p className="text-gray-600">
            <strong>Location:</strong> {jobOffer.city}, {jobOffer.country}
          </p>
          <p className="text-gray-600">
            <strong>Rate:</strong> {jobOffer.rate} {jobOffer.currency}
          </p>
          <p className="text-gray-600">
            <strong>Type:</strong> {jobOffer.typeEngagement}
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold mb-2">Required Skills:</h3>
          <div className="flex flex-wrap gap-2">
            {jobOffer.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-gray-100 px-3 py-1 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
