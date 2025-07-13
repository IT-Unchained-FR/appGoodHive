"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Card } from "@/app/components/card";
import { CompanyBio } from "@/app/components/companies/company-bio-section";
import { CompanyContactBtn } from "@/app/components/companies/company-contact-btn";
import { CompanySocialMediaAndContact } from "@/app/components/companies/profile-social-media-and-contact";
import { getJobBalance } from "@/app/lib/blockchain/contracts/GoodhiveJobContract";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { JobCard } from "@components/job-card";

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

export default function CompanyProfilePage(
  context: CompanyProfilePageProps,
) {
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
          const singleJobResult = await fetchSingleJob(jobId as unknown as number);
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
      if (!jobs.length && !singleJob) {
        setIsLoadingBalances(false);
        return;
      }

      try {
        setIsLoadingBalances(true);
        const balancePromises: Promise<{ jobId: string; balance: number }>[] = [];

        // Fetch balance for featured job using block_id
        if (singleJob?.block_id) {
          balancePromises.push(
            getJobBalance(singleJob.block_id.toString()).then(balance => ({
              jobId: singleJob.id.toString(),
              balance
            }))
          );
        }

        // Fetch balances for all jobs using block_id
        jobs.forEach(job => {
          if (job.block_id && job.id !== singleJob?.id) {
            balancePromises.push(
              getJobBalance(job.block_id.toString()).then(balance => ({
                jobId: job.id.toString(),
                balance
              }))
            );
          }
        });

        const balanceResults = await Promise.allSettled(balancePromises);
        const balances: { [key: string]: number } = {};

        balanceResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            balances[result.value.jobId] = result.value.balance;
          } else {
            console.error('Failed to fetch balance:', result.reason);
          }
        });

        setJobBalances(balances);
      } catch (error) {
        console.error("Error fetching job balances:", error);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [jobs, singleJob]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FFC905]"></div>
      </div>
    );
  }

  return (
    <main className="relative pt-16 min-h-screen bg-gradient-to-b from-yellow-50/30 to-white">
      {/* Hero Background */}
      <div className="bg-gradient-to-r from-yellow-400 via-[#FFC905] to-yellow-500 absolute w-full top-0 left-0 h-32 z-1">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute top-0 right-0 w-40 h-32 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <pattern id="honeycomb" x="0" y="0" width="20" height="17.32" patternUnits="userSpaceOnUse">
                <polygon points="10,0 20,5.77 20,11.55 10,17.32 0,11.55 0,5.77" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#honeycomb)" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto flex mb-20 lg:flex-col md:flex-col sm:flex-col lg:gap-6 md:gap-6 sm:gap-6 px-4 relative z-10">
        {/* Company Profile Sidebar */}
        <div className="w-2/6 lg:w-full md:w-full sm:w-full mr-6 lg:mr-0 md:mr-0 sm:mr-0 flex flex-col">
          <div className="relative bg-white rounded-2xl flex flex-col items-center p-6 shadow-xl border border-yellow-100/50 backdrop-blur-sm">
            {/* Profile Image */}
            <div className="flex flex-col items-center justify-center w-full mt-2 mb-6">
              <div
                className="relative h-[180px] w-[180px] flex items-center justify-center cursor-pointer bg-gradient-to-br from-yellow-100 to-amber-100 border-4 border-white shadow-lg"
                style={{
                  clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                }}
              >
                <Image
                  className="object-cover"
                  src={image_url || "/img/placeholder-image.png"}
                  alt="Company logo"
                  fill
                />
              </div>
              {/* Decorative bee icon */}
              <div className="absolute mt-40 ml-32 w-8 h-8 bg-[#FFC905] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-sm">🐝</span>
              </div>
            </div>

            {/* Company Info */}
            <div className="text-center mb-6">
              <h1 className="text-gray-800 text-2xl font-bold mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text">
                {designation || "Company Name"}
              </h1>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-base">{city}, {country}</span>
              </div>
            </div>

            {/* Contact Button */}
            <div className="flex w-full justify-center mb-8">
              <CompanyContactBtn toEmail={email} toUserName={designation} />
            </div>

            {/* Bio Section */}
            <div className="flex flex-col w-full justify-start">
              <h3 className="text-gray-800 text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-[#FFC905]">🍯</span>
                About Company
              </h3>
              <div className="mb-8">
                <CompanyBio text={headline} />
              </div>

              {/* Contact & Social */}
              <div className="mb-6">
                <h4 className="text-gray-800 text-base font-semibold mb-3 flex items-center gap-2">
                  <span className="text-[#FFC905]">📞</span>
                  Contact & Social
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

        {/* Jobs Content */}
        <div className="w-4/6 lg:w-full md:w-full sm:w-full bg-white relative rounded-2xl flex flex-col p-6 shadow-xl border border-yellow-100/50 backdrop-blur-sm">
          {/* Featured Job Section */}
          {userId && singleJob && (
            <div className="w-full flex flex-col mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FFC905] to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">⭐</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text">
                  Featured Job
                </h2>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200/50 shadow-sm">
                {isLoadingBalances ? (
                  <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC905]"></div>
                    <span>Loading balance...</span>
                  </div>
                ) : (
                  <div className="mb-3 flex items-center gap-2 text-sm">
                    <span className="font-semibold text-green-700">💰 Escrow Balance:</span>
                    <span className="text-green-600 font-bold">
                      ${jobBalances[singleJob.id]?.toFixed(2) || '0.00'} USDC
                    </span>
                  </div>
                )}
                <JobCard
                  key={singleJob.id}
                  id={singleJob.id}
                  type="Job"
                  title={singleJob.title}
                  postedBy={singleJob.companyName}
                  details={singleJob.description}
                  duration={singleJob.duration}
                  image={singleJob.image_url || "/img/company_img.png"}
                  countryFlag={generateCountryFlag(singleJob.country) as string}
                  city={singleJob.city}
                  country={singleJob.country}
                  typeEngagement={singleJob.typeEngagement}
                  jobType={singleJob.jobType}
                  projectType={singleJob.projectType}
                  budget={singleJob.budget}
                  skills={singleJob.skills}
                  buttonText="Connect"
                  walletAddress={singleJob.walletAddress}
                  companyEmail={email}
                  escrowAmount={singleJob.escrowAmount}
                  user_id={singleJob.user_id}
                />
              </div>
            </div>
          )}

          {/* All Jobs Section */}
          <div className="w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">💼</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text">
                All Job Listings
                <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {jobs.length} {jobs.length === 1 ? 'position' : 'positions'}
                </span>
              </h2>
            </div>

            {jobs.length > 0 ? (
              <div className="grid w-full grid-cols-2 gap-6 xl:grid-cols-1 lg:grid-cols-1 md:grid-cols-1 sm:grid-cols-1">
                {jobs.map((job) => {
                  // Skip the featured job to avoid duplication
                  if (job.id === singleJob?.id) return null;

                  const {
                    id,
                    title,
                    companyName,
                    description,
                    city,
                    budget,
                    projectType,
                    skills,
                    image_url,
                    walletAddress,
                    country,
                    escrowAmount,
                    postedAt,
                  } = job;

                  const getRelativeTime = (postedAt: string) => {
                    const now = new Date();
                    const posted = new Date(postedAt);
                    const diffMs = now.getTime() - posted.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    const diffMonths = Math.floor(diffDays / 30);
                    const diffYears = Math.floor(diffDays / 365);

                    if (diffYears > 0)
                      return `Posted ${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
                    if (diffMonths > 0)
                      return `Posted ${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
                    if (diffDays > 0)
                      return `Posted ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
                    if (diffHours > 0)
                      return `Posted ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
                    if (diffMins > 0)
                      return `Posted ${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
                    return "Posted just now";
                  };

                  return (
                    <div key={id} className="transform transition-all duration-200 hover:scale-[1.02]">
                      {isLoadingBalances ? (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FFC905]"></div>
                          <span>Loading balance...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <span className="font-semibold text-green-700">💰 Balance:</span>
                          <span className="text-green-600 font-bold">
                            ${jobBalances[id]?.toFixed(2) || '0.00'} USDC
                          </span>
                        </div>
                      )}
                      <Card
                        uniqueId={userId}
                        mentor={job.mentor === "true"}
                        recruiter={job.recruiter === "true"}
                        jobId={id}
                        type="company"
                        title={title}
                        postedBy={companyName}
                        postedOn={getRelativeTime(postedAt)}
                        image={image_url || "/img/company_img.png"}
                        country={country}
                        city={city}
                        budget={budget}
                        projectType={projectType}
                        currency="USD"
                        description={description}
                        skills={skills}
                        buttonText="Apply"
                        walletAddress={walletAddress}
                        escrowAmount={escrowAmount}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Available</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  This company hasn't posted any job listings yet. Check back later for new opportunities!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
