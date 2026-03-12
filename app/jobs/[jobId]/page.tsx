import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Building2, CalendarDays, ExternalLink, Globe, Linkedin, MapPin, Tag, Twitter, Users2 } from "lucide-react";
import jwt from "jsonwebtoken";

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
  canEditJob: boolean;
  canMessageCompany: boolean;
  canPreviewUnpublished: boolean;
  hasApplied: boolean;
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

function formatBudget(amount: number, currency: string | null) {
  const numericAmount = Number.isFinite(amount) ? amount : 0;
  const normalizedCurrency = currency?.trim().toUpperCase() || "USD";
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
      canEditJob: false,
      canMessageCompany: false,
      canPreviewUnpublished: isAdmin,
      hasApplied: false,
      isAdmin,
      isApprovedTalent: false,
      isAuthenticated: false,
      isCompanyOwner: false,
      userId: null,
    };
  }

  const [viewerRows, applicationRows] = await Promise.all([
    sql<{
      has_talent_profile: boolean;
      talent_status: string | null;
    }[]>`
      SELECT
        u.talent_status,
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

  return {
    canEditJob:
      isCompanyOwner &&
      (job.reviewStatus === "draft" || job.reviewStatus === "rejected"),
    canMessageCompany: isApprovedTalent && job.company.approved,
    canPreviewUnpublished: isAdmin || isCompanyOwner,
    hasApplied: applicationRows.length > 0,
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

  return {
    description: `${job.title} at ${job.company.name} in ${location}. Budget: ${budget}.`,
    openGraph: {
      description: `${job.title} at ${job.company.name} in ${location}. Budget: ${budget}.`,
      images: job.company.logo ? [{ url: job.company.logo }] : [],
      title: `${job.title} at ${job.company.name}`,
      type: "website",
    },
    title: `${job.title} at ${job.company.name} | GoodHive`,
    twitter: {
      card: "summary_large_image",
      description: `${job.title} at ${job.company.name} in ${location}. Budget: ${budget}.`,
      images: job.company.logo ? [job.company.logo] : [],
      title: `${job.title} at ${job.company.name}`,
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

  const metadataBadges = [
    getLabel(projectTypes, job.projectType, "Project"),
    getLabel(jobTypes, job.jobType, "Job Type"),
    getLabel(typeEngagements, job.typeEngagement, "Engagement"),
    getLabel(projectDuration, job.duration, "Flexible duration"),
  ];

  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <JobPageAnalytics jobId={job.id} jobTitle={job.title} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-[#e8dcc4] bg-[radial-gradient(circle_at_top,_rgba(255,214,102,0.28),_transparent_45%),linear-gradient(135deg,#fffaf0_0%,#ffffff_52%,#f9f4ea_100%)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-sm">
                  {job.company.logo ? (
                    <Image
                      alt={`${job.company.name} logo`}
                      className="h-full w-full object-cover"
                      height={80}
                      src={job.company.logo}
                      width={80}
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-slate-400" />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                      {job.company.name}
                    </p>
                    {job.company.headline ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {job.company.headline}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <h1 className="text-3xl font-semibold text-slate-950 sm:text-5xl">
                      {job.title}
                    </h1>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1">
                        <MapPin className="h-4 w-4 text-amber-600" />
                        {[job.city, job.country].filter(Boolean).join(", ") || "Remote"}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1">
                        <CalendarDays className="h-4 w-4 text-amber-600" />
                        {formatRelativeDate(job.postedAt)}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1">
                        <Users2 className="h-4 w-4 text-amber-600" />
                        {job.applicationCount} application
                        {job.applicationCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white/80 p-5 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Budget
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {formatBudget(job.budget, job.currency)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Review status:{" "}
                  <span className="font-semibold capitalize text-slate-700">
                    {job.reviewStatus.replace(/_/g, " ")}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {metadataBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  <Tag className="h-4 w-4 text-amber-600" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

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

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <main className="space-y-8">
            {job.skills.length > 0 ? (
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Skills</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {job.sections.length > 0 ? (
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Role Overview</h2>
                <div className="mt-6 space-y-8">
                  {job.sections
                    .sort((left, right) => left.sortOrder - right.sortOrder)
                    .map((section) => (
                      <article key={section.id}>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {section.heading}
                        </h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                          {section.content}
                        </p>
                      </article>
                    ))}
                </div>
              </section>
            ) : job.description ? (
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Role Overview</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {stripHtml(job.description)}
                </p>
              </section>
            ) : null}

            {viewer.isApprovedTalent && viewer.userId ? (
              <YourMatchScoreCard jobId={job.id} talentId={viewer.userId} />
            ) : null}

            {job.relatedJobs.length > 0 ? (
              <RelatedJobsSection
                companyName={job.company.name}
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

          <aside className="space-y-6">
            <JobActionPanel
              canEditJob={viewer.canEditJob}
              canMessageCompany={viewer.canMessageCompany}
              companyEmail={job.company.email || ""}
              companyName={job.company.name}
              companyUserId={job.company.id}
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
              loginHref={`/auth/login?redirect=${encodeURIComponent(`/jobs/${job.id}`)}`}
              manageApplicantsHref={`/companies/dashboard/jobs?jobId=${job.id}`}
              openToMentor={job.mentor}
              openToRecruiter={job.recruiter}
              openToTalent={job.talent}
              reviewHref={`/admin/job/${job.id}`}
              walletAddress={job.company.walletAddress || job.company.id}
            />

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">About the Company</h2>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                  {job.company.logo ? (
                    <Image
                      alt={`${job.company.name} logo`}
                      className="h-full w-full object-cover"
                      height={64}
                      src={job.company.logo}
                      width={64}
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-slate-400" />
                  )}
                </div>

                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {job.company.name}
                  </p>
                  {job.company.headline ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {job.company.headline}
                    </p>
                  ) : null}
                </div>
              </div>

              {(job.company.city || job.company.country) ? (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  {[job.company.city, job.company.country].filter(Boolean).join(", ")}
                </div>
              ) : null}

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                {job.company.website ? (
                  <a
                    className="flex items-center gap-2 transition hover:text-slate-900"
                    href={job.company.website}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Globe className="h-4 w-4 text-amber-600" />
                    {job.company.website}
                  </a>
                ) : null}

                {job.company.linkedin ? (
                  <a
                    className="flex items-center gap-2 transition hover:text-slate-900"
                    href={job.company.linkedin}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Linkedin className="h-4 w-4 text-amber-600" />
                    LinkedIn
                  </a>
                ) : null}

                {job.company.twitter ? (
                  <a
                    className="flex items-center gap-2 transition hover:text-slate-900"
                    href={job.company.twitter}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Twitter className="h-4 w-4 text-amber-600" />
                    Twitter
                  </a>
                ) : null}

                {job.company.id ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                    href={`/companies/${job.company.id}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Company Profile
                  </a>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
