"use client";

import type { LucideIcon } from "lucide-react";
import type { LinkClickType } from "@/lib/contact-logs";
import { TrackedExternalLink } from "@/components/TrackedExternalLink";

interface CompanyLink {
  href: string;
  icon: LucideIcon;
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

const LABEL_TO_LINK_TYPE: Record<string, LinkClickType> = {
  LinkedIn: "linkedin",
  Twitter: "twitter",
  Website: "website",
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
        const linkType = LABEL_TO_LINK_TYPE[item.label];

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
              <item.icon className="h-4 w-4 text-amber-600" />
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
            <item.icon className="h-4 w-4 text-amber-600" />
            {item.label}
          </a>
        );
      })}
    </>
  );
}
