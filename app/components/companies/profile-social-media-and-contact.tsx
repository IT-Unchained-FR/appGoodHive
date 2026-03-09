"use client";

import Image from "next/image";
import Link from "next/link";
import { FC, useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import Cookies from "js-cookie";
import { MessagePopup } from "@components/message-popup";
import styles from "./profile-social-media-and-contact.module.scss";

type Props = {
  linkedin?: string;
  telegram?: string;
  github?: string;
  stackoverflow?: string;
  twitter?: string;
  portfolio?: string;
  email?: string;
  phone_country_code?: string;
  phone_number?: string;
  streetAddress?: string;
  companyName: string;
};

type SocialBrand =
  | "linkedin"
  | "telegram"
  | "github"
  | "stackoverflow"
  | "twitter"
  | "portfolio";

interface SocialLinkProps {
  href: string;
  iconSrc: string;
  alt: string;
  brandClass: SocialBrand;
}

interface ContactInfoProps {
  icon: JSX.Element;
  label: string;
  value: string;
}

const SocialLink: FC<SocialLinkProps> = ({ href, iconSrc, alt, brandClass }) => (
  <Link
    href={{ pathname: href }}
    target="_blank"
    rel="noopener noreferrer"
    className={`${styles.socialLink} ${styles[brandClass]}`}
  >
    <Image src={iconSrc} alt={alt} fill className={styles.socialIcon} />
  </Link>
);

const ContactInfo: FC<ContactInfoProps> = ({ icon, label, value }) => (
  <div className={styles.contactInfoItem}>
    <div className={styles.contactIcon}>{icon}</div>
    <div className={styles.contactDetails}>
      <p className={styles.contactLabel}>{label}</p>
      <p className={styles.contactValue}>{value}</p>
    </div>
  </div>
);

export const CompanySocialMediaAndContact: FC<Props> = ({
  linkedin,
  telegram,
  github,
  twitter,
  stackoverflow,
  portfolio,
  email,
  phone_country_code,
  phone_number,
  streetAddress,
  companyName,
}) => {
  const [isShowDetails, setIsShowDetails] = useState(false);
  const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);
  const userId = Cookies.get("user_id");

  useEffect(() => {
    const fetchViewerProfile = async () => {
      try {
        const data = await fetch(`/api/talents/my-profile?user_id=${userId}`);
        if (!data.ok) return;

        const userProfileData = await data.json();
        if (userProfileData.approved) {
          setIsShowDetails(true);
        }
      } catch (error) {
        console.error("Failed to fetch talent data:", error);
      }
    };

    if (userId) {
      void fetchViewerProfile();
    }
  }, [userId]);

  const telegramHandle = telegram?.replace(/^@/, "");

  const socialLinks = useMemo(
    () =>
      [
        { href: linkedin, icon: "/icons/linkedin.svg", alt: "LinkedIn", brandClass: "linkedin" as const },
        {
          href: telegramHandle ? `https://t.me/${telegramHandle}` : undefined,
          icon: "/icons/telegram.svg",
          alt: "Telegram",
          brandClass: "telegram" as const,
          requiresApprovedViewer: true,
        },
        { href: github, icon: "/icons/github.svg", alt: "GitHub", brandClass: "github" as const },
        {
          href: stackoverflow,
          icon: "/icons/stackoverflow.svg",
          alt: "Stack Overflow",
          brandClass: "stackoverflow" as const,
        },
        { href: twitter, icon: "/icons/twitter.jpg", alt: "Twitter", brandClass: "twitter" as const },
        { href: portfolio, icon: "/icons/portfolio.svg", alt: "Portfolio", brandClass: "portfolio" as const },
      ].filter(
        (link) =>
          Boolean(link.href) &&
          (!link.requiresApprovedViewer || isShowDetails),
      ),
    [github, isShowDetails, linkedin, portfolio, stackoverflow, telegramHandle, twitter],
  );

  const normalizedPhone = [phone_country_code, phone_number]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className={styles.contactContainer}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Follow Our Journey</h4>
        {socialLinks.length > 0 ? (
          <div className={styles.socialLinksContainer}>
            {socialLinks.map((social) => (
              <SocialLink
                key={social.alt}
                href={social.href as string}
                iconSrc={social.icon}
                alt={social.alt}
                brandClass={social.brandClass}
              />
            ))}
          </div>
        ) : (
          <p className={styles.mutedText}>No public social links shared yet.</p>
        )}
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Get in Touch</h4>
        {!isShowDetails ? (
          <div className={styles.restrictedAccess}>
            <p className={styles.restrictedTitle}>Access Restricted</p>
            <p className={styles.restrictedDescription}>
              Contact details are available to validated talents.
            </p>
          </div>
        ) : (
          <div className={styles.contactInfoList}>
            {email && (
              <ContactInfo
                label="Email"
                value={email}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                }
              />
            )}
            {normalizedPhone && (
              <ContactInfo
                label="Phone"
                value={normalizedPhone}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.76a11.034 11.034 0 006.364 6.364l.76-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                }
              />
            )}
            {streetAddress && (
              <ContactInfo
                label="Address"
                value={streetAddress}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
              />
            )}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Contact GoodHive</h4>
        <div className={styles.contactUsContainer}>
          <p className={styles.contactUsDescription}>
            Have questions about {companyName}? Send us a message and we&apos;ll help you connect.
          </p>
          <button
            type="button"
            onClick={() => setIsMessagePopupOpen(true)}
            className={styles.contactUsButton}
          >
            <MessageCircle className={styles.contactUsIcon} />
            <span>Send us a message</span>
          </button>
        </div>
      </div>

      <MessagePopup
        isOpen={isMessagePopupOpen}
        onClose={() => setIsMessagePopupOpen(false)}
      />
    </div>
  );
};
