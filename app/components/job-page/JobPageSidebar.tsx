"use client";

import { useState, useEffect } from "react";
import { MapPin, DollarSign, Clock, Calendar, Building, Users, Globe, Linkedin, Twitter, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { OptimizedJobBalance } from "@/app/components/OptimizedJobBalance";
import styles from "./JobPageSidebar.module.scss";
import { useAuth } from "@/app/contexts/AuthContext";
import { CompanyInfoGuard } from "@/app/components/CompanyInfoGuard";
import { useConnectModal } from "thirdweb/react";
import { connectModalOptions } from "@/lib/auth/walletConfig";

interface JobPageSidebarProps {
  job: {
    id: string;
    budget: number;
    currency: string;
    projectType: string;
    typeEngagement?: string;
    duration?: string;
    postedAt: string;
    applicationCount?: number;
    blockchainJobId?: string | null;
    blockId?: number;
    block_id?: string;
    company: {
      id: string;
      name: string;
      logo?: string;
      headline?: string;
      city?: string;
      country?: string;
      email?: string;
      linkedin?: string;
      twitter?: string;
      website?: string;
    };
  };
}

export const JobPageSidebar = ({ job }: JobPageSidebarProps) => {
  const { isAuthenticated, user } = useAuth();
  const { connect } = useConnectModal();
  const [isApprovedTalent, setIsApprovedTalent] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Check if user is an approved talent
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!isAuthenticated || !user) {
        setIsApprovedTalent(false);
        return;
      }

      setIsCheckingVerification(true);
      try {
        const response = await fetch("/api/talents/verification-status", {
          headers: user?.user_id ? { "x-user-id": user.user_id } : undefined,
        });

        if (response.ok) {
          const { isApproved } = await response.json();
          setIsApprovedTalent(isApproved);
        } else {
          // Fallback to cookie-based check if API fails
          setIsApprovedTalent(user.talent_status === "approved");
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
        // Fallback to cookie-based check on error
        setIsApprovedTalent(user.talent_status === "approved");
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkVerificationStatus();
  }, [isAuthenticated, user]);

  const handleConnectWallet = () => {
    if (connect) {
      connect(connectModalOptions);
    }
  };

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
    // Handle crypto token addresses and map to standard currency codes
    const getCurrencyCode = (currency: string) => {
      if (!currency) return 'USD';
      if (currency === 'USDC' || currency.startsWith('0x')) return 'USD';
      // List of valid currency codes for Intl.NumberFormat
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
      return validCurrencies.includes(currency.toUpperCase()) ? currency.toUpperCase() : 'USD';
    };

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: getCurrencyCode(currency),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={styles.sidebarContainer}>

      {/* Available Funds Card */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Available Funds</h3>
        <div className="text-center py-4">
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <div className="flex justify-center">
              <OptimizedJobBalance
                jobId={job.id}
                blockId={job.blockId}
                currency={job.currency}
                amount={job.budget}
                className="scale-110"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Company Card */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>About the Company</h3>

        <div className={styles.companyHeader}>
          <div className={styles.companyLogo}>
            {job.company.logo ? (
              <Image
                src={job.company.logo}
                alt={isAuthenticated ? `${job.company.name} logo` : "Hidden company logo"}
                width={48}
                height={48}
                className={styles.logoImage}
                style={!isAuthenticated ? {
                  filter: "blur(10px) brightness(1.1)",
                  opacity: 0.6,
                  transition: "all 0.3s ease"
                } : undefined}
              />
            ) : (
              <div className={styles.logoPlaceholder}>
                <Building size={24} />
              </div>
            )}
          </div>
          <div className={styles.companyInfo}>
            {isAuthenticated ? (
              <Link href={`/companies/${job.company.id}`} className={styles.companyName}>
                {job.company.name}
              </Link>
            ) : (
              <CompanyInfoGuard
                value={undefined}
                seed={job.id}
                isVisible={false}
                textClassName={`${styles.companyName} ${styles.blurredText}`}
                sizeClassName={styles.companyName}
                placement="right"
              />
            )}
            {job.company.headline && isAuthenticated && (
              <div
                className={styles.companyHeadline}
                dangerouslySetInnerHTML={{ __html: job.company.headline }}
              />
            )}
            {job.company.headline && !isAuthenticated && (
              <CompanyInfoGuard
                value={undefined}
                seed={`${job.id}-headline`}
                isVisible={false}
                textClassName={`${styles.companyHeadline} ${styles.blurredText}`}
                sizeClassName={styles.companyHeadline}
                placement="right"
              />
            )}
          </div>
        </div>

        {(job.company.city || job.company.country) && (
          <div className={`${styles.companyDetail} ${!isAuthenticated ? styles.blurredRow : ""}`}>
            <MapPin className={styles.detailIcon} />
            {isAuthenticated ? (
              <span>
                {job.company.city && job.company.country
                  ? `${job.company.city}, ${job.company.country}`
                  : job.company.city || job.company.country}
              </span>
            ) : (
              <CompanyInfoGuard
                value="Hidden location"
                seed={`${job.id}-location`}
                isVisible={false}
                textClassName={styles.blurredText}
                compact
                placement="right"
              />
            )}
          </div>
        )}

        {/* Enhanced Company Contact Information */}
        {(job.company.website || job.company.linkedin || job.company.twitter || job.company.email) && (
          isAuthenticated ? (
            <div className={styles.companyContactSection}>
              <h4 className={styles.contactSubtitle}>Connect with {job.company.name}</h4>
              <div className={styles.contactGrid}>
                {job.company.email && (
                  <div className={styles.contactItem}>
                    <Mail className={styles.contactIcon} />
                    <a href={`mailto:${job.company.email}`} className={styles.contactLink}>
                      {job.company.email}
                    </a>
                  </div>
                )}

                {job.company.website && (
                  <div className={styles.contactItem}>
                    <Globe className={styles.contactIcon} />
                    <a href={job.company.website} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                      {job.company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {job.company.linkedin && (
                  <div className={styles.contactItem}>
                    <Linkedin className={styles.contactIcon} />
                    <a href={job.company.linkedin} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                      LinkedIn Profile
                    </a>
                  </div>
                )}

                {job.company.twitter && (
                  <div className={styles.contactItem}>
                    <Twitter className={styles.contactIcon} />
                    <a href={job.company.twitter} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                      @{job.company.twitter.split('/').pop()}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.lockedPanel}>
              <h4 className={styles.contactSubtitle}>Company profile locked</h4>
              <p className={styles.lockedText}>
                Connect your wallet to view company links and contact details.
              </p>
              <div className={styles.lockedActions}>
                <button type="button" onClick={handleConnectWallet} className={styles.primaryCta}>
                  Connect Wallet
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Follow Our Journey Section */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Follow Our Journey</h3>
        <div className={styles.journeyContent}>
          <p className={styles.journeyText}>Stay updated with our latest developments and opportunities</p>
        </div>
      </div>

      {/* Get in Touch Section */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Get in Touch</h3>
        {isApprovedTalent ? (
          <div className={styles.contactGoodHive}>
            <p className={styles.contactDescription}>
              Ready to apply? Contact the company directly using the information in the "About the Company" section above, or reach out to GoodHive if you have any questions.
            </p>
            <button className={styles.sendMessageButton}>
              <Mail className={styles.buttonIcon} />
              Send us a Message
            </button>
          </div>
        ) : (
          <div className={styles.accessRestricted}>
            <div className={styles.restrictedContent}>
              <h4 className={styles.restrictedTitle}>Access Restricted</h4>
              <p className={styles.restrictedText}>Contact details are available to validated talents.</p>
            </div>
          </div>
        )}
      </div>

      {/* Contact GoodHive Section */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Contact GoodHive</h3>
        <div className={styles.contactGoodHive}>
          <p className={styles.contactDescription}>
            Have questions about this job? Send us a message and we'll help you connect!
          </p>
          <button className={styles.sendMessageButton}>
            <Mail className={styles.buttonIcon} />
            Send us a Message
          </button>
        </div>
      </div>
    </div>
  );
};
