"use client";

import { useState, useEffect } from "react";
import { TalentProfileData } from "./types";
import ProfileAboutWork from "@/app/components/talents/ProfileAboutWork";
import TalentsCVSection from "@/app/components/talents/TalentsCVSection";
import BeeHiveSpinner from "@/app/components/spinners/bee-hive-spinner";
import { TalentPageHeader } from "@/app/components/talent-page/TalentPageHeader";
import { TalentPageSidebar } from "@/app/components/talent-page/TalentPageSidebar";
import { useAuth } from "@/app/contexts/AuthContext";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useConnectModal } from "thirdweb/react";
import { connectModalOptions, supportedWallets } from "@/lib/auth/walletConfig";
import { thirdwebClient } from "@/clients";
import { activeChain } from "@/config/chains";
import { ReturnUrlManager } from "@/app/utils/returnUrlManager";
import styles from "./page.module.scss";
import "react-quill/dist/quill.snow.css";
import "@/app/styles/rich-text.css";

interface MyProfilePageProps {
  params: {
    user_id: string;
  };
}

export default function MyProfilePage({ params }: MyProfilePageProps) {
  const { user } = useAuth();
  const { connect } = useConnectModal();
  const [profileData, setProfileData] = useState<TalentProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.user_id) return;

    const fetchProfileData = async () => {
      try {
        const data = await fetch(`/api/talents/my-profile?user_id=${params.user_id}`);
        const userProfileData = await data.json();
        setProfileData(userProfileData);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to load profile data.");
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [params.user_id]);

  // Loading state
  if (isLoading || !profileData) {
    return (
      <div className={styles.loadingContainer}>
        <BeeHiveSpinner size="large" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorTitle}>Error Loading Profile</p>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  const {
    skills,
    title,
    first_name,
    last_name,
    image_url,
    about_work,
    cv_url,
    description,
    email,
    city,
    min_rate,
    max_rate,
    rate,
    country,
    linkedin,
    telegram,
    github,
    stackoverflow,
    portfolio,
    freelance_only,
    remote_only,
    talent_status,
    twitter,
    talent,
    recruiter,
    mentor,
    approved,
    approved_roles,
    last_active,
    // New fields (may not be in API yet)
    years_experience,
    jobs_completed,
    response_time,
    rating,
    timezone,
    languages,
  } = profileData;

  const canViewSensitive =
    !!user &&
    (user.talent_status === "approved" ||
      user.recruiter_status === "approved");

  const handleConnectWallet = () => {
    if (connect) {
      if (typeof window !== "undefined") {
        ReturnUrlManager.setProtectedRouteAccess(window.location.pathname);
      }
      connect({
        client: thirdwebClient,
        wallets: supportedWallets,
        chain: activeChain,
        ...connectModalOptions,
      });
    }
  };

  // Pending approval state
  if (!approved) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pendingMessage}>
          <p className={styles.pendingText}>
            🚀 This account is still under review. Account will be live soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Hero Header */}
      <TalentPageHeader
        first_name={first_name}
        last_name={last_name}
        title={title}
        city={city}
        country={country}
        image_url={image_url}
        last_active={last_active}
        email={email}
        talent={talent}
        mentor={mentor}
        recruiter={recruiter}
        approved_roles={approved_roles}
      />

      {/* Two-Column Content Grid */}
      <div className={styles.contentGrid}>
        {/* Main Content (Left Column) */}
        <main className={styles.mainContent}>
          {/* Bio Section */}
          {(description || !canViewSensitive) && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Bio</h2>
              {canViewSensitive ? (
                description ? (
                  <ProfileAboutWork about_work={description} />
                ) : null
              ) : (
                <div className={`flex flex-col items-center justify-center text-center border border-yellow-200 rounded-xl bg-[#fef5cf]/30 ${styles.lockedContentCard}`}>
                  <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100">
                    <LockClosedIcon className="w-10 h-10 text-amber-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Content Locked
                  </h4>
                  <p className="text-gray-600 mb-5 max-w-md">
                    Connect your wallet to view this bio and unlock full details.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-lg shadow-md hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 hover:shadow-lg"
                  >
                    <LockClosedIcon className="w-5 h-5" />
                    Connect Wallet to View
                  </button>
                </div>
              )}
            </section>
          )}

          {/* About Work Section */}
          {(about_work || !canViewSensitive) && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About My Work</h2>
              {canViewSensitive ? (
                about_work ? (
                  <ProfileAboutWork about_work={about_work} />
                ) : null
              ) : (
                <div className={`flex flex-col items-center justify-center text-center border border-yellow-200 rounded-xl bg-[#fef5cf]/30 ${styles.lockedContentCard}`}>
                  <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100">
                    <LockClosedIcon className="w-10 h-10 text-amber-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Content Locked
                  </h4>
                  <p className="text-gray-600 mb-5 max-w-md">
                    Connect your wallet to view this section and unlock full details.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-lg shadow-md hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 hover:shadow-lg"
                  >
                    <LockClosedIcon className="w-5 h-5" />
                    Connect Wallet to View
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Skills Section */}
          {skills && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Skills & Expertise</h2>
              <div className={styles.skillsContainer}>
                {skills.split(",").map((skill, index) => (
                  <span key={index} className={styles.skillTag}>
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Portfolio/CV Section - Only visible to verified users */}
          {cv_url && canViewSensitive && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Portfolio & Resume</h2>
              <TalentsCVSection cv_url={cv_url} talent_status={talent_status} approved={approved} />
            </section>
          )}
        </main>

        {/* Sidebar (Right Column) */}
        <aside className={styles.sidebar}>
          <TalentPageSidebar
            years_experience={years_experience}
            jobs_completed={jobs_completed}
            response_time={response_time}
            rating={rating}
            remote_only={remote_only}
            freelance_only={freelance_only}
            timezone={timezone}
            languages={languages}
            min_rate={min_rate ?? rate}
            max_rate={max_rate ?? rate}
            availability={true} // Can be made dynamic based on availability field
            linkedin={linkedin}
            github={github}
            twitter={twitter}
            portfolio={portfolio}
            stackoverflow={stackoverflow}
          />
        </aside>
      </div>
    </div>
  );
}
