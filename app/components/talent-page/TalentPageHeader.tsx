"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Mail, Briefcase, Award, Users } from "lucide-react";
import LastActiveStatus from "@/app/components/LastActiveStatus";
import styles from "./TalentPageHeader.module.scss";

interface TalentPageHeaderProps {
  first_name: string;
  last_name: string;
  title: string;
  city?: string;
  country?: string;
  image_url?: string;
  last_active?: string | Date;
  email?: string;
  talent?: boolean;
  mentor?: boolean;
  recruiter?: boolean;
  approved_roles?: object[] | null;
}

export const TalentPageHeader = ({
  first_name,
  last_name,
  title,
  city,
  country,
  image_url,
  last_active,
  email,
  talent,
  mentor,
  recruiter,
  approved_roles,
}: TalentPageHeaderProps) => {
  const [imageError, setImageError] = useState(false);

  const handleContactClick = () => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const fullName = `${first_name} ${last_name}`;
  const location = city && country ? `${city}, ${country}` : city || country || "";

  // Convert country code to flag emoji
  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return "";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const countryFlag = country ? getCountryFlag(country) : "";

  // Check if role is approved
  const isRoleApproved = (role: string) => {
    return approved_roles?.some((r: any) => r.role === role);
  };

  return (
    <div className={styles.headerContainer}>
      {/* Decorative background hexagons */}
      <div className={`${styles.decorativeHexagon} ${styles.hexagon1}`}></div>
      <div className={`${styles.decorativeHexagon} ${styles.hexagon2}`}></div>

      <div className={styles.headerContent}>
        {/* Profile Image */}
        <div className={styles.profileImageWrapper}>
          <div className={styles.profileImageContainer}>
            <Image
              className={styles.profileImage}
              src={imageError || !image_url ? "/img/client-bee.png" : image_url}
              alt={`${fullName} profile picture`}
              fill
              onError={() => setImageError(true)}
              priority
            />
          </div>
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          <h1 className={styles.name}>{fullName}</h1>
          <h2 className={styles.title}>{title}</h2>

          {location && (
            <div className={styles.location}>
              <MapPin size={18} />
              <span>{location}</span>
              {countryFlag && (
                <span className={styles.flag}>{countryFlag}</span>
              )}
            </div>
          )}

          {last_active && (
            <div className={styles.lastActiveWrapper}>
              <LastActiveStatus lastActiveTime={last_active} />
            </div>
          )}

          {/* Role Badges */}
          {(talent || mentor || recruiter) && (
            <div className={styles.roleBadges}>
              {talent && isRoleApproved("talent") && (
                <span className={styles.roleBadge}>
                  <Briefcase size={14} />
                  Talent
                </span>
              )}
              {mentor && isRoleApproved("mentor") && (
                <span className={styles.roleBadge}>
                  <Award size={14} />
                  Mentor
                </span>
              )}
              {recruiter && isRoleApproved("recruiter") && (
                <span className={styles.roleBadge}>
                  <Users size={14} />
                  Recruiter
                </span>
              )}
            </div>
          )}
        </div>

        {/* CTA Section */}
        {email && (
          <div className={styles.ctaSection}>
            <button
              type="button"
              onClick={handleContactClick}
              className={styles.ctaButton}
              aria-label={`Contact ${fullName}`}
            >
              <Mail size={18} />
              Contact Me
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
