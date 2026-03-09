"use client";

import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { BadgeCheck, Briefcase, MapPin } from "lucide-react";
import Image from "next/image";
import styles from "./company-hero-section.module.scss";

interface CompanyHeroSectionProps {
  companyName: string;
  city: string;
  country: string;
  imageUrl?: string;
  headline?: string;
  jobCount?: number;
  isVerified?: boolean;
}

export const CompanyHeroSection = ({
  companyName,
  city,
  country,
  imageUrl,
  headline,
  jobCount = 0,
  isVerified = false,
}: CompanyHeroSectionProps) => {
  const hasLocation = Boolean(city || country);
  const countryFlag = country ? generateCountryFlag(country) : null;

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroCard}>
        <div className={styles.logoWrapper}>
          <Image
            className={styles.logoImage}
            src={imageUrl || "/img/placeholder-image.png"}
            alt={`${companyName} logo`}
            fill
          />
        </div>

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h1 className={styles.companyName}>{companyName}</h1>
            {isVerified && (
              <span className={styles.verifiedBadge}>
                <BadgeCheck className={styles.badgeIcon} />
                Verified
              </span>
            )}
          </div>

          {headline && <p className={styles.headline}>{headline}</p>}

          <div className={styles.metaRow}>
            {hasLocation && (
              <span className={styles.metaPill}>
                <MapPin className={styles.metaIcon} />
                {city && country ? `${city}, ${country}` : city || country}
              </span>
            )}

            <span className={styles.metaPill}>
              <Briefcase className={styles.metaIcon} />
              {jobCount} active {jobCount === 1 ? "job" : "jobs"}
            </span>

            {countryFlag && (
              <span className={styles.countryChip}>
                <span className={styles.flagWrap}>
                  <Image
                    src={countryFlag}
                    alt={`${country} flag`}
                    fill
                    className={styles.flagImage}
                  />
                </span>
                {country}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
