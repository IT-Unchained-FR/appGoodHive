import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe,
  Linkedin,
  Lock,
  MapPin,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  Twitter,
  Users2,
} from "lucide-react";
import jwt from "jsonwebtoken";

import { CompanyInfoGuard } from "@/app/components/CompanyInfoGuard";
import SafeHTML from "@/app/components/SafeHTML";
import { JobPageAnalytics } from "@/app/components/job-page/JobPageAnalytics";
import { RelatedJobsSection } from "@/app/components/job-page/RelatedJobsSection";
import { YourMatchScoreCard } from "@/app/components/job-page/YourMatchScoreCard";
import JobActionPanel from "@/app/jobs/[jobId]/JobActionPanel";
import {
  jobTypes,
  projectDuration,
  projectTypes,
  typeEngagements,
} from "@/app/constants/common";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import { normalizeJobDescriptionForDisplay } from "@/lib/jobs/format-job-content";
import { JobReviewStatus, resolveJobReviewStatus } from "@/lib/jobs/review";

interface JobPageData {
  adminFeedback: string | null;
  applicationCount: number;
  company: {
    approved: boolean;
    city: string | null;
    country: string | null;
    email: string | null;
    headline: string | null;
    id: string;
    linkedin: string | null;
    logo: string | null;
    name: string;
    twitter: string | null;
    walletAddress: string | null;
    website: string | null;
  };
  country: string | null;
  currency: string | null;
  description: string | null;
  duration: string | null;
  id: string;
  jobType: string | null;
  postedAt: string | null;
  projectType: string | null;
  published: boolean;
  reviewStatus: JobReviewStatus;
  sections: Array<{
    content: string;
    heading: string;
    id: string;
    sortOrder: number;
  }>;
  skills: string[];
  title: string;
  typeEngagement: string | null;
  userId: string;
  budget: number;
  city: string | null;
  mentor: boolean;
  recruiter: boolean;
  relatedJobs: Array<{
    budget: number;
    city: string | null;
    country: string | null;
    currency: string | null;
    id: string;
    postedAt: string | null;
    projectType: string | null;
    title: string;
  }>;
  talent: boolean;
}

interface ViewerState {
  canViewJobDetails: boolean;
  canEditJob: boolean;
  canMessageCompany: boolean;
  canPreviewUnpublished: boolean;
  hasApplied: boolean;
  hasApprovedCompany: boolean;
  hasApprovedTalent: boolean;
  isAdmin: boolean;
  isApprovedTalent: boolean;
  isAuthenticated: boolean;
  isCompanyOwner: boolean;
  userId: string | null;
}

