"use client";

import Image from "next/image";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CircleOff,
  Clock3,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Twitter,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import { ActionHistory } from "@/app/components/admin/ActionHistory";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import {
  EditCompanyModal,
  type Company,
} from "@/app/components/admin/EditCompanyModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CompanyAdminViewProfileProps = {
  params: {
    user_id: string;
  };
};

type JobReviewStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "active"
  | "closed";

type CompanyJobSummary = {
  total: number;
  published: number;
  pendingReview: number;
  approved: number;
  active: number;
  rejected: number;
  closed: number;
  draft: number;
};

type CompanyRecentJob = {
  id: string;
  title: string;
  review_status: JobReviewStatus;
  published: boolean;
  created_at: string | null;
};

type CompanyAdminMeta = {
  profileCompleteness: number;
  linkCounts: number;
  jobSummary: CompanyJobSummary;
  recentJobs: CompanyRecentJob[];
};

type CompanyDetailResponse = {
  company: Company;
  adminMeta: CompanyAdminMeta;
};

type StatusTone = "success" | "warn" | "danger" | "neutral";

const shellCardClass =
  "overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur";
const sectionTitleClass = "text-lg font-semibold tracking-tight text-slate-950";
const sectionDescriptionClass = "text-sm text-slate-500";

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const titleCase = (value?: string | null) => {
  if (!value) return "N/A";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getCompanyInitials = (designation?: string | null) => {
  const parts = (designation || "Company")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "CO";
};

const getReviewNeeds = (company: Company, adminMeta: CompanyAdminMeta) => {
  const items: string[] = [];

  if (!company.image_url) items.push("Missing logo");
  if (!company.email) items.push("Missing email");
  if (!company.phone_number) items.push("Missing phone number");
  if (adminMeta.linkCounts === 0) items.push("No external links added");
  if (!company.approved) items.push("Profile not approved");
  if (company.inreview) items.push("Profile still in review");
  if (!company.published) items.push("Profile not published");
  if (adminMeta.jobSummary.total === 0) items.push("No jobs created");

  return items;
};

const getJobStatusTone = (status: JobReviewStatus): StatusTone => {
  switch (status) {
    case "active":
    case "approved":
      return "success";
    case "pending_review":
      return "warn";
    case "rejected":
      return "danger";
    case "draft":
    case "closed":
    default:
      return "neutral";
  }
};

const toneClasses: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
};

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

function StatusBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: StatusTone;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <Badge
        variant="outline"
        className={`mt-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
      >
        {value}
      </Badge>
    </div>
  );
}

export default function CompaniesPage({
  params,
}: CompanyAdminViewProfileProps) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [adminMeta, setAdminMeta] = useState<CompanyAdminMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user_id } = params;

  const breadcrumbLabels = company
    ? { [user_id]: company.designation || "Company Detail" }
    : undefined;

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/companies/${user_id}`);
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch company data");
      }

      const data = (await response.json()) as CompanyDetailResponse;
      setCompany(data.company);
      setAdminMeta(data.adminMeta);
    } catch (fetchError) {
      console.error("Error fetching company data:", fetchError);
      setError(
        fetchError instanceof Error ? fetchError.message : "An error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, user_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (updatedCompany: Company) => {
    try {
      const response = await fetch(`/api/admin/companies/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCompany),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update company");
      }

      toast.success("Company updated successfully");
      await fetchData();
    } catch (saveError) {
      console.error("Error updating company:", saveError);
      toast.error("Failed to update company");
      throw saveError;
    }
  };

  const needsAttention = useMemo(() => {
    if (!company || !adminMeta) return [];
    return getReviewNeeds(company, adminMeta);
  }, [company, adminMeta]);

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Company Details"
        subtitle="Manage company profile"
        breadcrumbLabels={breadcrumbLabels}
      >
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#FFC905]" />
        </div>
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout
        title="Company Details"
        subtitle="Manage company profile"
        breadcrumbLabels={breadcrumbLabels}
      >
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Error: {error}
        </div>
      </AdminPageLayout>
    );
  }

  if (!company || !adminMeta) {
    return (
      <AdminPageLayout
        title="Company Details"
        subtitle="Manage company profile"
        breadcrumbLabels={breadcrumbLabels}
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          No company data found
        </div>
      </AdminPageLayout>
    );
  }

  const location =
    [company.city, company.country].filter(Boolean).join(", ") ||
    "Location not provided";
  const phone =
    `${company.phone_country_code ?? ""} ${company.phone_number ?? ""}`.trim() ||
    "Phone not provided";

  const linkItems = [
    company.linkedin
      ? { label: "LinkedIn", href: company.linkedin, icon: Linkedin }
      : null,
    company.github ? { label: "GitHub", href: company.github, icon: Github } : null,
    company.twitter ? { label: "Twitter", href: company.twitter, icon: Twitter } : null,
    company.stackoverflow
      ? { label: "Stack Overflow", href: company.stackoverflow, icon: ExternalLink }
      : null,
    company.portfolio
      ? { label: "Portfolio", href: company.portfolio, icon: Globe }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    icon: typeof Linkedin;
  }>;

  return (
    <AdminPageLayout
      title={company.designation || "Company Details"}
      subtitle="Company control center"
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
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/80 bg-slate-200 text-2xl font-bold text-slate-600 shadow-sm sm:h-28 sm:w-28">
                      {company.image_url ? (
                        <Image
                          src={company.image_url}
                          alt={company.designation || "Company logo"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        getCompanyInitials(company.designation)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900">
                          Admin View
                        </Badge>
                        {company.approved ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                          >
                            Approved company
                          </Badge>
                        ) : null}
                      </div>

                      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.35rem]">
                        {company.designation || "Unnamed company"}
                      </h1>
                      <p className="mt-2 text-base text-slate-600 sm:text-lg">
                        {company.headline || "No company headline added yet"}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            company.published
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white/80 text-slate-700"
                          }`}
                        >
                          {company.published ? "Published profile" : "Unpublished profile"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            company.inreview
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-white/80 text-slate-700"
                          }`}
                        >
                          {company.inreview ? "In review" : "Not in review"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          {titleCase(company.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <SummaryMetric
                      label="Completeness"
                      value={`${adminMeta.profileCompleteness}%`}
                    />
                    <SummaryMetric
                      label="Total Jobs"
                      value={String(adminMeta.jobSummary.total)}
                    />
                    <SummaryMetric
                      label="Live Jobs"
                      value={String(adminMeta.jobSummary.published)}
                    />
                    <SummaryMetric
                      label="Pending Review"
                      value={String(adminMeta.jobSummary.pendingReview)}
                    />
                    <SummaryMetric
                      label="Proof Links"
                      value={String(adminMeta.linkCounts)}
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Company oversight snapshot
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Quick status context before taking action.
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <StatusBadge
                      label="Approval"
                      value={company.approved ? "Approved" : "Pending"}
                      tone={company.approved ? "success" : "warn"}
                    />
                    <StatusBadge
                      label="Publish state"
                      value={company.published ? "Published" : "Unpublished"}
                      tone={company.published ? "success" : "neutral"}
                    />
                    <StatusBadge
                      label="Review"
                      value={company.inreview ? "In review" : "Idle"}
                      tone={company.inreview ? "warn" : "neutral"}
                    />
                    <StatusBadge
                      label="Wallet"
                      value={company.wallet_address ? "Connected" : "Missing"}
                      tone={company.wallet_address ? "success" : "danger"}
                    />
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Needs attention
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                          {needsAttention.length}
                        </p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Missing fields, review state, and job activity are surfaced
                      here to speed up admin decisions.
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
              title="Company overview"
              description="Identity, business summary, and operational posture in one place."
              icon={Building2}
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 lg:col-span-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Headline
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    {company.headline || "No long-form headline or summary has been added yet."}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Control center signals
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <span>Status</span>
                      <span className="font-medium">{titleCase(company.status)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Approved</span>
                      <span className="font-medium">
                        {company.approved ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Published</span>
                      <span className="font-medium">
                        {company.published ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Review mode</span>
                      <span className="font-medium">
                        {company.inreview ? "Open" : "Closed"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Contact and location"
              description="Direct contact channels and operational footprint."
              icon={MapPin}
            >
              <div className="grid gap-3 lg:grid-cols-2">
                <DetailItem icon={MapPin} label="Location" value={location} />
                <DetailItem
                  icon={Phone}
                  label="Phone"
                  value={phone}
                  href={company.phone_number ? `tel:${phone}` : undefined}
                  muted={!company.phone_number}
                />
                <DetailItem
                  icon={Mail}
                  label="Email"
                  value={company.email || "Email not provided"}
                  href={company.email ? `mailto:${company.email}` : undefined}
                  muted={!company.email}
                />
                <DetailItem
                  icon={Wallet}
                  label="Wallet"
                  value={company.wallet_address || "Wallet not connected"}
                  muted={!company.wallet_address}
                />
              </div>

              {company.address ? (
                <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Address
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800 break-words">
                    {company.address}
                  </p>
                </div>
              ) : null}

              {company.telegram ? (
                <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Telegram
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    @{company.telegram}
                  </p>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Links and brand presence"
              description="External proof points and company web presence."
              icon={ExternalLink}
            >
              {linkItems.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {linkItems.map(({ label, href, icon: Icon }) => (
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
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                  This company has not added any external brand or proof links yet.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Job activity snapshot"
              description="Operational job context for this company, derived from its job offers."
              icon={Rocket}
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryMetric label="Draft" value={String(adminMeta.jobSummary.draft)} />
                <SummaryMetric
                  label="Pending Review"
                  value={String(adminMeta.jobSummary.pendingReview)}
                />
                <SummaryMetric
                  label="Approved"
                  value={String(adminMeta.jobSummary.approved)}
                />
                <SummaryMetric
                  label="Active / Closed"
                  value={`${adminMeta.jobSummary.active} / ${adminMeta.jobSummary.closed}`}
                />
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Recent jobs
                </h3>
                {adminMeta.recentJobs.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {adminMeta.recentJobs.map((job) => {
                      const tone = getJobStatusTone(job.review_status);
                      return (
                        <div
                          key={job.id}
                          className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {job.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Created {formatDate(job.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
                            >
                              {job.review_status === "pending_review"
                                ? "Pending Review"
                                : titleCase(job.review_status)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                job.published
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-white text-slate-700"
                              }`}
                            >
                              {job.published ? "Published" : "Unpublished"}
                            </Badge>
                            <Button asChild variant="outline" size="sm" className="rounded-full">
                              <a href={`/admin/job/${job.id}`}>
                                Open job
                                <ArrowUpRight className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                    No jobs have been created by this company yet.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent admin activity"
              description="Audit trail and review actions linked to this company."
              icon={Clock3}
            >
              <ActionHistory targetType="company" targetId={user_id} />
            </SectionCard>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <SectionCard
              title="Admin actions"
              description="High-value review actions and direct company shortcuts."
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Button
                    onClick={() => setShowEditModal(true)}
                    className="h-11 justify-between rounded-2xl bg-slate-950 px-4 text-white hover:bg-slate-800"
                  >
                    Edit Company
                    <Pencil className="h-4 w-4" />
                  </Button>

                  {company.email ? (
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 justify-between rounded-2xl border-slate-200 px-4"
                    >
                      <a href={`mailto:${company.email}`}>
                        Email Company
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}

                  {company.portfolio ? (
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 justify-between rounded-2xl border-slate-200 px-4"
                    >
                      <a href={company.portfolio} target="_blank" rel="noopener noreferrer">
                        Open Portfolio
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : company.linkedin ? (
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 justify-between rounded-2xl border-slate-200 px-4"
                    >
                      <a href={company.linkedin} target="_blank" rel="noopener noreferrer">
                        Open LinkedIn
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-dashed border-amber-200 bg-amber-50/60 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    Suggested checks
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-amber-900/80">
                    <li>Confirm whether the profile should remain published.</li>
                    <li>Check if job creation activity matches company status.</li>
                    <li>Review missing fields before final approval decisions.</li>
                  </ul>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Needs attention"
              description="Admin-only flags surfaced from profile completeness and operational state."
              icon={AlertTriangle}
            >
              {needsAttention.length > 0 ? (
                <div className="space-y-3">
                  {needsAttention.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
                  This company profile looks operationally healthy from the data
                  currently available.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Company state"
              description="Compact oversight for approval, publish, and job posture."
              icon={BadgeCheck}
            >
              <div className="space-y-3">
                <DetailItem
                  icon={BadgeCheck}
                  label="Approval"
                  value={company.approved ? "Approved" : "Pending approval"}
                />
                <DetailItem
                  icon={Rocket}
                  label="Publish state"
                  value={company.published ? "Published on platform" : "Not published"}
                />
                <DetailItem
                  icon={CircleOff}
                  label="Review state"
                  value={company.inreview ? "Currently in review" : "Not in review"}
                />
                <DetailItem
                  icon={FileText}
                  label="Job count"
                  value={`${adminMeta.jobSummary.total} total jobs`}
                />
              </div>
            </SectionCard>
          </div>
        </div>

        <EditCompanyModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          company={company}
          onSave={handleSave}
        />
      </div>
    </AdminPageLayout>
  );
}
