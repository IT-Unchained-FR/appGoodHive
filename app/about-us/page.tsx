"use client";

import { Metadata } from "next";
import Image from "next/image";
import { ABOUT_CONTENT, TEAM_MEMBERS, VIDEO_CONFIG } from "./about-us.constants";
import styles from "./about-us.module.scss";

// Note: Metadata export is commented out because this is a client component
// If you need metadata, convert sections to server components or use a layout
// export const metadata: Metadata = {
//   title: "About Us - GoodHive | The Sweetest Web3 Talent Marketplace",
//   description: "Learn about GoodHive's mission to revolutionize Web3 recruitment...",
// };

export default function AboutUsPage() {
  return (
    <div className={styles.aboutPage}>
      {/* About Section */}
      <section className={styles.aboutSection}>
        {/* Background Decorative Elements */}
        <div className={styles.backgroundDecor}>
          {/* Honeycomb Pattern */}
          <div className={styles.honeycombPattern}></div>

          {/* Floating Hexagons */}
          <div className={`${styles.floatingHexagon} ${styles.hex1}`}></div>
          <div className={`${styles.floatingHexagon} ${styles.hex2}`}></div>

          {/* Animated Bees */}
          <div className={`${styles.floatingBee} ${styles.bee1}`}>
            <span>🐝</span>
          </div>
          <div className={`${styles.floatingBee} ${styles.bee2}`}>
            <span>🐝</span>
          </div>

          {/* Pollen Particles */}
          <div className={`${styles.pollenParticle} ${styles.pollen1}`}></div>
          <div className={`${styles.pollenParticle} ${styles.pollen2}`}></div>
        </div>

        <div className={styles.container}>
          {/* Header */}
          <div className={styles.headerSection}>
            <div className={styles.badge}>
              <span style={{ marginRight: "0.5rem" }}>✨</span>
              {ABOUT_CONTENT.hero.subtitle}
            </div>
            <h1 className={styles.title}>
              <span className={styles.highlight}>{ABOUT_CONTENT.hero.title}</span>
            </h1>
            <p className={styles.description}>{ABOUT_CONTENT.hero.description}</p>
          </div>

          {/* Video Section */}
          <div className={styles.videoSection}>
            <div className={styles.videoWrapper}>
              <div className={styles.videoGlow}></div>
              <div className={styles.videoContainer}>
                <iframe
                  src={VIDEO_CONFIG.embedUrl}
                  title={VIDEO_CONFIG.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              {/* Decorative Corners */}
              <div className={`${styles.decorCorner} ${styles.corner1}`}></div>
              <div className={`${styles.decorCorner} ${styles.corner2}`}></div>
            </div>
          </div>

          {/* Philosophy Section */}
          <div className={styles.philosophySection}>
            {/* Philosophy Card */}
            <div className={styles.philosophyCard}>
              <div className={styles.philosophyIcon}>🎯</div>
              <h2 className={styles.philosophyTitle}>
                {ABOUT_CONTENT.philosophy.title}
              </h2>
              <p className={styles.philosophyText}>
                {ABOUT_CONTENT.philosophy.description}
              </p>
            </div>

            {/* Mission Card */}
            <div className={styles.philosophyCard}>
              <div className={styles.philosophyIcon}>🚀</div>
              <h3 className={styles.philosophyTitle}>
                {ABOUT_CONTENT.mission.title}
              </h3>
              <p className={styles.philosophyText}>
                {ABOUT_CONTENT.mission.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={styles.teamSection}>
        <div className={styles.container}>
          {/* Team Header */}
          <div className={styles.teamHeader}>
            <h2 className={styles.teamTitle}>
              Meet the talented team
              <br />
              who make all this happen
            </h2>
            <p className={styles.teamSubtitle}>
              Our philosophy is simple; hire great people and give them the
              resources and support to do their best work.
            </p>
          </div>

          {/* Team Grid */}
          <div className={styles.teamGrid}>
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id} className={styles.teamCard}>
                <div className={styles.teamImageWrapper}>
                  <div
                    className={styles.teamImage}
                    style={{ backgroundColor: member.backgroundColor }}
                  >
                    {/* Placeholder for team member image */}
                    {/* In production, use: <Image src={member.imageUrl} alt={member.name} fill /> */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "4rem",
                        color: "rgba(0,0,0,0.1)",
                      }}
                    >
                      👤
                    </div>
                  </div>
                </div>
                <div className={styles.teamInfo}>
                  <h3 className={styles.teamName}>{member.name}</h3>
                  <p className={styles.teamRole}>{member.role}</p>
                  <p className={styles.teamDescription}>{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
