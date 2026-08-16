import type { Metadata } from "next";

import {
  CODE_OF_HIVE_CONTENT,
} from "@/app/constants/code-of-hive";

import { CodeOfHiveActions } from "./CodeOfHiveActions";
import { CommitmentClosingText } from "./CommitmentClosingText";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "The Code of the Hive — GoodHive",
  description:
    "GoodHive is built on trust. The Code of the Hive is the commitment our members give to clients and to each other — seven principles on judgment, recommendation and shared reputation.",
  keywords:
    "Code of the Hive, GoodHive, talent commitment, recruitment ethics, trusted network, Web3 recruitment",
  openGraph: {
    title: "The Code of the Hive — GoodHive",
    description:
      "Seven principles our members commit to. The Code is the promise. Reputation is the proof.",
    images: ["/img/code-of-hive-badge.webp"],
  },
};

/* ──────────────────────────────────────────────────────────────────────────────
 * SVG icons for each principle. White stroke on gold circle background.
 * ────────────────────────────────────────────────────────────────────────── */

const PRINCIPLE_ICONS: Record<string, React.ReactNode> = {
  I: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
    </svg>
  ),
  II: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <path d="M16 4.5c1.5.4 2.5 1.7 2.5 3.5s-1 3.1-2.5 3.5" />
      <path d="M15 20c0-2.5 1.4-4.2 4-4.7" />
    </svg>
  ),
  III: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="#fff" />
    </svg>
  ),
  IV: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
    </svg>
  ),
  V: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.35-9.5-8.5C.9 9 2.4 5.5 5.8 5c2-.3 3.6.7 4.7 2.2" />
      <path d="M12 21s7-4.35 9.5-8.5C23.1 9 21.6 5.5 18.2 5c-2-.3-3.6.7-4.7 2.2" />
    </svg>
  ),
  VI: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,3 19,7 19,15 12,19 5,15 5,7" />
      <polygon points="12,7.5 15.5,9.5 15.5,13.5 12,15.5 8.5,13.5 8.5,9.5" />
    </svg>
  ),
  VII: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19h16" />
      <path d="M6 19V9l4-3 4 4 4-6v15" />
    </svg>
  ),
};

export default function CodeOfTheHivePage() {
  const content = CODE_OF_HIVE_CONTENT;

  return (
    <main className={styles.page}>
      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroIcon}>
          <div className={styles.heroIconPulse} />
          <svg viewBox="0 0 132 132" width="132" height="132" style={{ position: "relative" }}>
            <polygon
              points="66,4 122,36 122,96 66,128 10,96 10,36"
              fill="none"
              stroke="#f0b429"
              strokeWidth="3"
            />
            <defs>
              <linearGradient id="hexgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3a2a5c" />
                <stop offset="100%" stopColor="#1c1730" />
              </linearGradient>
            </defs>
            <polygon
              points="66,18 108,42 108,90 66,114 24,90 24,42"
              fill="url(#hexgrad)"
            />
            <ellipse cx="66" cy="60" rx="8" ry="14" fill="#f0b429" />
            <path d="M66 48 Q40 30 30 52 Q48 56 66 48" fill="#f0b429" opacity="0.55" />
            <path d="M66 48 Q92 30 102 52 Q84 56 66 48" fill="#f0b429" opacity="0.55" />
            <rect x="60" y="60" width="12" height="26" rx="3" fill="#1c1730" />
          </svg>
        </div>

        <h1 className={styles.heroTitle}>{content.title}</h1>
        <div className={styles.heroIntro}>
          {content.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      {/* ─── Principles (Vertical Timeline) ───────────────────────── */}
      <section className={styles.principles} aria-label="The seven principles">
        {content.principles.map((principle, index) => {
          const isLast = index === content.principles.length - 1;

          return (
            <div key={principle.numeral} className={styles.principle}>
              {/* Left column: icon circle + connecting line */}
              <div className={styles.principleLeft}>
                <div className={styles.principleIcon}>
                  {PRINCIPLE_ICONS[principle.numeral]}
                </div>
                {!isLast && <div className={styles.principleLine} />}
              </div>

              {/* Right column: content */}
              <div className={styles.principleContent}>
                <span className={styles.principleWatermark} aria-hidden="true">
                  {principle.numeral}
                </span>
                <div className={styles.principleInner}>
                  <span className={styles.principleLabel}>
                    PRINCIPLE {principle.numeral}
                  </span>
                  <h3 className={styles.principleTitle}>{principle.title}</h3>
                  <div className={styles.principleBody}>
                    {principle.body.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ─── Commitment Card ──────────────────────────────────────── */}
      <section className={styles.commitment}>
        <div className={styles.commitmentCard}>
          {/* Decorative elements */}
          <div className={styles.commitmentBlur1} />
          <div className={styles.commitmentBlur2} />
          <div className={styles.commitmentBadge}>COMMITTED MEMBER</div>

          {/* Header */}
          <div className={styles.commitmentHeader}>
            <span className={styles.commitmentLabel}>MEMBER OATH</span>
            <h2 className={styles.commitmentHeading}>
              {content.commitment.heading}
            </h2>
          </div>

          {/* 2-column grid of commitment lines */}
          <div className={styles.commitmentGrid}>
            {content.commitment.lines.map((line) => (
              <div key={line} className={styles.commitmentItem}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="11" fill="#f0b429" />
                  <path
                    d="M7 12.5l3 3 7-7"
                    stroke="#1c1730"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p>{line}</p>
              </div>
            ))}
          </div>

          {/* Closing */}
          <div className={styles.commitmentClosing}>
            <p className={styles.commitmentClosingText}>
              <CommitmentClosingText />
            </p>
            <svg width="180" height="14" viewBox="0 0 180 14" style={{ opacity: 0.7, display: "block", margin: "0 auto" }}>
              <path
                d="M2 8 Q30 2 50 8 T100 8 T178 6"
                stroke="#f0b429"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────── */}
      <section className={styles.ctaSection} aria-label="Sign the Code">
        <CodeOfHiveActions />
      </section>
    </main>
  );
}
