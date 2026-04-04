import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import { CompanyOpportunitiesTabs } from "@/app/components/companies/CompanyOpportunitiesTabs";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { type JobReviewStatus, resolveJobReviewStatus } from "@/lib/jobs/review";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Globe,
  Linkedin,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Twitter,
} from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import "@/app/styles/rich-text.css";

export const dynamic = "force-dynamic";

type CompanyProfilePageProps = {
  params: {
    userId: string;
  };
  searchParams?: {
    id?: string;
  };
};

type CompanyProfile = {
  address: string | null;
  approved: boolean;
  city: string | null;
  country: string | null;
  designation: string | null;
  email: string | null;
  github: string | null;
  headline: string | null;
  image_url: string | null;
  linkedin: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  portfolio: string | null;
  published: boolean;
  stackoverflow: string | null;
  telegram: string | null;
  twitter: string | null;
  user_id: string;
};

type CompanyJob = {
  budget: number;
  city: string | null;
  country: string | null;
  currency: string | null;
  description: string | null;
  duration: string | null;
  id: string;
  job_type: string | null;
  mentor: boolean;
  posted_at: string | null;
  published: boolean;
  project_type: string | null;
  recruiter: boolean;
  reviewStatus: JobReviewStatus;
  skills: string[];
  talent: boolean;
  title: string | null;
  type_engagement: string | null;
};

type ViewerState = {
  canViewContact: boolean;
  hasApprovedCompany: boolean;
  isAdmin: boolean;
  isApprovedTalent: boolean;
  isAuthenticated: boolean;
  isCompanyOwner: boolean;
};

type SocialLink = {
  href: string;
  icon: typeof Globe;
  label: string;
};

const SURFACE_CLASS =
  "rounded-[28px] bg-white/78 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-black/5 backdrop-blur-xl";

const META_PILL_CLASS =
  "inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5";

