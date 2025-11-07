"use client";

import { useState } from "react";
import { MapPin, Clock, DollarSign, Calendar, Building, Share2, ArrowLeft, Users } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { JobApplicationPopup } from "@/app/components/job-application-popup/job-application-popup";
import TalentVerificationPopup from "@/app/components/talent-verification-popup/TalentVerificationPopup";
import OnboardingPopup from "@/app/components/onboarding-popup/OnboardingPopup";
import Image from "next/image";
import Link from "next/link";
import styles from "./JobPageHeader.module.scss";

interface JobPageHeaderProps {
  job: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      logo?: string;
      city?: string;
      country?: string;
    };
    city: string;
    country: string;
    budget: number;
    currency: string;
    projectType: string;
    typeEngagement?: string;
    postedAt: string;
    applicationCount?: number;
  };
}

export const JobPageHeader = ({ job }: JobPageHeaderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [isApplicationPopupOpen, setIsApplicationPopupOpen] = useState(false);
  const [isVerificationPopupOpen, setIsVerificationPopupOpen] = useState(false);
  const [isOnboardingPopupOpen, setIsOnboardingPopupOpen] = useState(false);

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatBudget = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDC' ? 'USD' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleApplyClick = () => {
    if (isAuthenticated && user && user.talent_status === "approved") {
      setIsApplicationPopupOpen(true);
    } else {
      setIsVerificationPopupOpen(true);
    }
  };

  const handleContinueToOnboarding = () => {
    setIsVerificationPopupOpen(false);
    setIsOnboardingPopupOpen(true);
  };

  const handleShareJob = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job opportunity at ${job.company.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  return (
    <>
      <div className={styles.headerContainer}>
        {/* Breadcrumb Navigation */}
        <div className={styles.breadcrumbSection}>
          <Link href="/talents/job-search" className={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Jobs
          </Link>
          <nav className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <Link href="/talents/job-search" className={styles.breadcrumbLink}>Jobs</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>{job.title}</span>
          </nav>
        </div>

        {/* Main Header Content */}
        <div className={styles.headerContent}>
          <div className={styles.headerMain}>
            {/* Company Logo */}
            <div className={styles.companyLogo}>
              {job.company.logo ? (
                <Image
                  src={job.company.logo}
                  alt={`${job.company.name} logo`}
                  width={64}
                  height={64}
                  className={styles.logoImage}
                />
              ) : (
                <div className={styles.logoPlaceholder}>
                  <Building size={32} />
                </div>
              )}
            </div>

            {/* Job Title and Company */}
            <div className={styles.jobInfo}>
              <h1 className={styles.jobTitle}>{job.title}</h1>
              <div className={styles.companyInfo}>
                <Link href={`/companies/${job.company.id}`} className={styles.companyName}>
                  {job.company.name}
                </Link>
                <div className={styles.locationInfo}>
                  <MapPin className={styles.metaIcon} />
                  <span>{job.city}, {job.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.headerActions}>
            <button
              onClick={handleShareJob}
              className={styles.shareButton}
              aria-label="Share job"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={handleApplyClick}
              className={styles.applyButton}
            >
              <Users className={styles.applyIcon} />
              Apply Now
            </button>
          </div>
        </div>

        {/* Job Metadata */}
        <div className={styles.jobMeta}>
          <div className={styles.metaItem}>
            <DollarSign className={styles.metaIcon} />
            <span>{formatBudget(job.budget, job.currency)}</span>
          </div>
          <div className={styles.metaItem}>
            <Building className={styles.metaIcon} />
            <span>{job.projectType}</span>
          </div>
          {job.typeEngagement && (
            <div className={styles.metaItem}>
              <Clock className={styles.metaIcon} />
              <span>{job.typeEngagement}</span>
            </div>
          )}
          <div className={styles.metaItem}>
            <Calendar className={styles.metaIcon} />
            <span>Posted {getRelativeTime(job.postedAt)}</span>
          </div>
          {job.applicationCount !== undefined && (
            <div className={styles.metaItem}>
              <Users className={styles.metaIcon} />
              <span>{job.applicationCount} applications</span>
            </div>
          )}
        </div>
      </div>

      {/* Popups */}
      {isVerificationPopupOpen && (
        <TalentVerificationPopup
          isOpen={isVerificationPopupOpen}
          onClose={() => setIsVerificationPopupOpen(false)}
          onContinueToOnboarding={handleContinueToOnboarding}
          jobTitle={job.title}
          companyName={job.company.name}
        />
      )}

      {isApplicationPopupOpen && (
        <JobApplicationPopup
          isOpen={isApplicationPopupOpen}
          onClose={() => setIsApplicationPopupOpen(false)}
          jobTitle={job.title}
          companyName={job.company.name}
          companyEmail={job.company.email || ""}
          jobId={job.id}
          walletAddress={job.company.walletAddress || job.company.id}
        />
      )}

      {isOnboardingPopupOpen && (
        <OnboardingPopup
          isOpen={isOnboardingPopupOpen}
          onClose={() => setIsOnboardingPopupOpen(false)}
          onContinue={() => {
            setIsOnboardingPopupOpen(false);
          }}
        />
      )}
    </>
  );
};