import Link from "next/link";

import {
  CODE_OF_HIVE_COPY,
  CODE_OF_HIVE_PATH,
  formatMemberSince,
} from "@/app/constants/code-of-hive";
import styles from "./CodeOfHiveBadge.module.scss";

interface CodeOfHiveBadgeProps {
  signedAt?: string | Date | null;
  /** Compact drops the "Member since" line — for dense rows like search results. */
  variant?: "default" | "compact";
  className?: string;
}

/**
 * The profile-facing badge.
 *
 * Deliberately not the full seal artwork: at this size the seal's lettering is
 * illegible, so the mark is redrawn as a crisp inline hexagon. This also keeps
 * profile pages free of a decorative image request.
 *
 * Render only when the signature is true in the database — there is no prop
 * that lets a Talent turn this on.
 */
export function CodeOfHiveBadge({
  signedAt,
  variant = "default",
  className = "",
}: CodeOfHiveBadgeProps) {
  const memberSince = formatMemberSince(signedAt);
  const showMemberSince = variant === "default" && Boolean(memberSince);

  return (
    <Link
      href={CODE_OF_HIVE_PATH}
      className={`${styles.badge} ${variant === "compact" ? styles.compact : ""} ${className}`}
      title={
        memberSince
          ? `${CODE_OF_HIVE_COPY.badgeTitle} — ${memberSince}`
          : CODE_OF_HIVE_COPY.badgeTitle
      }
    >
      <span className={styles.glyph} aria-hidden="true">
        <svg viewBox="0 0 100 100" role="presentation" focusable="false">
          <defs>
            <linearGradient id="cothGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FCE38A" />
              <stop offset="45%" stopColor="#F0B429" />
              <stop offset="100%" stopColor="#C98A10" />
            </linearGradient>
          </defs>
          <path
            d="M50 3 L93 27 L93 73 L50 97 L7 73 L7 27 Z"
            fill="url(#cothGold)"
          />
          <path
            d="M32 51 L44 63 L69 38"
            fill="none"
            stroke="#1A1333"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className={styles.text}>
        <span className={styles.title}>{CODE_OF_HIVE_COPY.badgeTitle}</span>
        {showMemberSince ? (
          <span className={styles.subtitle}>{memberSince}</span>
        ) : null}
      </span>
    </Link>
  );
}

export default CodeOfHiveBadge;
