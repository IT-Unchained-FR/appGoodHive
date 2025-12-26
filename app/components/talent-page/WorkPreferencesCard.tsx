"use client";

import { Home, Briefcase, Globe, Languages, Check, Settings } from "lucide-react";
import styles from "./WorkPreferencesCard.module.scss";

interface WorkPreferencesCardProps {
  remote_only?: boolean;
  freelance_only?: boolean;
  timezone?: string;
  languages?: string[] | string;
}

export const WorkPreferencesCard = ({
  remote_only,
  freelance_only,
  timezone,
  languages,
}: WorkPreferencesCardProps) => {
  // Parse languages if it's a comma-separated string
  const languageArray = Array.isArray(languages)
    ? languages
    : languages
    ? languages.split(",").map((lang) => lang.trim())
    : [];

  // Check if any preferences are available
  const hasPreferences =
    remote_only !== undefined ||
    freelance_only !== undefined ||
    timezone ||
    languageArray.length > 0;

  if (!hasPreferences) {
    return (
      <div className={styles.preferencesCard}>
        <h3 className={styles.cardTitle}>Work Preferences</h3>
        <div className={styles.emptyState}>
          <Settings />
          <p>Preferences will appear here once available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.preferencesCard}>
      <h3 className={styles.cardTitle}>Work Preferences</h3>

      <div className={styles.preferencesList}>
        {remote_only !== undefined && (
          <div className={styles.preferenceItem}>
            <Home className={styles.preferenceIcon} />
            <span className={styles.preferenceLabel}>
              {remote_only ? "Remote Only" : "Open to Office"}
            </span>
            {remote_only && <Check className={styles.checkIcon} />}
          </div>
        )}

        {freelance_only !== undefined && (
          <div className={styles.preferenceItem}>
            <Briefcase className={styles.preferenceIcon} />
            <span className={styles.preferenceLabel}>
              {freelance_only ? "Freelance Only" : "Open to Full-time"}
            </span>
            {freelance_only && <Check className={styles.checkIcon} />}
          </div>
        )}

        {timezone && (
          <div className={styles.preferenceItem}>
            <Globe className={styles.preferenceIcon} />
            <span className={styles.preferenceLabel}>Timezone</span>
            <span className={styles.preferenceValue}>{timezone}</span>
          </div>
        )}

        {languageArray.length > 0 && (
          <div className={styles.preferenceItem}>
            <Languages className={styles.preferenceIcon} />
            <div style={{ flex: 1 }}>
              <span className={styles.preferenceLabel}>Languages</span>
              <div className={styles.languages}>
                {languageArray.map((lang, index) => (
                  <span key={index} className={styles.languageTag}>
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