function stripHtml(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatRelativeDate(value: string | null) {
  if (!value) {
    return "Recently posted";
  }

  const now = new Date();
  const posted = new Date(value);
  const diffMs = now.getTime() - posted.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return "Posted today";
  if (diffDays === 1) return "Posted yesterday";
  if (diffDays < 7) return `Posted ${diffDays} days ago`;
  if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
  return `Posted ${Math.floor(diffDays / 30)} months ago`;
}

function getLabel(
  options: Array<{ label: string; value: string }>,
  value: string | null,
  fallback: string,
) {
  if (!value) {
    return fallback;
  }

  return options.find((option) => option.value === value)?.label || fallback;
}

function normalizeCurrencyCode(currency: string | null) {
  const normalizedCurrency = currency?.trim().toUpperCase() || "USD";

  if (normalizedCurrency.startsWith("0X")) {
    return "USDC";
  }

  return normalizedCurrency;
}

function formatBudget(amount: number, currency: string | null) {
  const numericAmount = Number.isFinite(amount) ? amount : 0;
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const fiatCurrencies = new Set([
    "AUD",
    "CAD",
    "CHF",
    "CNY",
    "EUR",
    "GBP",
    "JPY",
    "USD",
  ]);

  if (normalizedCurrency === "USDC") {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(numericAmount)} USDC`;
  }

  if (fiatCurrencies.has(normalizedCurrency)) {
    return new Intl.NumberFormat("en-US", {
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      style: "currency",
    }).format(numericAmount);
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(numericAmount)} ${normalizedCurrency}`;
}

function getAudienceLabel(job: Pick<JobPageData, "talent" | "mentor" | "recruiter">) {
  const audiences: string[] = [];

  if (job.talent) audiences.push("Talents");
  if (job.mentor) audiences.push("Mentors");
  if (job.recruiter) audiences.push("Recruiters");

  if (audiences.length === 0) {
    return "Open to all candidates";
  }

  if (audiences.length === 1) {
    return `Open to ${audiences[0]}`;
  }

  if (audiences.length === 2) {
    return `Open to ${audiences[0]} & ${audiences[1]}`;
  }

  return `Open to ${audiences.slice(0, -1).join(", ")} & ${audiences[audiences.length - 1]}`;
}

function getJobPreviewText(job: Pick<JobPageData, "description" | "sections">) {
  const source =
    job.sections
      .map((section) => section.content)
      .find((content) => content.trim().length > 0) ||
    stripHtml(job.description);

  if (!source) {
    return "Explore the role, scope, and expectations for this opportunity on GoodHive.";
  }

  return source.length > 220 ? `${source.slice(0, 217).trimEnd()}...` : source;
}

function getOverviewCards(job: Pick<JobPageData, "projectType" | "jobType" | "typeEngagement" | "duration">) {
  return [
    {
      icon: Tag,
      label: "Project Type",
      value: getLabel(projectTypes, job.projectType, "Project"),
    },
    {
      icon: MapPin,
      label: "Work Style",
      value: getLabel(jobTypes, job.jobType, "Role"),
    },
    {
      icon: Users,
      label: "Engagement",
      value: getLabel(typeEngagements, job.typeEngagement, "Flexible"),
    },
    {
      icon: CalendarDays,
      label: "Timeline",
      value: getLabel(projectDuration, job.duration, "Flexible duration"),
    },
  ];
}

function MatchScoreLockedCard({
  jobId,
  viewer,
}: {
  jobId: string;
  viewer: ViewerState;
}) {
  let title = "Unlock your AI match analysis";
  let description =
    "Sign in with an approved talent profile to see why your background matches this role, along with strengths and skill gaps.";
  let ctaHref = `/jobs/${jobId}?connectWallet=true`;
  let ctaLabel = "Connect to unlock";

  if (viewer.isAuthenticated && !viewer.isApprovedTalent) {
    title = "AI match is available after talent approval";
    description =
      "This score is personalized for approved talent profiles. Once your profile is approved, GoodHive can explain your fit, strengths, and gaps for this role.";
    ctaHref = "/talents/my-profile";
    ctaLabel = "Complete your talent profile";
  } else if (viewer.hasApprovedCompany || viewer.isCompanyOwner) {
    title = "AI match is built for talent profiles";
    description =
      "This section compares a talent profile against the role requirements. Company viewers can review job details here, while match analysis appears for approved talents.";
    ctaHref = "/companies/search-talents";
    ctaLabel = "Search talents";
  } else if (viewer.isAdmin) {
    title = "AI match is shown for approved talent accounts";
    description =
      "The match panel is personalized and becomes visible when the viewer is an approved talent account for this role.";
    ctaHref = `/jobs/${jobId}`;
    ctaLabel = "Refresh page";
  }

  return (
    <section className="rounded-[30px] border border-[#e6e0d5] bg-white/95 p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI Match Analysis
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
          <Lock className="h-4 w-4" />
          Locked
        </span>
      </div>

      <div className="mt-5 rounded-[26px] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f4ea_100%)] p-5 ring-1 ring-[#eee2cb]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">
                Personalized insight
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                {description}
              </p>
            </div>
          </div>

          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

async function getJob(jobId: string): Promise<JobPageData | null> {
  try {
    const jobRows = await sql<{
      admin_feedback: string | null;
      budget: number | string | null;
      city: string | null;
      company_approved: boolean | null;
      company_city: string | null;
      company_country: string | null;
      company_email: string | null;
      company_headline: string | null;
      company_logo: string | null;
      company_name: string | null;
      company_website: string | null;
      country: string | null;
      currency: string | null;
      description: string | null;
      duration: string | null;
      id: string;
      job_type: string | null;
      linkedin: string | null;
      mentor: boolean | string | null;
      posted_at: string | null;
      project_type: string | null;
      published: boolean | null;
      recruiter: boolean | string | null;
      review_status: string | null;
      skills: string | null;
      talent: boolean | string | null;
      title: string | null;
      twitter: string | null;
      type_engagement: string | null;
      user_id: string;
      wallet_address: string | null;
    }[]>`
      SELECT
        jo.id,
        jo.user_id,
        jo.title,
        jo.description,
        jo.budget,
        jo.currency,
        jo.project_type,
        jo.job_type,
        jo.type_engagement,
        jo.duration,
        jo.skills,
        jo.city,
        jo.country,
        jo.posted_at,
        jo.published,
        jo.review_status,
        jo.admin_feedback,
        jo.talent,
        jo.mentor,
        jo.recruiter,
        c.designation AS company_name,
        c.image_url AS company_logo,
        c.headline AS company_headline,
        c.city AS company_city,
        c.country AS company_country,
        c.email AS company_email,
        c.linkedin,
        c.twitter,
        c.portfolio AS company_website,
        c.wallet_address,
        c.approved AS company_approved
      FROM goodhive.job_offers jo
      LEFT JOIN goodhive.companies c ON c.user_id = jo.user_id
      WHERE jo.id = ${jobId}::uuid
      LIMIT 1
    `;

    const jobData = jobRows[0];
    if (!jobData) {
      return null;
    }

    const [sectionsRows, relatedJobsRows, applicationCountRows] = await Promise.all([
      sql<{
        content: string;
        heading: string;
        id: string;
        sort_order: number;
      }[]>`
        SELECT id, heading, content, sort_order
        FROM goodhive.job_sections
        WHERE job_id = ${jobId}::uuid
        ORDER BY sort_order ASC
      `,
      sql<{
        budget: number | string | null;
        city: string | null;
        country: string | null;
        currency: string | null;
        id: string;
        posted_at: string | null;
        project_type: string | null;
        title: string | null;
      }[]>`
        SELECT id, title, budget, currency, project_type, city, country, posted_at
        FROM goodhive.job_offers
        WHERE user_id = ${jobData.user_id}::uuid
          AND id <> ${jobId}::uuid
          AND published = true
        ORDER BY posted_at DESC
        LIMIT 3
      `,
      sql<{
        application_count: number | string | null;
      }[]>`
        SELECT COUNT(*)::int AS application_count
        FROM goodhive.job_applications
        WHERE job_id = ${jobId}::uuid
      `,
    ]);

    return {
      adminFeedback: jobData.admin_feedback ?? null,
      applicationCount: Number(applicationCountRows[0]?.application_count || 0),
      budget: Number(jobData.budget || 0),
      city: jobData.city,
      company: {
        approved: jobData.company_approved === true,
        city: jobData.company_city,
        country: jobData.company_country,
        email: jobData.company_email,
        headline: stripHtml(jobData.company_headline),
        id: jobData.user_id,
        linkedin: jobData.linkedin,
        logo: jobData.company_logo,
        name: jobData.company_name?.trim() || "GoodHive Company",
        twitter: jobData.twitter,
        walletAddress: jobData.wallet_address,
        website: jobData.company_website,
      },
      country: jobData.country,
      currency: jobData.currency,
      description: jobData.description,
      duration: jobData.duration,
      id: jobData.id,
      jobType: jobData.job_type,
      mentor: jobData.mentor === true || jobData.mentor === "true",
      postedAt: jobData.posted_at,
      projectType: jobData.project_type,
      published: jobData.published === true,
      recruiter: jobData.recruiter === true || jobData.recruiter === "true",
      relatedJobs: relatedJobsRows.map((row) => ({
        budget: Number(row.budget || 0),
        city: row.city,
        country: row.country,
        currency: row.currency,
        id: row.id,
        postedAt: row.posted_at,
        projectType: row.project_type,
        title: row.title?.trim() || "Untitled job",
      })),
      reviewStatus: resolveJobReviewStatus(jobData.review_status, jobData.published),
      sections: sectionsRows.map((section) => ({
        content: section.content,
        heading: section.heading,
        id: section.id,
        sortOrder: section.sort_order,
      })),
      skills: jobData.skills
        ? jobData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [],
      talent: jobData.talent === true || jobData.talent === "true",
      title: jobData.title?.trim() || "GoodHive job",
      typeEngagement: jobData.type_engagement,
      userId: jobData.user_id,
    };
  } catch (error) {
    console.error("Error fetching job:", error);
    return null;
  }
}

async function getViewerState(job: JobPageData): Promise<ViewerState> {
  const sessionUser = await getSessionUser();
  const viewerUserId = sessionUser?.user_id ?? null;
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

  const isCompanyOwner = viewerUserId === job.userId;

  if (!viewerUserId) {
    return {
      canViewJobDetails: false,
      canEditJob: false,
      canMessageCompany: false,
      canPreviewUnpublished: isAdmin,
      hasApplied: false,
      hasApprovedCompany: false,
      hasApprovedTalent: false,
      isAdmin,
      isApprovedTalent: false,
      isAuthenticated: false,
      isCompanyOwner: false,
      userId: null,
    };
  }

  const [viewerRows, applicationRows] = await Promise.all([
    sql<{
      approved_company_count: number;
      has_talent_profile: boolean;
      talent_status: string | null;
    }[]>`
      SELECT
        u.talent_status,
        (
          SELECT COUNT(*)::int
          FROM goodhive.companies c
          WHERE c.user_id = ${viewerUserId}::uuid
            AND c.approved = true
        ) AS approved_company_count,
        EXISTS(
          SELECT 1
          FROM goodhive.talents t
          WHERE t.user_id = ${viewerUserId}::uuid
        ) AS has_talent_profile
      FROM goodhive.users u
      WHERE u.userid = ${viewerUserId}::uuid
      LIMIT 1
    `,
    sql<{ id: string }[]>`
      SELECT id
      FROM goodhive.job_applications
      WHERE job_id = ${job.id}::uuid
        AND applicant_user_id = ${viewerUserId}::uuid
      LIMIT 1
    `,
  ]);

  const viewer = viewerRows[0];
  const isApprovedTalent =
    viewer?.has_talent_profile === true && viewer.talent_status === "approved";
  const hasApprovedCompany = Number(viewer?.approved_company_count || 0) > 0;
  const canViewJobDetails =
    isAdmin || isCompanyOwner || isApprovedTalent || hasApprovedCompany;

  return {
    canViewJobDetails,
    canEditJob:
      isCompanyOwner &&
      (job.reviewStatus === "draft" || job.reviewStatus === "rejected"),
    canMessageCompany: isApprovedTalent && job.company.approved,
    canPreviewUnpublished: isAdmin || isCompanyOwner,
    hasApplied: applicationRows.length > 0,
    hasApprovedCompany,
    hasApprovedTalent: isApprovedTalent,
    isAdmin,
    isApprovedTalent,
    isAuthenticated: true,
    isCompanyOwner,
    userId: viewerUserId,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { jobId: string };
}): Promise<Metadata> {
  const job = await getJob(params.jobId);

  if (!job) {
    return {
      description: "The requested job could not be found.",
      title: "Job Not Found | GoodHive",
    };
  }

  const location = [job.city, job.country].filter(Boolean).join(", ") || "Remote";
  const budget = formatBudget(job.budget, job.currency);
  const sessionUser = await getSessionUser();
  const adminToken = cookies().get("admin_token")?.value ?? null;
  let isPrivilegedViewer = Boolean(sessionUser);

  if (!isPrivilegedViewer && adminToken) {
    try {
      jwt.verify(adminToken, getAdminJWTSecret());
      isPrivilegedViewer = true;
    } catch (error) {
      isPrivilegedViewer = false;
    }
  }

  const companyName = isPrivilegedViewer ? job.company.name : "a verified GoodHive company";
  const metadataImages = isPrivilegedViewer && job.company.logo ? [{ url: job.company.logo }] : [];

  return {
    description: `${job.title} at ${companyName} in ${location}. Budget: ${budget}.`,
    openGraph: {
      description: `${job.title} at ${companyName} in ${location}. Budget: ${budget}.`,
      images: metadataImages,
      title: `${job.title} at ${companyName}`,
      type: "website",
    },
    title: `${job.title} at ${companyName} | GoodHive`,
    twitter: {
      card: "summary_large_image",
      description: `${job.title} at ${companyName} in ${location}. Budget: ${budget}.`,
      images: metadataImages.map((image) => image.url),
      title: `${job.title} at ${companyName}`,
    },
  };
}

export default async function JobPage({
  params,
}: {
  params: { jobId: string };
}) {
  const job = await getJob(params.jobId);

  if (!job) {
    notFound();
  }

  const viewer = await getViewerState(job);

  if (!job.published && !viewer.canPreviewUnpublished) {
    notFound();
  }

  const overviewCards = getOverviewCards(job);
  const canViewFullDetails = viewer.canViewJobDetails;
  const isCompanyVisible = canViewFullDetails;
  const locationLabel = [job.city, job.country].filter(Boolean).join(", ") || "Remote";
  const budgetLabel = formatBudget(job.budget, job.currency);
  const audienceLabel = getAudienceLabel(job);
  const companyLocation = [job.company.city, job.company.country]
    .filter(Boolean)
    .join(", ");
  const actionCompanyName = isCompanyVisible ? job.company.name : "this company";
  const actionCompanyEmail = viewer.canMessageCompany ? job.company.email || "" : "";
  const actionCompanyUserId =
    viewer.canMessageCompany || viewer.isCompanyOwner || viewer.isAdmin
      ? job.company.id
      : "";
  const actionWalletAddress =
    viewer.isApprovedTalent || viewer.isCompanyOwner || viewer.isAdmin
      ? job.company.walletAddress || job.company.id
      : "";
  const companyLinks = [
    {
      href: job.company.website,
      icon: Globe,
      label: job.company.website?.replace(/^https?:\/\//, "") || "Website",
    },
    {
      href: job.company.linkedin,
      icon: Linkedin,
      label: "LinkedIn",
    },
    {
      href: job.company.twitter,
      icon: Twitter,
      label: "Twitter",
    },
  ].filter((item) => Boolean(item.href));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,214,102,0.18),_transparent_32%),linear-gradient(180deg,#f8f5ee_0%,#f3efe7_100%)]">
      <JobPageAnalytics jobId={job.id} jobTitle={job.title} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/talents/job-search"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>

          {!viewer.isAuthenticated ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Public preview: connect your wallet to unlock company identity and contact details.
            </div>
          ) : null}
        </div>

        <section className="overflow-hidden rounded-[36px] border border-[#e7dcc7] bg-[radial-gradient(circle_at_top_left,_rgba(255,214,102,0.22),_transparent_36%),linear-gradient(135deg,rgba(255,251,243,0.98)_0%,rgba(255,255,255,0.98)_54%,rgba(248,242,231,0.98)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.6fr)_340px]">
            <div className="space-y-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-sm ring-1 ring-amber-100/80">
                  {isCompanyVisible && job.company.logo ? (
                    <Image
                      alt={`${job.company.name} logo`}
                      className="h-full w-full object-cover"
                      height={80}
                      src={job.company.logo}
                      width={80}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,214,102,0.4),_transparent_55%),linear-gradient(135deg,#fff5d7_0%,#fffefb_100%)]">
                      <Lock className="h-8 w-8 text-amber-700" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-2">
                    {isCompanyVisible ? (
                      <div>
                        <Link
                          href={`/companies/${job.company.id}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-amber-800 transition hover:text-amber-950"
                        >
                          {job.company.name}
                          {job.company.approved ? (
                            <ShieldCheck className="h-4 w-4 normal-case tracking-normal" />
                          ) : null}
                        </Link>
                      </div>
                    ) : (
                      <div className="inline-flex max-w-full items-center rounded-full border border-amber-200/80 bg-white/90 px-4 py-2 shadow-sm">
                        <CompanyInfoGuard
                          value={undefined}
                          seed={`${job.id}-hero-company`}
                          isVisible={false}
                          textClassName="uppercase tracking-[0.28em] text-amber-800"
                          sizeClassName="text-sm font-semibold"
                          blurAmount="blur-[8px]"
                          placement="bottom"
                        />
                      </div>
                    )}

                    <div className="max-w-4xl">
                      <h1 className="text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                        {job.title}
                      </h1>
                      {isCompanyVisible && job.company.headline ? (
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                          {job.company.headline}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  {locationLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <CalendarDays className="h-4 w-4 text-amber-600" />
                  {formatRelativeDate(job.postedAt)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <Users2 className="h-4 w-4 text-amber-600" />
                  {job.applicationCount} application{job.applicationCount === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <Tag className="h-4 w-4 text-amber-600" />
                  {audienceLabel}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {overviewCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2 text-amber-700">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50">
                        <card.icon className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {card.label}
                      </p>
                    </div>
                    <p className="mt-4 text-base font-semibold text-slate-900">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[28px] border border-white/80 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Opportunity Budget
                </p>
                <p className="mt-3 text-3xl font-semibold sm:text-4xl">{budgetLabel}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 shadow-inner shadow-emerald-950/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Budget benchmark
                  <span className="font-semibold text-white/90">{budgetLabel}</span>
                </div>

                {viewer.isAdmin || viewer.isCompanyOwner ? (
                  <p className="mt-5 text-sm text-slate-300">
                    Review status:{" "}
                    <span className="font-semibold capitalize text-white">
                      {job.reviewStatus.replace(/_/g, " ")}
                    </span>
                  </p>
                ) : (
                  <p className="mt-5 text-sm text-slate-300">
                    Live on GoodHive and ready for qualified candidates.
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-[#eadfca] bg-white/88 p-6 shadow-sm">
                {isCompanyVisible ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Company Access
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      Review the company profile and apply with context.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/companies/${job.company.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                      >
                        View Company Profile
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <Lock className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-950">
                      Company details stay private in public preview mode.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      The role information stays open, but the hiring company identity and direct links unlock after connection.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {viewer.isCompanyOwner && job.reviewStatus === "rejected" && job.adminFeedback ? (
          <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
            <p className="font-semibold">Admin feedback</p>
            <p className="mt-2 whitespace-pre-wrap">{job.adminFeedback}</p>
          </div>
        ) : null}

        {viewer.isCompanyOwner && job.reviewStatus === "pending_review" ? (
          <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800">
            This job is currently under review. Company-side editing is locked until
            an admin approves or rejects it.
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_340px]">
          <main className="space-y-6">
            {job.skills.length > 0 ? (
              <section className="rounded-[30px] border border-[#e6e0d5] bg-white/95 p-6 shadow-sm sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      What You&apos;ll Use
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">Skills</h2>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                    {job.skills.length} listed
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {job.sections.length > 0 ? (
              <section className="rounded-[30px] border border-[#e6e0d5] bg-white/95 p-6 shadow-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Full Brief
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Role Overview</h2>
                <div className="mt-6 space-y-8">
                  {job.sections
                    .sort((left, right) => left.sortOrder - right.sortOrder)
                    .map((section) => (
                      <article key={section.id}>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {section.heading}
                        </h3>
                        <SafeHTML
                          html={normalizeJobDescriptionForDisplay(section.content)}
                          className="prose prose-sm mt-3 max-w-3xl break-words text-slate-600 prose-headings:text-slate-900 prose-p:leading-7 prose-p:text-slate-600 prose-li:leading-7 prose-li:text-slate-600 prose-a:text-amber-700 prose-strong:text-slate-900 sm:prose-base"
                          allowedTags={[
                            "a",
                            "br",
                            "em",
                            "li",
                            "ol",
                            "p",
                            "strong",
                            "ul",
                          ]}
                          allowedAttributes={{ a: ["href", "target", "rel"] }}
                        />
                      </article>
                    ))}
                </div>
              </section>
            ) : job.description ? (
              <section className="rounded-[30px] border border-[#e6e0d5] bg-white/95 p-6 shadow-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Full Brief
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Role Overview</h2>
                <SafeHTML
                  html={normalizeJobDescriptionForDisplay(job.description)}
                  className="prose prose-sm mt-4 max-w-3xl break-words text-slate-600 prose-headings:text-slate-900 prose-p:leading-7 prose-p:text-slate-600 prose-li:leading-7 prose-li:text-slate-600 prose-a:text-amber-700 prose-strong:text-slate-900 sm:prose-base"
                  allowedTags={[
                    "a",
                    "br",
                    "em",
                    "li",
                    "ol",
                    "p",
                    "strong",
                    "ul",
                  ]}
                  allowedAttributes={{ a: ["href", "target", "rel"] }}
                />
              </section>
            ) : null}

            {viewer.isApprovedTalent && viewer.userId ? (
              <YourMatchScoreCard jobId={job.id} talentId={viewer.userId} />
            ) : (
              <MatchScoreLockedCard jobId={job.id} viewer={viewer} />
            )}

            {canViewFullDetails && job.relatedJobs.length > 0 ? (
              <RelatedJobsSection
                companyName={viewer.isAuthenticated ? job.company.name : "this company"}
                relatedJobs={job.relatedJobs.map((relatedJob) => ({
                  city: relatedJob.city || "",
                  country: relatedJob.country || "",
                  currency: relatedJob.currency || "",
                  id: relatedJob.id,
                  postedAt: relatedJob.postedAt || "",
                  projectType: relatedJob.projectType || "",
                  title: relatedJob.title,
                  budget: relatedJob.budget,
                }))}
              />
            ) : null}
          </main>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <JobActionPanel
              canEditJob={viewer.canEditJob}
              canMessageCompany={viewer.canMessageCompany}
              companyEmail={actionCompanyEmail}
              companyName={actionCompanyName}
              companyUserId={actionCompanyUserId}
              hasApplied={viewer.hasApplied}
              isAdmin={viewer.isAdmin}
              isAuthenticated={viewer.isAuthenticated}
              isCompanyOwner={viewer.isCompanyOwner}
              isEditableState={
                job.reviewStatus === "draft" || job.reviewStatus === "rejected"
              }
              isApprovedTalent={viewer.isApprovedTalent}
              jobId={job.id}
              jobTitle={job.title}
              manageApplicantsHref={`/companies/dashboard/jobs?jobId=${job.id}`}
              openToMentor={job.mentor}
              openToRecruiter={job.recruiter}
              openToTalent={job.talent}
              reviewHref={`/admin/job/${job.id}`}
              walletAddress={actionWalletAddress}
            />

            <section className="rounded-[30px] border border-[#e6e0d5] bg-white/95 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Access
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Privacy & access</h2>

              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="flex items-start gap-3 rounded-2xl bg-amber-50/80 p-4">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <p className="leading-6 text-slate-700">
                    Everyone can read the role summary, skills, and description. Company identity, company links, and direct contact access stay locked until the viewer has an approved talent or approved company profile.
                  </p>
                </div>
              </div>
            </section>

            {canViewFullDetails ? (
              <section className="rounded-[30px] border border-[#e6e0d5] bg-white/95 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Snapshot
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Opportunity at a glance</h2>

                <div className="mt-5 space-y-4 text-sm text-slate-700">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Project type</span>
                    <span className="text-right font-medium text-slate-900">
                      {getLabel(projectTypes, job.projectType, "Project")}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Job type</span>
                    <span className="text-right font-medium text-slate-900">
                      {getLabel(jobTypes, job.jobType, "Role")}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Engagement</span>
                    <span className="text-right font-medium text-slate-900">
                      {getLabel(typeEngagements, job.typeEngagement, "Flexible")}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Timeline</span>
                    <span className="text-right font-medium text-slate-900">
                      {getLabel(projectDuration, job.duration, "Flexible duration")}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Candidate access</span>
                    <span className="text-right font-medium text-slate-900">{audienceLabel}</span>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-[30px] border border-[#e6e0d5] bg-white/95 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Company
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">About the Company</h2>

              {isCompanyVisible ? (
                <>
                  <div className="mt-5 rounded-[26px] bg-[linear-gradient(180deg,#fffdf8_0%,#f9f5ec_100%)] p-5 ring-1 ring-[#eee2cb]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                        {job.company.logo ? (
                          <Image
                            alt={`${job.company.name} logo`}
                            className="h-full w-full object-cover"
                            height={72}
                            src={job.company.logo}
                            width={72}
                          />
                        ) : (
                          <Building2 className="h-7 w-7 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Hiring company
                        </p>
                        <p className="mt-2 text-xl font-semibold leading-tight text-slate-950">
                          {job.company.name}
                        </p>
                      </div>
                    </div>

                    {job.company.headline ? (
                      <p className="mt-4 text-[13px] leading-6 text-slate-600">
                        {job.company.headline}
                      </p>
                    ) : null}
                  </div>

                  {companyLocation ? (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-amber-600" />
                      {companyLocation}
                    </div>
                  ) : null}

                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    {companyLinks.map((item) => (
                      <a
                        key={`${item.label}-${item.href}`}
                        className="flex items-center gap-2 transition hover:text-slate-900"
                        href={item.href!}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <item.icon className="h-4 w-4 text-amber-600" />
                        {item.label}
                      </a>
                    ))}

                    <Link
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                      href={`/companies/${job.company.id}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Company Profile
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-5 rounded-[26px] bg-[linear-gradient(180deg,#fffdf8_0%,#f9f5ec_100%)] p-5 ring-1 ring-[#eee2cb]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[22px] border border-amber-200 bg-amber-50 text-amber-700">
                        <Lock className="h-7 w-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Hiring company
                        </p>
                        <div className="mt-2">
                          <CompanyInfoGuard
                            value={undefined}
                            seed={`${job.id}-about-company`}
                            isVisible={false}
                            textClassName="text-slate-900"
                            sizeClassName="text-xl font-semibold leading-tight"
                            blurAmount="blur-[8px]"
                            placement="bottom"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-[13px] leading-6 text-slate-600">
                      Connect your wallet to reveal the hiring company, explore their profile, and unlock external links.
                    </p>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-dashed border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
                    This public preview keeps company identity private while still letting candidates review the role itself.
                  </div>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
