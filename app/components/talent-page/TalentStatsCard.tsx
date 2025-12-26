"use client";

import { Briefcase, CheckCircle2, Clock, Star, BarChart3 } from "lucide-react";
import styles from "./TalentStatsCard.module.scss";

interface TalentStatsCardProps {
  years_experience?: number;
  jobs_completed?: number;
  response_time?: string;
  rating?: number;
}

export const TalentStatsCard = ({
  years_experience,
  jobs_completed,
  response_time,
  rating,
}: TalentStatsCardProps) => {
  // Check if any stats are available
  const hasStats =
    years_experience !== undefined ||
    jobs_completed !== undefined ||
    response_time !== undefined ||
    rating !== undefined;

  if (!hasStats) {
    return (
      <div className={styles.statsCard}>
        <h3 className={styles.cardTitle}>Stats & Metrics</h3>
        <div className={styles.emptyState}>
          <BarChart3 />
          <p>Stats will appear here once available</p>
        </div>
      </div>
    );
  }

  // Render rating stars
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={i <= rating ? styles.filled : styles.empty}
          size={16}
        />
      );
    }
    return <div className={styles.ratingStars}>{stars}</div>;
  };

  return (
    <div className={styles.statsCard}>
      <h3 className={styles.cardTitle}>Stats & Metrics</h3>

      <div className={styles.statsGrid}>
        {years_experience !== undefined && (
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <Briefcase />
            </div>
            <span className={styles.statValue}>{years_experience}+</span>
            <span className={styles.statLabel}>
              {years_experience === 1 ? "Year Exp" : "Years Exp"}
            </span>
          </div>
        )}

        {jobs_completed !== undefined && (
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <CheckCircle2 />
            </div>
            <span className={styles.statValue}>{jobs_completed}</span>
            <span className={styles.statLabel}>
              {jobs_completed === 1 ? "Job Done" : "Jobs Done"}
            </span>
          </div>
        )}

        {response_time && (
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <Clock />
            </div>
            <span className={styles.statValue}>{response_time}</span>
            <span className={styles.statLabel}>Response Time</span>
          </div>
        )}

        {rating !== undefined && rating > 0 && (
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <Star />
            </div>
            {renderStars(rating)}
            <span className={styles.statLabel}>Rating</span>
          </div>
        )}
      </div>
    </div>
  );
};
