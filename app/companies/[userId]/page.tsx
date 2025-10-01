"use client";

import { useEffect, useState } from "react";
import "@/app/styles/company-profile-enhanced.scss";

import { AnimatedJobSection } from "@/app/components/companies/animated-job-section";
import { CompanyBio } from "@/app/components/companies/company-bio-section";
import { CompanyContactBtn } from "@/app/components/companies/company-contact-btn";
import { CompanyHeroSection } from "@/app/components/companies/company-hero-section";
import { CompanyLoadingSpinner } from "@/app/components/companies/company-loading-spinner";
import { CompanySocialMediaAndContact } from "@/app/components/companies/profile-social-media-and-contact";

export const revalidate = 0;

type CompanyProfilePageProps = {
  params: {
    userId: string;
  };
  searchParams: {
    id?: number;
  };
};

// Helper function to fetch company data from API
async function fetchCompanyData(userId: string) {
  const response = await fetch(`/api/companies/my-profile?userId=${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch company data: ${response.statusText}`);
  }
  return await response.json();
}

// Helper function to fetch company jobs from API
async function fetchCompanyJobs(userId: string) {
  const response = await fetch(`/api/companies/jobs?userId=${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch company jobs: ${response.statusText}`);
  }
  return await response.json();
}

// Helper function to fetch single job from API
async function fetchSingleJob(jobId: number) {
  const response = await fetch(`/api/companies/job-data?id=${jobId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch single job: ${response.statusText}`);
  }
  return await response.json();
}

export default function CompanyProfilePage(context: CompanyProfilePageProps) {
  const { userId } = context.params;
  const { id: jobId } = context.searchParams;

  const [profileData, setProfileData] = useState<any>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [singleJob, setSingleJob] = useState<any>(null);
  const [jobBalances, setJobBalances] = useState<{ [key: string]: number }>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch company profile data with error handling
      try {
        const profileResult = await fetchCompanyData(userId);
        setProfileData(profileResult);
      } catch (error) {
        console.error("Failed to fetch company data:", error);
        setProfileData({});
      }

      // Fetch company jobs with error handling
      try {
        const jobsResult = await fetchCompanyJobs(userId);
        setJobs(jobsResult);
      } catch (error) {
        console.error("Failed to fetch company jobs:", error);
        setJobs([]);
      }

      // Fetch single job with error handling
      if (jobId) {
        try {
          const singleJobResult = await fetchSingleJob(
            jobId as unknown as number,
          );
          setSingleJob(singleJobResult);
        } catch (error) {
          console.error("Failed to fetch single job:", error);
          setSingleJob(null);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [userId, jobId]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!singleJob) {
        setIsLoadingBalances(false);
        return;
      }

      try {
        setIsLoadingBalances(true);

        // Only fetch balance for featured job using block_id
        if (singleJob?.block_id) {
          const balance = await getJobBalance(singleJob.block_id.toString());
          setJobBalances({ [singleJob.id.toString()]: balance });
        }
      } catch (error) {
        console.error("Error fetching job balance:", error);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [singleJob]);

  const {
    headline,
    designation,
    address: streetAddress,
    country,
    city,
    phone_country_code,
    phone_number,
    email,
    telegram,
    linkedin,
    twitter,
    github,
    stackoverflow,
    portfolio,
    image_url,
    user_id,
  } = profileData;

  if (isLoading) {
    return (
      <CompanyLoadingSpinner
        size="large"
        message="Loading company profile..."
        subMessage="Gathering the sweetest details"
      />
    );
  }

  return (
    <main className="company-profile-main">
      {/* Enhanced Hero Section */}
      <CompanyHeroSection
        companyName={designation || "Company Name"}
        city={city || "City"}
        country={country || "Country"}
        imageUrl={image_url}
        headline={headline}
        jobCount={jobs.length}
        isVerified={true}
      />

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-8 space-y-8">

        {/* About and Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in-up delay-200">
          {/* Left Column: About Company */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 hover-shadow-lift transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="bg-yellow-400 rounded-full p-3 mr-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">
                About Company
              </h3>
            </div>
            <div className="text-gray-600 max-w-none">
              <CompanyBio text={headline} />
            </div>
          </div>

          {/* Right Column: Contact & Socials */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover-shadow-lift transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="bg-yellow-400 rounded-full p-3 mr-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">Contact</h3>
            </div>

            <div className="space-y-6">
              <CompanyContactBtn toEmail={email} toUserName={designation} />

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-xl font-semibold text-gray-700 mb-4">
                  Connect With Us
                </h4>
                <CompanySocialMediaAndContact
                  twitter={twitter}
                  linkedin={linkedin}
                  telegram={telegram}
                  github={github}
                  stackoverflow={stackoverflow}
                  portfolio={portfolio}
                  email={email}
                  phone_country_code={phone_country_code}
                  phone_number={phone_number}
                  streetAddress={streetAddress}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Job Listings */}
        <div className="fade-in-up delay-400">
          <AnimatedJobSection
            jobs={jobs}
            featuredJob={singleJob}
            companyEmail={email}
            userId={userId}
            jobBalances={jobBalances}
            isLoadingBalances={isLoadingBalances}
          />
        </div>
      </div>
    </main>
  );
}
