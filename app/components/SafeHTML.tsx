"use client";

import DOMPurify from "isomorphic-dompurify";

interface SafeHTMLProps {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

/**
 * SafeHTML Component
 *
 * Renders user-provided HTML content after sanitizing it with DOMPurify
 * to prevent XSS attacks. Use this component instead of dangerouslySetInnerHTML.
 *
 * @param html - The HTML string to sanitize and render
 * @param className - Optional CSS class names for the container
 * @param allowedTags - Optional array of allowed HTML tags (default: safe subset)
 * @param allowedAttributes - Optional map of allowed attributes per tag
 */
export default function SafeHTML({
  html,
  className = "",
  allowedTags,
  allowedAttributes,
}: SafeHTMLProps) {
  const config: DOMPurify.Config = {
    // Remove all dangerous tags and attributes by default
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  };

  // If specific tags are allowed, use them
  if (allowedTags) {
    config.ALLOWED_TAGS = allowedTags;
  }

  // If specific attributes are allowed per tag, use them
  if (allowedAttributes) {
    config.ALLOWED_ATTR = Object.values(allowedAttributes).flat();
  }

  // Sanitize the HTML
  const sanitizedHTML = DOMPurify.sanitize(html || "", config);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}
