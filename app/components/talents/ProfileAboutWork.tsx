"use client";

import React from "react";
import "@/app/styles/rich-text.css";

interface Props {
  about_work: string;
  /**
   * When true, contact channels inside the rich text are masked for viewers
   * who are not entitled to see them: links are unwrapped (their URLs never
   * render), and email addresses, phone numbers, social-profile URLs and the
   * given name terms are replaced with a placeholder in the visible text.
   */
  maskSensitive?: boolean;
  sensitiveTerms?: string[];
}

const MASK_PLACEHOLDER = "•••";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const CONTACT_DOMAIN_PATTERN =
  /\b(?:https?:\/\/|www\.)?(?:linkedin\.com|github\.com|gitlab\.com|twitter\.com|x\.com|t\.me|telegram\.me|facebook\.com|instagram\.com|stackoverflow\.com)(?:\/[^\s<]*)?/gi;

function maskSensitiveHtml(html: string, sensitiveTerms: string[]): string {
  if (!html) return html;

  const terms = sensitiveTerms
    .map((term) => term?.trim())
    .filter((term): term is string => !!term && term.length > 1);

  // Split into tags and text so replacements only touch visible text.
  return html
    .split(/(<[^>]+>)/g)
    .map((segment) => {
      if (segment.startsWith("<")) {
        // Drop anchor tags entirely; the link text survives as plain text.
        return /^<\/?a(?:\s|>)/i.test(segment) ? "" : segment;
      }

      let text = segment;
      for (const term of terms) {
        text = text.replace(
          new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"),
          MASK_PLACEHOLDER,
        );
      }
      text = text.replace(
        /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g,
        MASK_PLACEHOLDER,
      );
      text = text.replace(CONTACT_DOMAIN_PATTERN, MASK_PLACEHOLDER);
      text = text.replace(/\+?\d[\d\s().-]{6,}\d/g, MASK_PLACEHOLDER);
      return text;
    })
    .join("");
}

const ProfileAboutWork: React.FC<Props> = ({
  about_work,
  maskSensitive = false,
  sensitiveTerms = [],
}) => {
  const [extendedAboutWork, setExtendedAboutWork] = React.useState(false);

  const content = maskSensitive
    ? maskSensitiveHtml(about_work, sensitiveTerms)
    : about_work;

  const maximum_charecter = 1000;
  const plain_text = content?.replace(/<[^>]*>/g, "") || "";

  if (plain_text.length > maximum_charecter) {
    if (extendedAboutWork) {
      return (
        <div className="w-full">
          <div
            className="rich-text-content"
            style={{ fontSize: "1rem", lineHeight: "1.7", color: "#374151" }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
          <button
            type="button"
            className="mt-4 px-4 py-2 text-sm font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer border border-amber-200"
            onClick={() => setExtendedAboutWork(false)}
          >
            Show Less
          </button>
        </div>
      );
    } else {
      // For truncated view, use a div with the first part of the HTML
      const truncatedHtml = content.substring(
        0,
        content.indexOf(
          plain_text.substring(maximum_charecter, maximum_charecter + 20),
        ) || maximum_charecter,
      );

      return (
        <div className="w-full">
          <div
            className="rich-text-content"
            style={{ fontSize: "1rem", lineHeight: "1.7", color: "#374151" }}
            dangerouslySetInnerHTML={{ __html: truncatedHtml }}
          />
          <button
            type="button"
            className="mt-4 px-4 py-2 text-sm font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer border border-amber-200"
            onClick={() => setExtendedAboutWork(true)}
          >
            Show More
          </button>
        </div>
      );
    }
  }

  return (
    <div className="w-full">
      <div
        className="rich-text-content"
        style={{ fontSize: "1rem", lineHeight: "1.7", color: "#374151" }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default ProfileAboutWork;
