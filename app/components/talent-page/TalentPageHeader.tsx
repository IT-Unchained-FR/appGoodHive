"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Mail, Briefcase, Award, Users, Lock } from "lucide-react";
import LastActiveStatus from "@/app/components/LastActiveStatus";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { useAuth } from "@/app/contexts/AuthContext";
import { CompanyInfoGuard } from "@/app/components/CompanyInfoGuard";
import { useConnectModal } from "thirdweb/react";
import { connectModalOptions } from "@/lib/auth/walletConfig";
import { MessageBoxModal } from "@/app/components/message-box-modal";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import ApprovalPromptModal from "./ApprovalPromptModal";
import toast from "react-hot-toast";
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
  canViewSensitive?: boolean;
  canViewBasic?: boolean;
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
  canViewSensitive: canViewSensitiveProp,
  canViewBasic: canViewBasicProp,
}: TalentPageHeaderProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupModal, setIsPopupModal] = useState(false);
  const [showApprovalPrompt, setShowApprovalPrompt] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { connect } = useConnectModal();
  const { user_id: currentUserId, checkAuthAndShowConnectPrompt } = useAuthCheck();

  const handleContactClick = async () => {
    // Check if user is authenticated first
    if (!checkAuthAndShowConnectPrompt("contact this talent")) {
      return;
    }

    setIsLoading(true);
    try {
      const companyData = await fetch(
        `/api/companies/my-profile?userId=${currentUserId}`,
      );

      if (!companyData.ok) {
        toast.error("You don't have a company profile yet! Please create one.");
        setIsLoading(false);
        return;
      }

      const userProfile = await companyData.json();
      if (!userProfile.approved) {
        setIsLoading(false);
        toast.error(
          "Only verified companies can contact talent! Please wait for your company to be verified.",
        );
        return;
      }
      setIsLoading(false);
      setIsPopupModal(true);
    } catch (error) {
      setIsLoading(false);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handlePopupModalClose = () => {
    setIsPopupModal(false);
  };

  const handleSubmitMessage = async (message: string) => {
    if (!message) {
      toast.error("Please enter a message!");
      return;
    }
    if (!currentUserId) {
      checkAuthAndShowConnectPrompt("send a message");
      return;
    }
    try {
      setIsPopupModal(false);
      const companyData = await fetch(
        `/api/companies/my-profile?userId=${currentUserId}`,
      );

      if (!companyData.ok) {
        toast.error("You don't have a company profile yet! Please create one.");
        return;
      }

      const userProfile = await companyData.json();
      if (!userProfile.approved) {
        toast.error(
          "Only verified companies can contact talent! Please wait for your company to be verified.",
        );
        return;
      }

      const fullName = `${first_name} ${last_name}`;
      const response = await fetch("/api/send-email", {
        method: "POST",
        body: JSON.stringify({
          name: userProfile?.designation,
          toUserName: fullName,
          email: email,
          type: "contact-talent",
          subject: `Goodhive - ${userProfile?.designation} interested in your profile`,
          userEmail: userProfile?.email,
          message,
          userProfile: `${window.location.origin}/companies/${currentUserId}`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Something went wrong!");
      } else {
        toast.success("Message sent successfully!");
      }
    } catch (error) {
      toast.error("Something went wrong!");
    }
  };

  const handleConnectWallet = () => {
    if (connect) {
      connect(connectModalOptions);
    }
  };

  const handleApprovalCtaClick = () => {
    if (isAuthenticated && !canViewSensitive) {
      setShowApprovalPrompt(true);
      return;
    }
    handleConnectWallet();
  };

  const canViewSensitive =
    typeof canViewSensitiveProp === "boolean"
      ? canViewSensitiveProp
      : !!user &&
        (user.talent_status === "approved" ||
          user.recruiter_status === "approved");
  const canViewBasic =
    typeof canViewBasicProp === "boolean"
      ? canViewBasicProp
      : !!user;
  const fullName = `${first_name} ${last_name}`;
  const location = city && country ? `${city}, ${country}` : city || country || "";

  // Generate country flag URL
  const countryFlag = country ? generateCountryFlag(country) : null;

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
          {canViewBasic ? (
            <h1 className={styles.name}>{fullName}</h1>
          ) : (
            <h1 className={styles.name}>
              <CompanyInfoGuard
                value={undefined}
                seed={`${first_name}-${last_name}`}
                isVisible={false}
                allowTooltip={false}
                placeholder="Connect to view talent"
                textClassName={styles.name}
                sizeClassName={styles.name}
                blurAmount="blur-[8px]"
                placement="bottom"
              />
            </h1>
          )}
          <h2 className={styles.title}>{title}</h2>

          {location && (
            <div className={styles.location}>
              <MapPin size={18} />
              <span>{location}</span>
              {countryFlag && (
                <div className={styles.flag}>
                  <div className={styles.flagImage}>
                    <Image
                      src={countryFlag}
                      alt={`${country} flag`}
                      fill
                      className={styles.flagImg}
                    />
                  </div>
                </div>
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
        <div className={styles.ctaSection}>
          {canViewSensitive && email ? (
            <button
              type="button"
              onClick={handleContactClick}
              className={styles.ctaButton}
              aria-label={`Contact ${fullName}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Loading...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Contact Me
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApprovalCtaClick}
              className={`${styles.ctaButton} ${styles.connectButton}`}
              aria-label={isAuthenticated ? "Get approved to contact" : "Connect wallet to contact"}
            >
              <Lock size={18} />
              {isAuthenticated ? "Get Approved to Contact" : "Connect Wallet to Contact"}
            </button>
          )}
        </div>

        {/* Message Modal */}
        {isPopupModal && (
          <MessageBoxModal
            title="Write your message:"
            messageLengthLimit={30}
            onSubmit={handleSubmitMessage}
            onClose={handlePopupModalClose}
          />
        )}

        <ApprovalPromptModal
          open={showApprovalPrompt}
          onClose={() => setShowApprovalPrompt(false)}
        />
      </div>
    </div>
  );
};
