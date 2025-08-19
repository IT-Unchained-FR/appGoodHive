"use client";

import { useState, useEffect } from "react";
import { Briefcase, DollarSign, MapPin, Clock, Star, Users } from "lucide-react";
import Image from "next/image";
import { Card } from "@/app/components/card";
import { JobCard } from "@components/job-card";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";

interface Job {
  id: number;
  title: string;
  companyName: string;
  description: string;
  city: string;
  country: string;
  budget: number;
  projectType: string;
  skills: string[];
  image_url?: string;
  walletAddress: string;
  escrowAmount: number;
  postedAt: string;
  currency: string;
  duration?: string;
  typeEngagement?: string;
  jobType?: string;
  block_id?: string;
  user_id: string;
  talent?: boolean;
  mentor?: boolean;
  recruiter?: boolean;
}

interface AnimatedJobSectionProps {
  jobs: Job[];
  featuredJob?: Job | null;
  companyEmail?: string;
  userId: string;
  jobBalances?: { [key: string]: number };
  isLoadingBalances?: boolean;
  className?: string;
}

export const AnimatedJobSection = ({
  jobs,
  featuredJob,
  companyEmail,
  userId,
  jobBalances = {},
  isLoadingBalances = false,
  className = "",
}: AnimatedJobSectionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
    <div className={`w-full space-y-8 ${className}`}>
      {/* Featured Job Section */}
      {featuredJob && (
        <div
          className={`w-full ${
            isVisible ? "animate-slide-in-up" : "opacity-0"
          }`}
        >
          <div className="modern-card p-6 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="honeycomb-pattern w-full h-full animate-float-slow"></div>
            </div>
            
            {/* Section Header */}
            <div className="section-header">
              <div className="section-icon bg-gradient-to-r from-amber-500 to-yellow-500">
                <Star className="w-6 h-6 text-white fill-current" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Featured Position</h2>
                <p className="text-sm text-gray-600 mt-1">Our highlighted opportunity</p>
              </div>
            </div>

            {/* Featured Job Content */}
            <div className="relative">
              {/* Escrow Balance Display */}
              {isLoadingBalances ? (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC905]"></div>
                  <span>Loading escrow balance...</span>
                </div>
              ) : (
                <div className="mb-4 flex items-center gap-2 text-sm bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700">
                      Escrow Balance: ${jobBalances[featuredJob.id]?.toFixed(2) || "0.00"} USDC
                    </p>
                    <p className="text-xs text-green-600">Funds secured and ready</p>
                  </div>
                </div>
              )}

              {/* Enhanced Featured Job Card */}
              <div className="relative p-1 bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 rounded-3xl animate-honeycomb-glow">
                <div className="bg-white rounded-3xl p-6">
                  <JobCard
                    key={featuredJob.id}
                    id={featuredJob.id}
                    type="Job"
                    title={featuredJob.title}
                    postedBy={featuredJob.companyName}
                    details={featuredJob.description}
                    duration={featuredJob.duration}
                    image={featuredJob.image_url || "/img/company_img.png"}
                    countryFlag={generateCountryFlag(featuredJob.country) as string}
                    city={featuredJob.city}
                    country={featuredJob.country}
                    typeEngagement={featuredJob.typeEngagement}
                    jobType={featuredJob.jobType}
                    projectType={featuredJob.projectType}
                    budget={featuredJob.budget}
                    skills={featuredJob.skills}
                    buttonText="Apply Now"
                    walletAddress={featuredJob.walletAddress}
                    companyEmail={companyEmail}
                    escrowAmount={featuredJob.escrowAmount}
                    user_id={featuredJob.user_id}
                    talent={featuredJob.talent}
                    mentor={featuredJob.mentor}
                    recruiter={featuredJob.recruiter}
                  />
                </div>
              </div>
            </div>

            {/* Floating decorative elements */}
            <div className="absolute top-4 right-4 opacity-20">
              <span className="text-3xl animate-float">🌟</span>
            </div>
          </div>
        </div>
      )}

      {/* All Jobs Section */}
      <div
        className={`w-full ${
          isVisible ? "animate-slide-in-up delay-300" : "opacity-0"
        }`}
      >
        <div className="modern-card p-6 relative">
          {/* Section Header */}
          <div className="section-header">
            <div className="section-icon bg-gradient-to-r from-blue-500 to-indigo-600">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                All Open Positions
                <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {jobs.length} {jobs.length === 1 ? "opportunity" : "opportunities"}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Explore all available positions</p>
            </div>
          </div>

          {jobs.length > 0 ? (
            <div className="grid w-full grid-cols-1 xl:grid-cols-2 gap-6">
              {jobs.map((job, index) => {
                // Skip the featured job to avoid duplication
                if (job.id === featuredJob?.id) return null;

                return (
                  <div
                    key={job.id}
                    className={`group transform transition-all duration-300 hover-lift ${
                      isVisible ? "animate-scale-in-center" : "opacity-0"
                    }`}
                    style={{
                      animationDelay: `${(index + 1) * 0.1}s`,
                    }}
                  >
                    {/* Job Card with Enhanced Styling */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 group-hover:border-amber-200 transition-all duration-300">
                      {/* Background Pattern */}
                      <div className="absolute top-0 right-0 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                        <div className="honeycomb-pattern w-full h-full"></div>
                      </div>

                      {/* Enhanced Card Content */}
                      <div className="relative z-10 p-1">
                        <Card
                          uniqueId={userId}
                          talent={job.talent}
                          mentor={job.mentor}
                          recruiter={job.recruiter}
                          jobId={job.id}
                          blockId={job.block_id}
                          type="company"
                          title={job.title}
                          postedBy={job.companyName}
                          postedOn={getRelativeTime(job.postedAt)}
                          image={job.image_url || "/img/company_img.png"}
                          country={job.country}
                          city={job.city}
                          budget={job.budget}
                          projectType={job.projectType}
                          currency={job.currency}
                          description={job.description}
                          skills={job.skills}
                          buttonText="View Details"
                          walletAddress={job.walletAddress}
                          escrowAmount={job.escrowAmount}
                        />
                      </div>

                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                      
                      {/* Floating bee on hover */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-60 transition-all duration-300">
                        <div className="bee-particle animate-float"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className={`text-center py-16 ${
                isVisible ? "animate-scale-in-center delay-500" : "opacity-0"
              }`}
            >
              <div className="relative inline-block mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                {/* Floating bees around empty state */}
                <div className="absolute -top-2 -right-2 bee-particle animate-float delay-100"></div>
                <div className="absolute -bottom-2 -left-2 bee-particle animate-float-slow delay-300"></div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                No Active Positions
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                This company doesn't have any open positions at the moment. 
                <br />
                <span className="text-amber-600 font-medium">
                  🐝 Check back soon for new opportunities!
                </span>
              </p>
              
              {/* Call to Action */}
              <div className="mt-8">
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-200">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Stay tuned for updates</span>
                </div>
              </div>
            </div>
          )}

          {/* Decorative Elements */}
          <div className="absolute bottom-4 left-4 opacity-10">
            <span className="text-2xl animate-float-slow">🍯</span>
          </div>
        </div>
      </div>
    </div>
  );
};