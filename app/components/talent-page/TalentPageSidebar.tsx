"use client";

import { DollarSign, CheckCircle, XCircle, Linkedin, Github, Twitter, Globe, ExternalLink, Link2 } from "lucide-react";
import { TalentStatsCard } from "./TalentStatsCard";
import { WorkPreferencesCard } from "./WorkPreferencesCard";
import { useAuth } from "@/app/contexts/AuthContext";
import { useConnectModal } from "thirdweb/react";
import { connectModalOptions } from "@/lib/auth/walletConfig";
import styles from "./TalentPageSidebar.module.scss";

interface TalentPageSidebarProps {
  // Stats
  years_experience?: number;
  jobs_completed?: number;
  response_time?: string;
  rating?: number;
  // Preferences
  remote_only?: boolean;
  freelance_only?: boolean;
  timezone?: string;
  languages?: string[] | string;
  // Availability & Rate
  rate?: number;
  availability?: boolean;
  // Social Links
  linkedin?: string;
  github?: string;
  twitter?: string;
  portfolio?: string;
  stackoverflow?: string;
}

export const TalentPageSidebar = ({
  years_experience,
  jobs_completed,
  response_time,
  rating,
  remote_only,
  freelance_only,
  timezone,
  languages,
  rate,
  availability,
  linkedin,
  github,
  twitter,
  portfolio,
  stackoverflow,
}: TalentPageSidebarProps) => {
  const { isAuthenticated } = useAuth();
  const { connect } = useConnectModal();

  const handleConnectWallet = () => {
    if (connect) {
      connect(connectModalOptions);
    }
  };

  // Social links array
  const socialLinks = [
    { name: "LinkedIn", url: linkedin, icon: Linkedin },
    { name: "GitHub", url: github, icon: Github },
    { name: "Twitter", url: twitter, icon: Twitter },
    { name: "Portfolio", url: portfolio, icon: Globe },
    { name: "Stack Overflow", url: stackoverflow, icon: Link2 },
  ].filter((link) => link.url);

  const hasSocialLinks = socialLinks.length > 0;

  return (
    <div className={styles.sidebarContainer}>
      {/* Stats Card */}
      <TalentStatsCard
        years_experience={years_experience}
        jobs_completed={jobs_completed}
        response_time={response_time}
        rating={rating}
      />

      {/* Work Preferences Card */}
      <WorkPreferencesCard
        remote_only={remote_only}
        freelance_only={freelance_only}
        timezone={timezone}
        languages={languages}
      />

      {/* Availability & Rate Card */}
      {rate && (
        <div className={`${styles.availabilityCard} ${!isAuthenticated ? styles.blurredCard : ''}`}>
          <h3 className={styles.availabilityTitle}>Hourly Rate</h3>

          {isAuthenticated ? (
            <>
              <div className={styles.rateDisplay}>
                <DollarSign
                  size={24}
                  style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}
                />
                {rate}
                <span className={styles.rateCurrency}>/hr</span>
              </div>

              {availability !== undefined && (
                <div className={styles.availabilityStatus}>
                  {availability ? (
                    <>
                      <CheckCircle size={16} />
                      Available for hire
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Not available
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.blurredContent}>
              <div className={styles.rateDisplay} style={{ filter: 'blur(8px)', opacity: 0.5 }}>
                <DollarSign size={24} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                XXX
                <span className={styles.rateCurrency}>/hr</span>
              </div>
              <button onClick={handleConnectWallet} className={styles.connectButton}>
                🔒 Connect to View Rate
              </button>
            </div>
          )}
        </div>
      )}

      {/* Social Links Card */}
      <div className={`${styles.socialCard} ${!isAuthenticated ? styles.blurredCard : ''}`}>
        <h3 className={styles.socialTitle}>Connect</h3>

        {isAuthenticated ? (
          hasSocialLinks ? (
            <div className={styles.socialLinks}>
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <link.icon className={styles.socialIcon} />
                  <span className={styles.socialName}>{link.name}</span>
                  <ExternalLink className={styles.externalIcon} />
                </a>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Link2 />
              <p>No social links available</p>
            </div>
          )
        ) : (
          <div className={styles.blurredContent}>
            <div className={styles.socialLinks} style={{ filter: 'blur(8px)', opacity: 0.5 }}>
              <div className={styles.socialLink}>
                <Linkedin className={styles.socialIcon} />
                <span className={styles.socialName}>LinkedIn</span>
                <ExternalLink className={styles.externalIcon} />
              </div>
              <div className={styles.socialLink}>
                <Github className={styles.socialIcon} />
                <span className={styles.socialName}>GitHub</span>
                <ExternalLink className={styles.externalIcon} />
              </div>
            </div>
            <button onClick={handleConnectWallet} className={styles.connectButton}>
              🔒 Connect to View Links
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
