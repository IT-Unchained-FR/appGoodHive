import type { Metadata } from "next";

import {
  CODE_OF_HIVE_CONTENT,
  CODE_OF_HIVE_COHORT,
} from "@/app/constants/code-of-hive";
import { CodeOfHiveSeal } from "@/app/components/code-of-hive/CodeOfHiveSeal";

import { CodeOfHiveActions } from "./CodeOfHiveActions";
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

export default function CodeOfTheHivePage() {
  const content = CODE_OF_HIVE_CONTENT;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroSeal}>
          <CodeOfHiveSeal cohort={CODE_OF_HIVE_COHORT} size={300} priority />
        </div>
        <h1 className={styles.heroTitle}>{content.title}</h1>
        <div className={styles.heroIntro}>
          {content.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className={styles.principles} aria-label="The seven principles">
        {content.principles.map((principle) => (
          <article key={principle.numeral} className={styles.principle}>
            <div className={styles.principleNumeral} aria-hidden="true">
              {principle.numeral}
            </div>
            <div className={styles.principleBody}>
              <h2 className={styles.principleTitle}>
                <span className={styles.principleNumeralInline}>
                  {principle.numeral}.
                </span>{" "}
                {principle.title}
              </h2>
              {principle.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className={styles.commitment}>
        <h2 className={styles.commitmentHeading}>
          {content.commitment.heading}
        </h2>
        <div className={styles.commitmentLines}>
          {content.commitment.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <p className={styles.commitmentClosing}>{content.commitment.closing}</p>
      </section>

      <section className={styles.ctaSection} aria-label="Sign the Code">
        <CodeOfHiveActions />
      </section>
    </main>
  );
}
