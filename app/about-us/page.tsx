"use client";

import Link from "next/link";
import { ABOUT_CONTENT, TEAM_MEMBERS, VIDEO_CONFIG } from "./about-us.constants";
import styles from "./about-us.module.scss";

const IMPACT_METRICS = [
  {
    id: "companies",
    value: "220+",
    label: "Partner companies",
    description: "Web3 teams discovering talent through GoodHive.",
  },
  {
    id: "placements",
    value: "1.2k",
    label: "Successful placements",
    description: "Matches completed across engineering, design, and product.",
  },
];

const VALUE_PILLARS = [
  {
    id: "philosophy",
    icon: "🧭",
    title: ABOUT_CONTENT.philosophy.title,
    description: ABOUT_CONTENT.philosophy.description,
  },
  {
    id: "mission",
    icon: "🚀",
    title: ABOUT_CONTENT.mission.title,
    description: ABOUT_CONTENT.mission.description,
  },
  {
    id: "community",
    icon: "🤝",
    title: "Community First",
    description:
      "We build with our ecosystem. Every feature is co-created with founders, contributors, and talent to keep incentives aligned.",
  },
];

const JOURNEY_MOMENTS = [
  {
    id: "inception",
    year: "2019",
    title: "Vision takes shape",
    description:
      "A small founding crew left traditional recruitment to design a decentralized alternative focused on trust and transparency.",
  },
  {
    id: "launch",
    year: "2021",
    title: "Marketplace launches",
    description:
      "GoodHive opens to the public, onboarding the first cohort of DAOs, Web3 studios, and independent builders.",
  },
  {
    id: "growth",
    year: "2023",
    title: "Global expansion",
    description:
      "We introduce compliance tooling, escrow, and community governance to power cross-border collaboration at scale.",
  },
];

export default function AboutUsPage() {
  return (
    <div className={styles.aboutPage}>
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={`${styles.heroBlob} ${styles.heroBlobOne}`} />
          <div className={`${styles.heroBlob} ${styles.heroBlobTwo}`} />
          <div className={`${styles.heroGridlines}`} />
        </div>

        <div className={styles.container}>
          <div className={styles.heroLayout}>
            <div className={styles.heroContent}>
              <span className={styles.subtitleBadge}>
                {ABOUT_CONTENT.hero.subtitle}
              </span>
              <h1 className={styles.heroTitle}>
                {ABOUT_CONTENT.hero.title}
                <span className={styles.titleAccent}> for builders who lead with trust.</span>
              </h1>
              <p className={styles.heroDescription}>
                {ABOUT_CONTENT.hero.description}
              </p>

              <div className={styles.heroActions}>
                <Link href="/contact" className={styles.primaryButton}>
                  Talk to our team
                </Link>
                <Link href="/companies" className={styles.secondaryButton}>
                  Explore the platform
                </Link>
              </div>

              <div className={styles.metricRow}>
                {IMPACT_METRICS.map((metric) => (
                  <div key={metric.id} className={styles.metricCard}>
                    <span className={styles.metricValue}>{metric.value}</span>
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <p className={styles.metricDescription}>{metric.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.heroMedia}>
              <div className={styles.mediaCard}>
                <div className={styles.mediaHeader}>
                  <span className={styles.mediaTag}>Watch GoodHive in action</span>
                  <span className={styles.mediaPulse} />
                </div>
                <div className={styles.mediaFrame}>
                  <iframe
                    src={VIDEO_CONFIG.embedUrl}
                    title={VIDEO_CONFIG.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className={styles.mediaFooter}>
                  <div className={styles.trustPill}>
                    <span className={styles.pillDot} />
                    Trusted by teams scaling decentralized products
                  </div>
                  <div className={styles.avatarStack}>
                    {new Array(5).fill(null).map((_, index) => (
                      <span key={`avatar-circle-${index}`} className={styles.avatarCircle}>
                        GH
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.valuesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Why GoodHive</span>
            <h2 className={styles.sectionTitle}>A platform shaped by our values</h2>
            <p className={styles.sectionDescription}>
              We align incentives between talent, companies, and the broader ecosystem by staying grounded in principles that keep the network healthy.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            {VALUE_PILLARS.map((pillar) => (
              <article key={pillar.id} className={styles.valueCard}>
                <div className={styles.valueIcon}>{pillar.icon}</div>
                <h3 className={styles.valueTitle}>{pillar.title}</h3>
                <p className={styles.valueDescription}>{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.journeySection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Our Journey</span>
            <h2 className={styles.sectionTitle}>From idea to thriving ecosystem</h2>
            <p className={styles.sectionDescription}>
              GoodHive keeps shipping new primitives for the future of work. Here&rsquo;s a snapshot of how we got here.
            </p>
          </div>

          <div className={styles.timeline}>
            {JOURNEY_MOMENTS.map((moment, index) => (
              <div key={moment.id} className={styles.timelineItem}>
                <div className={styles.timelineMarker}>
                  <span className={styles.timelineYear}>{moment.year}</span>
                  {index !== JOURNEY_MOMENTS.length - 1 && (
                    <span className={styles.timelineConnector} />
                  )}
                </div>
                <div className={styles.timelineContent}>
                  <h3 className={styles.timelineTitle}>{moment.title}</h3>
                  <p className={styles.timelineDescription}>{moment.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.teamSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>The Team</span>
            <h2 className={styles.sectionTitle}>Meet the people shaping the hive</h2>
            <p className={styles.sectionDescription}>
              From product strategy to research and engineering, our team blends experience from leading Web2 and Web3 companies with a bias for action.
            </p>
          </div>

          <div className={styles.teamGrid}>
            {TEAM_MEMBERS.map((member) => (
              <article key={member.id} className={styles.teamCard}>
                <div className={styles.teamPortrait}>
                  <span className={styles.teamInitials}>
                    {member.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part.charAt(0))
                      .join("")}
                  </span>
                  <div className={styles.portraitGlow} />
                </div>
                <div className={styles.teamCopy}>
                  <h3 className={styles.teamName}>{member.name}</h3>
                  <p className={styles.teamRole}>{member.role}</p>
                  <p className={styles.teamBio}>{member.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
