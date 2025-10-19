"use client";

import { useState, useEffect } from "react";
import { Briefcase, DollarSign, MapPin, Clock, Star, Users } from "lucide-react";
import Image from "next/image";
import { Card } from "@/app/components/card";
import { JobCard } from "@components/job-card";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import styles from "./animated-job-section.module.scss";

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
                    Our premium spotlight opportunity awaits you!
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
                    <p className="balance-subtitle">Rewards secured & ready</p>
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
                  Don't miss this exclusive opportunity! Join our hive and make it yours.
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
      <div className={`mt-8 ${isVisible ? styles.fadeInUp + " " + styles.delay200 : "opacity-0"}`}>
        <div className={styles.jobsSectionPill}>
          <div className={styles.jobsHeaderPill}>
            <div className={styles.jobsTitlePill}>
              <Briefcase className={styles.pillIcon} />
              <span>All Open Positions</span>
            </div>
            <div className={styles.jobsCountPill}>
              {jobs.length} {jobs.length === 1 ? "opportunity" : "opportunities"}
            </div>
          </div>
          <div className={styles.jobsSubtitle}>
            Explore all available positions
          </div>

          {jobs.length > 0 ? (
            <div className={styles.jobsGridPill}>
              {jobs.map((job, index) => {
                if (job.id === featuredJob?.id) return null;
                return (
                  <div
                    key={job.id}
                    className={`${styles.jobCardContainer} ${styles.scaleIn} ${styles[`delay${(index % 5) * 100}`]}`}
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
            <div className={styles.jobsEmptyState}>
              <div className={styles.emptyStatePill}>
                <div className={styles.emptyIconPill}>
                  <Briefcase className={styles.emptyIcon} />
                </div>

                <h3 className={styles.emptyTitle}>
                  No Active Positions
                </h3>
                <p className={styles.emptyDescription}>
                  This company doesn't have any open positions at the moment.
                  <br />
                  <span className={styles.emptyCta}>
                    🐝 Check back soon for new opportunities!
                  </span>
                </p>

                <div className={styles.emptyActionPill}>
                  <Users className={styles.actionIcon} />
                  <span>Stay tuned for updates</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
