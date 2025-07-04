"use client";
import moment from "moment";

import { BigNumberish } from "ethers";

import { Card } from "../../components/card";
import "@/app/styles/rich-text.css";

// TypeScript interface for the actual job offer data from API
export interface ApiJobOffer {
  id: string;
  title: string;
  companyName: string;
  posted_at: Date;
  image_url: string;
  country: string;
  city: string;
  budget: string;
  projectType: "fixed" | "hourly";
  currency?: string;
  jobDescription: string;
  skills: string[];
  walletAddress?: string;
  mentor: boolean;
  recruiter: boolean;
  escrowAmount: string | null;
  user_id: string;
  in_saving_stage: boolean;
  duration: string;
  typeEngagement: string;
  published: boolean;
}

// Legacy interface for modal (keeping for compatibility)
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

export default function JobResult({ jobOffers }: { jobOffers: ApiJobOffer[] }) {
  return (
    <div className="grid grid-cols-3 gap-5 md:gap-4 sm:gap-4 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
      {jobOffers.map((jobOffer, index) => {
        if (jobOffer.in_saving_stage) return null;
        return (
          <Card
            uniqueId={jobOffer?.user_id}
            key={`job-${jobOffer.id}-${index}`}
            jobId={Number(jobOffer.id) || index}
            type="company"
            title={jobOffer.title || "Job Position"}
            postedBy={jobOffer.companyName || "Company"}
            postedOn={`Posted On ${moment(jobOffer.posted_at).format(
              "MMMM Do YYYY",
            )}`}
            image={jobOffer.image_url || "/img/company_img.png"}
            country={jobOffer.country || ""}
            city={jobOffer.city || "Remote"}
            budget={Number(jobOffer.budget) || 0}
            projectType={jobOffer.projectType || "hourly"}
            currency={jobOffer.currency || "€"}
            description={jobOffer.jobDescription || "No description available for this position."}
            skills={jobOffer.skills && Array.isArray(jobOffer.skills) ? jobOffer.skills : []}
            buttonText="Apply"
            walletAddress={jobOffer.walletAddress}
            mentor={jobOffer.mentor || false}
            recruiter={jobOffer.recruiter || false}
            escrowAmount={jobOffer.escrowAmount || "0"}
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
      <div className="bg-white p-8 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{jobOffer.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="rich-text-content mt-4 prose prose-gray max-w-none">
          <div dangerouslySetInnerHTML={{ __html: jobOffer.jobDescription }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold text-gray-600">Duration:</span>
              <p className="text-gray-900">{jobOffer.duration}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-600">Location:</span>
              <p className="text-gray-900">{jobOffer.city}, {jobOffer.country}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold text-gray-600">Rate:</span>
              <p className="text-gray-900 font-semibold">{jobOffer.rate} {jobOffer.currency}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-600">Type:</span>
              <p className="text-gray-900">{jobOffer.typeEngagement}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-gray-900">Required Skills:</h3>
          <div className="flex flex-wrap gap-2">
            {jobOffer.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium border border-amber-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
          >
            Close
          </button>
          <button className="px-6 py-2 bg-[#FFC905] hover:bg-[#FF8C05] text-black rounded-lg transition-colors duration-200 font-medium shadow-sm">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};
