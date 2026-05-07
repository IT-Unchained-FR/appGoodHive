"use client";

import type { LinkClickType } from "@/lib/contact-logs";

interface TrackedExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  shouldTrack: boolean;
  actorType: "company" | "talent";
  companyUserId: string;
  talentUserId: string;
  linkType: LinkClickType;
  sourcePage: string;
  jobId?: string;
}

export function TrackedExternalLink({
  href,
  children,
  className,
  shouldTrack,
  actorType,
  companyUserId,
  talentUserId,
  linkType,
  sourcePage,
  jobId,
}: TrackedExternalLinkProps) {
  function handleClick() {
    if (!shouldTrack || !companyUserId || !talentUserId) return;

    // Fire-and-forget — do not await, do not block the navigation
    fetch("/api/contact-logs", {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyUserId,
        talentUserId,
        actorType,
        contactType: "link_click",
        linkType,
        linkUrl: href,
        sourcePage,
        jobId: jobId ?? null,
      }),
    }).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("Contact link click tracking failed:", error);
      }
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