function stripHtml(value?: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatRelativeDate(dateValue?: string | null) {
  if (!dateValue) return "Recently updated";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently updated";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Posted today";
  if (diffDays === 1) return "Posted yesterday";
  if (diffDays < 7) return `Posted ${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `Posted ${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `Posted ${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
}

function formatBudget(amount: number, currency?: string | null) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Budget on request";
  }

  if (!currency || currency.toUpperCase() === "USDC" || currency.startsWith("0x")) {
    return `USDC ${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  }

  const normalizedCurrency = currency.toUpperCase();
  const supportedCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: supportedCurrencies.includes(normalizedCurrency)
      ? normalizedCurrency
      : "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLocation(city?: string | null, country?: string | null) {
  return [city, country].filter(Boolean).join(", ") || "Location not shared";
}

function formatPhone(code?: string | null, phone?: string | null) {
  return [code, phone].filter(Boolean).join(" ").trim();
}

function normalizeExternalUrl(url?: string | null) {
  if (!url) return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  return /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;
}

function formatUrlLabel(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  const rows = await sql<CompanyProfile[]>`
    SELECT
      user_id,
      designation,
      headline,
      address,
      country,
      city,
      phone_country_code,
      phone_number,
      email,
      telegram,
      image_url,
      linkedin,
      github,
      stackoverflow,
      twitter,
      portfolio,
      approved,
      published
    FROM goodhive.companies
    WHERE user_id = ${userId}::uuid
      AND published = true
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function getCompanyJobs(
  userId: string,
  includeInactive: boolean,
): Promise<CompanyJob[]> {
  const rows = includeInactive
    ? await sql<{
        budget: number | string | null;
        city: string | null;
        country: string | null;
        currency: string | null;
        description: string | null;
        duration: string | null;
        id: string;
        job_type: string | null;
        mentor: boolean | string | null;
        posted_at: string | null;
        project_type: string | null;
        published: boolean | null;
        recruiter: boolean | string | null;
        review_status: string | null;
        skills: string | null;
        talent: boolean | string | null;
        title: string | null;
        type_engagement: string | null;
      }[]>`
        SELECT
          id,
          title,
          description,
          budget,
          currency,
          project_type,
          job_type,
          type_engagement,
          duration,
          skills,
          country,
          city,
          posted_at,
          talent,
          mentor,
          recruiter,
          review_status,
          COALESCE(published, false) AS published
        FROM goodhive.job_offers
        WHERE user_id = ${userId}::uuid
        ORDER BY COALESCE(created_at, posted_at, NOW()) DESC NULLS LAST
      `
    : await sql<{
        budget: number | string | null;
        city: string | null;
        country: string | null;
        currency: string | null;
        description: string | null;
        duration: string | null;
        id: string;
        job_type: string | null;
        mentor: boolean | string | null;
        posted_at: string | null;
        project_type: string | null;
        published: boolean | null;
        recruiter: boolean | string | null;
        review_status: string | null;
        skills: string | null;
        talent: boolean | string | null;
        title: string | null;
        type_engagement: string | null;
      }[]>`
        SELECT
          id,
          title,
          description,
          budget,
          currency,
          project_type,
          job_type,
          type_engagement,
          duration,
          skills,
          country,
          city,
          posted_at,
          talent,
          mentor,
          recruiter,
          review_status,
          COALESCE(published, false) AS published
        FROM goodhive.job_offers
        WHERE user_id = ${userId}::uuid
          AND published = true
        ORDER BY COALESCE(created_at, posted_at, NOW()) DESC NULLS LAST
      `;

  return rows.map((row) => ({
    budget: Number(row.budget || 0),
    city: row.city,
    country: row.country,
    currency: row.currency,
    description: row.description,
    duration: row.duration,
    id: row.id,
    job_type: row.job_type,
    mentor: row.mentor === true || row.mentor === "true",
    posted_at: row.posted_at,
    published: row.published === true,
    project_type: row.project_type,
    recruiter: row.recruiter === true || row.recruiter === "true",
    reviewStatus: resolveJobReviewStatus(row.review_status, row.published),
    skills: row.skills
      ? row.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [],
    talent: row.talent === true || row.talent === "true",
    title: row.title,
    type_engagement: row.type_engagement,
  }));
}

async function getViewerState(
  viewerCompanyUserId: string,
  companyApproved: boolean,
): Promise<ViewerState> {
  const sessionUser = await getSessionUser();
  const adminToken = cookies().get("admin_token")?.value ?? null;

  let isAdmin = false;
  if (adminToken) {
    try {
      jwt.verify(adminToken, getAdminJWTSecret());
      isAdmin = true;
    } catch (error) {
      isAdmin = false;
    }
  }

  if (!sessionUser?.user_id) {
    return {
      canViewContact: false,
      hasApprovedCompany: false,
      isAdmin,
      isApprovedTalent: false,
      isAuthenticated: false,
      isCompanyOwner: false,
    };
  }

  const viewerUserId = sessionUser.user_id;
  const isCompanyOwner = viewerUserId === viewerCompanyUserId;

  const [userRows, companyRows] = await Promise.all([
    sql<{
      talent_status: string | null;
    }[]>`
      SELECT talent_status
      FROM goodhive.users
      WHERE userid = ${viewerUserId}::uuid
      LIMIT 1
    `,
    sql<{
      approved: boolean | null;
    }[]>`
      SELECT approved
      FROM goodhive.companies
      WHERE user_id = ${viewerUserId}::uuid
      LIMIT 1
    `,
  ]);

  const isApprovedTalent = userRows[0]?.talent_status === "approved";
  const hasApprovedCompany = companyRows[0]?.approved === true;

  return {
    canViewContact:
      companyApproved &&
      (isApprovedTalent || hasApprovedCompany || isCompanyOwner || isAdmin),
    hasApprovedCompany,
    isAdmin,
    isApprovedTalent,
    isAuthenticated: true,
    isCompanyOwner,
  };
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SidebarRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Globe;
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
    >
      <span className="truncate">{value}</span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-700" />
    </Link>
  ) : (
    <p className="text-sm font-medium text-slate-700">{value}</p>
  );

  return (
    <div className="flex items-start gap-3 rounded-[20px] bg-white/78 px-4 py-4 ring-1 ring-black/5">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f5ecd8] text-[#7a5a16]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          {label}
        </p>
        <div className="mt-1 min-w-0">{content}</div>
      </div>
    </div>
  );
}

export default async function CompanyProfilePage({
  params,
  searchParams,
}: CompanyProfilePageProps) {
  if (searchParams?.id) {
    redirect(`/jobs/${searchParams.id}`);
  }

  const company = await getCompanyProfile(params.userId);

  if (!company) {
    notFound();
  }

  const viewerState = await getViewerState(params.userId, company.approved);
  const jobs = await getCompanyJobs(
    params.userId,
    viewerState.isCompanyOwner || viewerState.isAdmin,
  );

  const companyName = company.designation?.trim() || "GoodHive Company";
  const headlineText = stripHtml(company.headline);
  const locationLabel = formatLocation(company.city, company.country);
  const phoneLabel = formatPhone(company.phone_country_code, company.phone_number);
  const countryFlag = company.country
    ? generateCountryFlag(company.country)
    : null;
  const featuredSkills = Array.from(
    new Set(jobs.flatMap((job) => job.skills).filter(Boolean)),
  ).slice(0, 8);

  const socialLinks: SocialLink[] = [
    company.portfolio
      ? {
          href: normalizeExternalUrl(company.portfolio) as string,
          icon: Globe,
          label: "Website",
        }
      : null,
    company.linkedin
      ? {
          href: normalizeExternalUrl(company.linkedin) as string,
          icon: Linkedin,
          label: "LinkedIn",
        }
      : null,
    company.twitter
      ? {
          href: normalizeExternalUrl(company.twitter) as string,
          icon: Twitter,
          label: "Twitter",
        }
      : null,
    company.github
      ? {
          href: normalizeExternalUrl(company.github) as string,
          icon: Globe,
          label: "GitHub",
        }
      : null,
    company.stackoverflow
      ? {
          href: normalizeExternalUrl(company.stackoverflow) as string,
          icon: Globe,
          label: "Stack Overflow",
        }
      : null,
    company.telegram
      ? {
          href: normalizeExternalUrl(
            company.telegram.startsWith("@")
              ? `https://t.me/${company.telegram.replace(/^@/, "")}`
              : company.telegram,
          ) as string,
          icon: Globe,
          label: "Telegram",
        }
      : null,
  ].filter(Boolean) as SocialLink[];

  const contactLockMessage = !company.approved
    ? "Direct contact stays hidden until this company profile is approved."
    : !viewerState.isAuthenticated
      ? "Sign in with an approved talent or company profile to unlock direct contact details."
      : "Direct contact unlocks after your talent or company profile is approved.";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f1ea] text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(248,196,56,0.20),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.85),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.55),_rgba(244,241,234,0))]" />
      <div className="pointer-events-none absolute inset-x-0 top-20 h-64 bg-[linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <section className={`${SURFACE_CLASS} overflow-hidden`}>
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:p-10">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f4ead0] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#7a5a16]">
                <Sparkles className="h-3.5 w-3.5" />
                Company Profile
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                    {companyName}
                  </h1>
                  {company.approved && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                      <BadgeCheck className="h-4 w-4" />
                      Approved on GoodHive
                    </span>
                  )}
                </div>

                <p className="max-w-3xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  {headlineText ||
                    "A modern company profile designed to spotlight how this team hires, where they are based, and what kind of opportunities they are opening inside the GoodHive network."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className={META_PILL_CLASS}>
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {locationLabel}
                </span>
                <span className={META_PILL_CLASS}>
                  <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                  {jobs.length} open {jobs.length === 1 ? "role" : "roles"}
                </span>
                <span className={META_PILL_CLASS}>
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  {viewerState.canViewContact ? "Direct contact unlocked" : "Direct contact protected"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="#open-roles"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Explore open roles
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#company-contact"
                  className="inline-flex items-center gap-2 rounded-full bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ring-1 ring-black/5 transition hover:text-slate-950"
                >
                  View company details
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#ffd978]/40 blur-3xl" />
              <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(249,247,242,0.88))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Studio Snapshot
                    </p>
                    <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                      Calm, credible, and built for trust.
                    </p>
                    <p className="max-w-sm text-[13px] leading-6 text-slate-600 sm:text-sm">
                      This profile keeps the company story public while protecting direct contact access until both trust and approval are in place.
                    </p>
                  </div>
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[28px] bg-[#f6ecd7] shadow-[0_18px_40px_rgba(122,90,22,0.14)]">
                    <Image
                      src={company.image_url || "/img/placeholder-image.png"}
                      alt={`${companyName} logo`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <StatCard
                    label="Open Roles"
                    value={`${jobs.length} live ${jobs.length === 1 ? "position" : "positions"}`}
                  />
                  <StatCard
                    label="Location"
                    value={company.city || company.country || "Distributed"}
                  />
                  <StatCard
                    label="Public Presence"
                    value={socialLinks.length > 0 ? `${socialLinks.length} links shared` : "Minimal footprint"}
                  />
                  <StatCard
                    label="Access"
                    value={viewerState.canViewContact ? "Unlocked for you" : "Protected"}
                  />
                </div>

                {countryFlag && company.country && (
                  <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.07)] ring-1 ring-black/5">
                    <span className="relative h-5 w-5 overflow-hidden rounded-full">
                      <Image
                        src={countryFlag}
                        alt={`${company.country} flag`}
                        fill
                        className="object-cover"
                      />
                    </span>
                    Based in {company.country}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className={`${SURFACE_CLASS} p-6 sm:p-8`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Overview
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  What this company is building
                </h2>
              </div>
              <div className="rounded-full bg-[#f7f2e5] px-4 py-2 text-sm font-medium text-[#7a5a16]">
                Modern profile surface
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div
                className="rich-text-content text-[15px] leading-8 text-slate-600"
                dangerouslySetInnerHTML={{
                  __html:
                    company.headline ||
                    "<p>This team has not added a long-form company story yet, but their active opportunities are already live below.</p>",
                }}
              />

              {featuredSkills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Hiring themes
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {featuredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#f8f6f0] px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
            <section className={`${SURFACE_CLASS} p-6 sm:p-7`}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Public Presence
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Company details
              </h2>

              <div className="mt-6 space-y-3">
                <SidebarRow
                  icon={MapPin}
                  label="Base"
                  value={locationLabel}
                />
                <SidebarRow
                  icon={BriefcaseBusiness}
                  label="Published roles"
                  value={`${jobs.length} live ${jobs.length === 1 ? "position" : "positions"}`}
                />
                {socialLinks.length > 0 ? (
                  socialLinks.map((link) => (
                    <SidebarRow
                      key={link.href}
                      icon={link.icon}
                      label={link.label}
                      value={formatUrlLabel(link.href)}
                      href={link.href}
                    />
                  ))
                ) : (
                  <div className="rounded-[20px] bg-white/78 px-4 py-5 text-sm leading-7 text-slate-500 ring-1 ring-black/5">
                    This company is keeping its public footprint minimal for now.
                  </div>
                )}
              </div>
            </section>

            <section id="company-contact" className={`${SURFACE_CLASS} p-6 sm:p-7`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Direct Contact
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    Reach the team
                  </h2>
                </div>
                <div className="rounded-full bg-[#f4ead0] p-3 text-[#7a5a16]">
                  {viewerState.canViewContact ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <LockKeyhole className="h-5 w-5" />
                  )}
                </div>
              </div>

              {viewerState.canViewContact ? (
                <div className="mt-6 space-y-3">
                  {company.email && (
                    <SidebarRow icon={Mail} label="Email" value={company.email} href={`mailto:${company.email}`} />
                  )}
                  {phoneLabel && (
                    <SidebarRow icon={Phone} label="Phone" value={phoneLabel} />
                  )}
                  {company.address && (
                    <SidebarRow icon={Building2} label="Address" value={company.address} />
                  )}
                  {!company.email && !phoneLabel && !company.address && (
                    <div className="rounded-[20px] bg-white/78 px-4 py-5 text-sm leading-7 text-slate-500 ring-1 ring-black/5">
                      This company has not shared direct contact details yet.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,246,240,0.95))] p-6 shadow-[0_16px_35px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4ead0] text-[#7a5a16]">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        Contact details are protected
                      </p>
                      <p className="text-sm text-slate-500">
                        GoodHive only reveals direct details inside trusted profile states.
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-600">
                    {contactLockMessage}
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>

        <CompanyOpportunitiesTabs
          companyName={companyName}
          jobs={jobs.map((job) => ({
            ...job,
            budgetLabel: formatBudget(job.budget, job.currency),
            descriptionPreview: (() => {
              const descriptionText = stripHtml(job.description).trim();
              if (!descriptionText) {
                return "A role with more details available on the job page.";
              }

              return `${descriptionText.slice(0, 180)}${
                descriptionText.length > 180 ? "..." : ""
              }`;
            })(),
            locationLabel: formatLocation(job.city, job.country),
            postedLabel: formatRelativeDate(job.posted_at),
            roleLabels: [
              job.talent ? "Talent" : null,
              job.mentor ? "Mentor" : null,
              job.recruiter ? "Recruiter" : null,
            ].filter(Boolean) as string[],
          }))}
          showInactiveTab={viewerState.isCompanyOwner || viewerState.isAdmin}
        />
      </div>
    </main>
  );
}
