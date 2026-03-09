"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./company-bio-section.module.scss";

import "react-quill/dist/quill.snow.css";
import "@/app/styles/rich-text.css";

interface TruncatedBioProps {
  text: string;
  maxLength?: number;
}

export const CompanyBio: React.FC<TruncatedBioProps> = ({
  text,
  maxLength = 220,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const plainText = text?.replace(/<[^>]*>/g, "") || "";
  const shouldTruncate = plainText.length > maxLength;

  let displayHtml = text;
  if (!isExpanded && shouldTruncate) {
    const truncateIndex =
      text.indexOf(plainText.substring(maxLength, maxLength + 20)) || maxLength;
    displayHtml = `${text.substring(0, truncateIndex)}...`;
  }

  return (
    <div className={styles.bioCard}>
      <div
        className={`${styles.bioText} ${isExpanded ? styles.expanded : styles.collapsed}`}
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />

      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={styles.toggleButton}
        >
          <span>{isExpanded ? "Show less" : "Read more"}</span>
          {isExpanded ? (
            <ChevronUp className={styles.toggleIcon} />
          ) : (
            <ChevronDown className={styles.toggleIcon} />
          )}
        </button>
      )}
    </div>
  );
};
