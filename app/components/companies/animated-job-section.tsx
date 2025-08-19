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
    <div className={className}>
      {/* Featured Position Section - Honey Bee Themed */}
      {featuredJob && (
        <div className={`featured-position-section ${isVisible ? "fade-in-up" : "opacity-0"}`}>
          <div className="featured-position-container">
            {/* Header with Honey Bee Theme */}
            <div className="featured-position-header">
              <div className="header-content">
                <div className="honey-crown">
                  <div className="crown-icon">
                    <span className="crown-emoji">👑</span>
                    <div className="floating-bees">
                      <span className="bee bee-1">🐝</span>
                      <span className="bee bee-2">🐝</span>
                      <span className="bee bee-3">🐝</span>
                    </div>
                  </div>
                </div>
                <div className="header-text">
                  <h2 className="featured-title">
                    🍯 Featured Position
                    <div className="title-underline"></div>
                  </h2>
                  <p className="featured-subtitle">
                    Our premium honey-sweet opportunity awaits you!
                  </p>
                </div>
              </div>
              
              {/* Decorative Honeycomb Pattern */}
              <div className="honeycomb-decoration">
                <div className="hexagon hex-1"></div>
                <div className="hexagon hex-2"></div>
                <div className="hexagon hex-3"></div>
                <div className="hexagon hex-4"></div>
              </div>
            </div>

            {/* Escrow Balance with Honey Theme */}
            <div className="escrow-balance-honey">
              {isLoadingBalances ? (
                <div className="balance-loading">
                  <div className="honey-spinner">
                    <span className="spinning-bee">🐝</span>
                  </div>
                  <span>Loading honey pot balance...</span>
                </div>
              ) : (
                <div className="balance-display">
                  <div className="honey-pot-icon">
                    <span>🍯</span>
                  </div>
                  <div className="balance-info">
                    <p className="balance-amount">
                      Honey Pot: ${jobBalances[featuredJob.id]?.toFixed(2) || "0.00"} USDC
                    </p>
                    <p className="balance-subtitle">Sweet rewards secured & ready</p>
                  </div>
                  <div className="balance-bees">
                    <span className="guard-bee">🐝</span>
                  </div>
                </div>
              )}
            </div>

            {/* Featured Job Card with Enhanced Styling */}
            <div className="featured-job-wrapper">
              <div className="featured-job-glow"></div>
              <div className="featured-job-border">
                <div className="featured-job-content">
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
                    buttonText="🍯 Apply Now"
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
              
              {/* Floating Elements */}
              <div className="floating-elements">
                <span className="float-honey float-1">🍯</span>
                <span className="float-bee float-2">🐝</span>
                <span className="float-flower float-3">🌻</span>
                <span className="float-honey float-4">🍯</span>
              </div>
            </div>

            {/* Call to Action Banner */}
            <div className="featured-cta-banner">
              <div className="cta-content">
                <span className="cta-bee">🐝</span>
                <p className="cta-text">
                  Don't miss this sweet opportunity! Join our hive and make it yours.
                </p>
                <div className="cta-sparkles">
                  <span className="sparkle">✨</span>
                  <span className="sparkle">✨</span>
                  <span className="sparkle">✨</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Jobs Section */}
      <div className={`mt-8 ${isVisible ? "fade-in-up delay-200" : "opacity-0"}`}>
        <div className="modern-card-enhanced p-6">
          <div className="section-header-enhanced">
            <div className="section-icon-enhanced" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' }}>
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="section-title">
              <h2>
                All Open Positions
                <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {jobs.length} {jobs.length === 1 ? "opportunity" : "opportunities"}
                </span>
              </h2>
              <p>Explore all available positions</p>
            </div>
          </div>

          {jobs.length > 0 ? (
            <div className="jobs-grid-enhanced mt-6">
              {jobs.map((job, index) => {
                if (job.id === featuredJob?.id) return null;
                return (
                  <div
                    key={job.id}
                    className={`scale-in delay-${(index % 5) * 100}`}
                  >
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