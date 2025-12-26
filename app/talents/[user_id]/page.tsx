"use client";

import { useState, useEffect } from "react";
import { TalentProfileData } from "./types";
import ProfileAboutWork from "@/app/components/talents/ProfileAboutWork";
import TalentsCVSection from "@/app/components/talents/TalentsCVSection";
import BeeHiveSpinner from "@/app/components/spinners/bee-hive-spinner";
import { TalentPageHeader } from "@/app/components/talent-page/TalentPageHeader";
import { TalentPageSidebar } from "@/app/components/talent-page/TalentPageSidebar";
import { useAuth } from "@/app/contexts/AuthContext";
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
          {description && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Bio</h2>
              <ProfileAboutWork about_work={description} />
            </section>
          )}

          {/* About Work Section */}
          {about_work && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About My Work</h2>
              <ProfileAboutWork about_work={about_work} />
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
          {cv_url && user && (
            user.talent_status === "approved" ||
            user.mentor_status === "approved" ||
            user.recruiter_status === "approved"
          ) && (
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
            rate={rate}
            availability={true} // Can be made dynamic based on availability field
            linkedin={linkedin}
            github={github}
            twitter={twitter}
            portfolio={portfolio}
            telegram={telegram}
            stackoverflow={stackoverflow}
          />
        </aside>
      </div>
    </div>
  );
}
