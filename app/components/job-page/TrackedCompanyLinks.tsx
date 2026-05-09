"use client";

import { Globe, Linkedin, Twitter } from "lucide-react";
import type { LinkClickType } from "@/lib/contact-logs";
import { TrackedExternalLink } from "@/components/TrackedExternalLink";

type CompanyLinkIcon = "website" | "linkedin" | "twitter";

interface CompanyLink {
  href: string;
  icon: CompanyLinkIcon;
  label: string;
}

interface TrackedCompanyLinksProps {
  links: CompanyLink[];
  shouldTrack: boolean;
  companyUserId: string;
  talentUserId: string;
  sourcePage: string;
  jobId: string;
}

const ICON_TO_LINK_TYPE: Record<CompanyLinkIcon, LinkClickType> = {
  linkedin: "linkedin",
  twitter: "twitter",
  website: "website",
};

const ICONS = {
  linkedin: Linkedin,
  twitter: Twitter,
  website: Globe,
};

export function TrackedCompanyLinks({
  links,
  shouldTrack,
  companyUserId,
  talentUserId,
  sourcePage,
  jobId,
}: TrackedCompanyLinksProps) {
  return (
    <>
      {links.map((item) => {
        const linkType = ICON_TO_LINK_TYPE[item.icon];
        const Icon = ICONS[item.icon];

        if (linkType) {
          return (
            <TrackedExternalLink
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="flex items-center gap-2 transition hover:text-slate-900"
              shouldTrack={shouldTrack}
              actorType="talent"
              companyUserId={companyUserId}
              talentUserId={talentUserId}
              linkType={linkType}
              sourcePage={sourcePage}
              jobId={jobId}
            >
              <Icon className="h-4 w-4 text-amber-600" />
              {item.label}
            </TrackedExternalLink>
          );
        }

        return (
          <a
            key={`${item.label}-${item.href}`}
            className="flex items-center gap-2 transition hover:text-slate-900"
            href={item.href}
            rel="noreferrer"
            target="_blank"
          >
            <Icon className="h-4 w-4 text-amber-600" />
            {item.label}
          </a>
        );
      })}
    </>
  );
}
