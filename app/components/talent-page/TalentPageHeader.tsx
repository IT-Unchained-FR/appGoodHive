"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MapPin, Mail, Briefcase, Award, Users, Lock } from "lucide-react";
import LastActiveStatus from "@/app/components/LastActiveStatus";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { useAuth } from "@/app/contexts/AuthContext";
import { CompanyInfoGuard } from "@/app/components/CompanyInfoGuard";
import { AvailabilityBadge } from "@/app/components/AvailabilityBadge";
import { MessageBoxModal } from "@/app/components/message-box-modal";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { ReturnUrlManager } from "@/app/utils/returnUrlManager";
import type { Route } from "next";
import { useRouter } from "next/navigation";
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
  talent_user_id?: string;
  availability?: boolean | string;
  availability_status?: string | null;
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
  talent_user_id,
  availability,
  availability_status,
  canViewSensitive: canViewSensitiveProp,
  canViewBasic: canViewBasicProp,
}: TalentPageHeaderProps) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupModal, setIsPopupModal] = useState(false);
  const [currentCompanyEmail, setCurrentCompanyEmail] = useState("");
  const [viewerCompanyStatus, setViewerCompanyStatus] = useState<
    "unknown" | "approved" | "unapproved" | "none"
  >("unknown");
  const { user, isAuthenticated } = useAuth();
  const { user_id: currentUserId, checkAuthAndShowConnectPrompt, openConnectModal } =
    useAuthCheck();
  const isOwnProfile =
    !!currentUserId && !!talent_user_id && currentUserId === talent_user_id;

  useEffect(() => {
    if (!isAuthenticated || !currentUserId || isOwnProfile) {
      setViewerCompanyStatus("none");
      return;
    }

    let isActive = true;

    const detectCompanyProfile = async () => {
      try {
        const companyResponse = await fetch(
          `/api/companies/my-profile?userId=${currentUserId}`,
          { cache: "no-store" },
        );

        if (!companyResponse.ok) {
          if (isActive) {
            setViewerCompanyStatus("none");
          }
          return;
        }

        const companyProfile = await companyResponse.json();
        if (!isActive) return;

        if (companyProfile?.email) {
          setCurrentCompanyEmail(companyProfile.email);
        }

        setViewerCompanyStatus(
          companyProfile?.approved ? "approved" : "unapproved",
        );
      } catch (error) {
        console.error("Failed to detect company profile:", error);
        if (isActive) {
          setViewerCompanyStatus("none");
        }
      }
    };

    void detectCompanyProfile();

    return () => {
      isActive = false;
    };
  }, [currentUserId, isAuthenticated, isOwnProfile]);

  const handleContactClick = async () => {
    if (currentUserId && talent_user_id && currentUserId === talent_user_id) {
      toast.error("You are viewing your own profile.");
      return;
    }

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
      
      if (userProfile.email) {
        setCurrentCompanyEmail(userProfile.email);
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

  const handleSubmitMessage = async (message: string, emailFromModal: string) => {
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

      let threadId: string | null = null;

      if (talent_user_id) {
        const threadResponse = await fetch("/api/messenger/threads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": currentUserId,
          },
          body: JSON.stringify({
            companyUserId: currentUserId,
            talentUserId: talent_user_id,
            threadType: "direct",
            actorUserId: currentUserId,
          }),
        });

        if (!threadResponse.ok) {
          throw new Error("Failed to initialize direct conversation");
        }

        const threadData = await threadResponse.json();
        threadId = threadData?.thread?.id || null;

        if (!threadId) {
          throw new Error("Conversation thread not found");
        }

        const messageResponse = await fetch(
          `/api/messenger/threads/${threadId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": currentUserId,
            },
            body: JSON.stringify({
              senderUserId: currentUserId,
              messageText: message,
            }),
          },
        );

        if (!messageResponse.ok) {
          throw new Error("Failed to send direct message");
        }

        await fetch("/api/contact-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyUserId: currentUserId,
            talentUserId: talent_user_id,
            threadId,
            actorType: "company",
            contactType: "direct",
            messagePreview: message,
          }),
        }).catch((logError) => {
          console.error("Contact log creation failed:", logError);
        });
      }

      if (email) {
        await fetch("/api/send-email", {
          method: "POST",
          body: JSON.stringify({
            name: userProfile?.designation,
            toUserName: fullName,
            email: email,
            type: "contact-talent",
            subject: `Goodhive - ${userProfile?.designation} interested in your profile`,
            userEmail: emailFromModal,
            message,
            userProfile: `${window.location.origin}/companies/${currentUserId}`,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }).catch((notificationError) => {
          console.error("Notification email failed:", notificationError);
        });
      }

      toast.success("Message sent successfully!");

      if (threadId) {
        router.push(`/messages?thread=${threadId}` as Route);
      }
    } catch (error) {
      toast.error("Something went wrong!");
    }
  };

  const handleConnectWallet = () => {
    // Set return URL so user comes back here after connecting
    if (typeof window !== "undefined") {
      ReturnUrlManager.setProtectedRouteAccess(window.location.pathname);
    }
    
    void openConnectModal();
  };

  const canViewSensitive =
    typeof canViewSensitiveProp === "boolean"
      ? canViewSensitiveProp
      : !!user &&
        (user.talent_status === "approved" ||
          user.recruiter_status === "approved");
  const isApprovalLocked = isAuthenticated && !canViewSensitive;
  const canViewBasic =
    typeof canViewBasicProp === "boolean"
      ? canViewBasicProp
      : !!user;
  const isViewerApprovedCompany = viewerCompanyStatus === "approved";
  const requiresCompanyApproval = viewerCompanyStatus === "unapproved";
  const requiresCompanyProfile = viewerCompanyStatus === "none";
  const canContactTalent =
    isViewerApprovedCompany && !isOwnProfile && Boolean(talent_user_id);
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

          <AvailabilityBadge
            status={availability_status}
            legacyAvailability={availability}
          />

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
          {canContactTalent ? (
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
          ) : isOwnProfile ? (
            <button
              type="button"
              className={`${styles.ctaButton} ${styles.connectButton}`}
              disabled
              aria-label="Your profile"
            >
              <Lock size={18} />
              Your profile
            </button>
          ) : !isAuthenticated ? (
            <button
              type="button"
              onClick={handleConnectWallet}
              className={`${styles.ctaButton} ${styles.connectButton}`}
              aria-label="Connect wallet to contact"
            >
              <Lock size={18} />
              Connect wallet to contact
            </button>
          ) : isApprovalLocked ? (
            <button
              type="button"
              className={`${styles.ctaButton} ${styles.connectButton}`}
              disabled
              aria-label="Get approved to contact"
            >
              <Lock size={18} />
              Get approved to contact
            </button>
          ) : requiresCompanyApproval ? (
            <button
              type="button"
              className={`${styles.ctaButton} ${styles.connectButton}`}
              disabled
              aria-label="Company approval required"
            >
              <Lock size={18} />
              Company approval required
            </button>
          ) : requiresCompanyProfile ? (
            <button
              type="button"
              className={`${styles.ctaButton} ${styles.connectButton}`}
              disabled
              aria-label="Company profile required"
            >
              <Lock size={18} />
              Company profile required
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.ctaButton} ${styles.connectButton}`}
              disabled
              aria-label="Checking company access"
            >
              <Lock size={18} />
              Checking company access...
            </button>
          )}
        </div>

        {/* Message Modal */}
        {isPopupModal && (
          <MessageBoxModal
            title={`Contact ${fullName}`}
            initialEmail={currentCompanyEmail}
            messageLengthLimit={30}
            onSubmit={handleSubmitMessage}
            onClose={handlePopupModalClose}
          />
        )}
      </div>
    </div>
  );
};
