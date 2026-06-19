import {
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Twitter,
  UserRoundCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import { ReactNode } from "react";

import { ProfileData } from "@/app/talents/my-profile/types";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import SafeHTML from "@/app/components/SafeHTML";
import { ResumeStructuredSections } from "@/app/components/talents/ResumeStructuredSections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProfileData } from "@/lib/fetch-profile-data";
import { formatRateRange } from "@/app/utils/format-rate-range";

import "@/app/styles/rich-text.css";

import CvAdminManager from "./CvAdminManager";

export const metadata: Metadata = {
  title: "Admin Talent Management - GoodHive",
  description:
    "Admin interface for managing talent profiles, reviewing applications, and monitoring talent status in the GoodHive Web3 recruitment platform.",
  keywords:
    "admin talent management, talent profile review, Web3 talent admin, blockchain developer management, talent approval process",
};

type MyProfilePageProps = {
  params: {
    user_id: string;
  };
};

type StatTone = "success" | "warn" | "danger" | "neutral";

const shellCardClass =
  "overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur";
const sectionTitleClass = "text-lg font-semibold tracking-tight text-slate-950";
const sectionDescriptionClass = "text-sm text-slate-500";

export const revalidate = 0;

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const titleCase = (value?: string | null) => {
  if (!value) return "N/A";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getInitials = (user: ProfileData) => {
  const first = user.first_name?.[0] ?? "G";
  const last = user.last_name?.[0] ?? "H";
  return `${first}${last}`;
};

const getFullName = (user: ProfileData) =>
  `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

const splitSkills = (skills?: string) =>
  (skills ?? "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

const getStatusTone = (value?: string | boolean | null): StatTone => {
  if (typeof value === "boolean") {
    return value ? "success" : "danger";
  }

  switch ((value ?? "").toString().toLowerCase()) {
    case "approved":
    case "available":
    case "active":
      return "success";
    case "deferred":
    case "pending":
    case "inreview":
      return "warn";
    case "rejected":
    case "inactive":
    case "unavailable":
      return "danger";
    default:
      return "neutral";
  }
};

const toneClasses: Record<StatTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
};

function StatusBadge({
  label,
  value,
}: {
  label: string;
  value?: string | boolean | null;
}) {
  const tone = getStatusTone(value);
  const displayValue =
    typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : titleCase(value);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <Badge
        variant="outline"
        className={`mt-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
      >
        {displayValue}
      </Badge>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  href,
  muted,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
  muted?: boolean;
}) {
  const content = href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="transition hover:text-slate-950 hover:underline"
    >
      {value}
    </a>
  ) : (
    value
  );

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <div
          className={`mt-1 break-words text-sm font-medium ${
            muted ? "text-slate-500" : "text-slate-800"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof Sparkles;
  children: ReactNode;
}) {
  return (
    <Card className={shellCardClass}>
      <CardContent className="p-0">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className={sectionTitleClass}>{title}</h2>
              {description ? (
                <p className={`mt-1 ${sectionDescriptionClass}`}>{description}</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="px-6 py-6 sm:px-7">{children}</div>
      </CardContent>
    </Card>
  );
}

export default async function Page(context: MyProfilePageProps) {
  const { user_id } = context.params;
  const user = (await getProfileData(user_id)) as ProfileData;

  const fullName = getFullName(user);
  const breadcrumbLabels = {
    [user_id]: fullName,
  };

  const isApprovedTalent =
    user.talent_status === "approved" || user.approved === true;
  const skills = splitSkills(user.skills);
  const location = [user.city, user.country].filter(Boolean).join(", ") || "Location not provided";
  const phoneNumber =
    `${user.phone_country_code ?? ""}${user.phone_number ?? ""}`.trim() ||
    "Phone not provided";
  const rateRange = formatRateRange({
    minRate: user.min_rate ?? user.rate,
    maxRate: user.max_rate ?? user.rate,
    currency: "$",
    suffix: "/hr",
  });

  const structuredSectionCount = [
    user.experience?.length,
    user.education?.length,
    user.certifications?.length,
    user.projects?.length,
    user.languages?.length,
  ].filter((count) => Number(count) > 0).length;

  const profileSignals = [
    Boolean(user.image_url),
    Boolean(user.description),
    Boolean(user.about_work),
    skills.length > 0,
    Boolean(user.cv_url),
    structuredSectionCount > 0,
    Boolean(user.linkedin || user.github || user.website || user.portfolio),
    Boolean(user.rate || user.min_rate || user.max_rate),
  ];

  const completenessScore = Math.round(
    (profileSignals.filter(Boolean).length / profileSignals.length) * 100,
  );

  const publicLinks = [
    user.linkedin
      ? { label: "LinkedIn", href: user.linkedin, icon: Linkedin }
      : null,
    user.github ? { label: "GitHub", href: user.github, icon: Github } : null,
    user.twitter ? { label: "Twitter", href: user.twitter, icon: Twitter } : null,
    user.website ? { label: "Website", href: user.website, icon: Globe } : null,
    user.portfolio
      ? { label: "Portfolio", href: user.portfolio, icon: ArrowUpRight }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    icon: typeof Linkedin;
  }>;

  return (
    <AdminPageLayout
      title={fullName}
      subtitle="Talent profile review and admin controls"
      breadcrumbLabels={breadcrumbLabels}
    >
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-[32px] border-none bg-transparent shadow-none">
          <CardContent className="relative overflow-hidden rounded-[32px] border border-amber-100/70 bg-[radial-gradient(circle_at_top_left,_rgba(255,237,180,0.95),_rgba(255,255,255,0.98)_38%,_rgba(248,250,252,1)_100%)] p-0 shadow-[0_30px_80px_rgba(245,158,11,0.14)]">
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.22),_transparent_58%)] lg:block" />
            <div className="pointer-events-none absolute -right-10 top-10 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="pointer-events-none absolute left-0 top-0 h-28 w-28 rounded-full bg-white/50 blur-2xl" />

            <div className="relative px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)] lg:items-start">
                <div className="space-y-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/80 bg-slate-200 text-3xl font-bold text-slate-600 shadow-sm sm:h-28 sm:w-28">
                      {user.image_url ? (
                        <Image
                          src={user.image_url}
                          alt={fullName}
                          className="h-full w-full object-cover"
                          height={112}
                          width={112}
                        />
                      ) : (
                        getInitials(user)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900">
                          Admin View
                        </Badge>
                        {user.hide_contact_details ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                          >
                            Contact Hidden Publicly
                          </Badge>
                        ) : null}
                      </div>

                      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.35rem]">
                        {fullName}
                      </h1>
                      <p className="mt-2 text-base text-slate-600 sm:text-lg">
                        {user.title || "Professional title not added yet"}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            user.availability
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {user.availability ? "Available for work" : "Not available"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          {user.remote_only ? "Remote only" : "Remote or on-site"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          {user.freelance_only
                            ? "Freelance only"
                            : "Open to broader opportunities"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryMetric label="Talent Status" value={titleCase(user.talent_status)} />
                    <SummaryMetric
                      label="Experience"
                      value={
                        user.years_experience
                          ? `${user.years_experience}+ years`
                          : "Not specified"
                      }
                    />
                    <SummaryMetric label="Rate Range" value={rateRange || "Not specified"} />
                    <SummaryMetric
                      label="Resume Coverage"
                      value={`${structuredSectionCount} section${
                        structuredSectionCount === 1 ? "" : "s"
                      }`}
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Admin snapshot
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Quick context before taking action.
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <StatusBadge label="Talent" value={user.talent_status} />
                    <StatusBadge label="Mentor" value={user.mentor_status} />
                    <StatusBadge label="Recruiter" value={user.recruiter_status} />
                    <StatusBadge label="CV on file" value={Boolean(user.cv_url)} />
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Profile completeness
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                          {completenessScore}%
                        </p>
                      </div>
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="mt-4 h-2.5 rounded-full bg-slate-200">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                        style={{ width: `${completenessScore}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Stronger profiles usually include CV, structured resume
                      entries, work story, rate, and external proof points.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="space-y-6">
            <SectionCard
              title="About the talent"
              description="Professional summary and work story shown together for easier review."
              icon={UserRoundCheck}
            >
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Summary
                  </h3>
                  <SafeHTML
                    html={user.description || "<p>No summary added yet.</p>"}
                    className="mt-4 text-sm leading-7 text-slate-700 rich-text-content"
                  />
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                    About work
                  </h3>
                  <SafeHTML
                    html={user.about_work || "<p>No work story added yet.</p>"}
                    className="mt-4 text-sm leading-7 text-slate-700 rich-text-content"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Skills and expertise"
              description="Core skills, proof points, and opportunity fit signals."
              icon={BadgeCheck}
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Skill tags
                    </h3>
                    <span className="text-sm text-slate-500">
                      {skills.length} listed
                    </span>
                  </div>
                  {skills.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-slate-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      No skill tags were added to this profile yet.
                    </p>
                  )}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Opportunity fit
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <span>Work mode</span>
                      <span className="font-medium">
                        {user.remote_only ? "Remote only" : "Flexible"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Engagement</span>
                      <span className="font-medium">
                        {user.freelance_only ? "Freelance" : "All"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Availability</span>
                      <span className="font-medium">
                        {user.availability ? "Open now" : "Unavailable"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Rate</span>
                      <span className="font-medium">{rateRange || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Structured resume"
              description="Experience, education, projects, certifications, and languages imported or entered on the profile."
              icon={GraduationCap}
            >
              <ResumeStructuredSections
                experience={user.experience}
                education={user.education}
                certifications={user.certifications}
                projects={user.projects}
                languages={user.languages}
                emptyMessage="No structured experience, education, project, certification, or language details were added to this profile yet."
              />
            </SectionCard>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <SectionCard
              title="Admin actions"
              description="High-value review actions and CV controls grouped in one place."
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {user.cv_url ? (
                    <Button
                      asChild
                      className="h-11 justify-between rounded-2xl bg-slate-950 px-4 text-white hover:bg-slate-800"
                    >
                      <a href={user.cv_url} target="_blank" rel="noopener noreferrer">
                        Open current CV
                        <FileText className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}

                  {user.email ? (
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 justify-between rounded-2xl border-slate-200 px-4"
                    >
                      <a href={`mailto:${user.email}`}>
                        Email talent
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}

                  {user.linkedin ? (
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 justify-between rounded-2xl border-slate-200 px-4"
                    >
                      <a href={user.linkedin} target="_blank" rel="noopener noreferrer">
                        Open LinkedIn
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-dashed border-amber-200 bg-amber-50/60 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    Suggested next checks
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-amber-900/80">
                    <li>Check whether the CV matches the structured resume.</li>
                    <li>Confirm the listed rate and availability are current.</li>
                    <li>Review external links for proof of recent work.</li>
                  </ul>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <CvAdminManager
                    userId={user_id}
                    initialCvUrl={user.cv_url}
                    isApproved={isApprovedTalent}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Contact and profile signals"
              description="Direct channels, status details, and admin-side context."
              icon={MapPin}
            >
              <div className="space-y-3">
                <DetailItem icon={MapPin} label="Location" value={location} />
                <DetailItem
                  icon={Phone}
                  label="Phone"
                  value={phoneNumber}
                  href={user.phone_number ? `tel:${phoneNumber}` : undefined}
                  muted={!user.phone_number}
                />
                <DetailItem
                  icon={Mail}
                  label="Email"
                  value={user.email || "Email not provided"}
                  href={user.email ? `mailto:${user.email}` : undefined}
                  muted={!user.email}
                />
                <DetailItem
                  icon={Calendar}
                  label="Last active"
                  value={formatDate(user.last_active)}
                  muted={!user.last_active}
                />
              </div>

              {user.telegram ? (
                <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Telegram
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    @{user.telegram}
                  </p>
                </div>
              ) : null}

              {publicLinks.length > 0 ? (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    External links
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {publicLinks.map(({ label, href, icon: Icon }) => (
                      <a
                        key={`${label}-${href}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                  No external proof links were added to this profile yet.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Review metadata"
              description="Approval context and supporting admin-only fields."
              icon={CheckCircle}
            >
              <div className="space-y-3">
                <DetailItem
                  icon={CheckCircle}
                  label="Availability"
                  value={user.availability ? "Available" : "Unavailable"}
                />
                <DetailItem
                  icon={Briefcase}
                  label="Work preference"
                  value={
                    user.freelance_only
                      ? "Freelance only"
                      : "Open to multiple opportunity types"
                  }
                />
                <DetailItem
                  icon={Globe}
                  label="Location preference"
                  value={user.remote_only ? "Remote only" : "Open to on-site work"}
                />
                <DetailItem
                  icon={DollarSign}
                  label="Rate"
                  value={rateRange || "Rate not provided"}
                  muted={!rateRange}
                />
                {user.wallet_address ? (
                  <DetailItem
                    icon={Wallet}
                    label="Wallet"
                    value={user.wallet_address}
                  />
                ) : null}
              </div>

              {user.referrer ? (
                <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Referrer
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {user.referrer}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    {user.availability ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    )}
                    <p className="text-sm font-medium">
                      {user.availability
                        ? "Ready for outreach"
                        : "May need availability recheck"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Use this alongside CV freshness and last-active date for
                    approval decisions.
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium">What this page now surfaces</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Resume coverage, completeness, proof links, status context,
                    and admin actions are now easier to scan in one pass.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
