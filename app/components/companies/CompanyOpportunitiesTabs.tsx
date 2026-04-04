"use client";

import { jobTypes, projectDuration, projectTypes, typeEngagements } from "@/app/constants/common";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  MonitorSmartphone,
  Sparkles,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { type ComponentType, useMemo, useState } from "react";

type OpportunityJob = {
  budget: number;
  budgetLabel: string;
  descriptionPreview: string;
  duration: string | null;
  id: string;
  job_type: string | null;
  locationLabel: string;
  postedLabel: string;
  project_type: string | null;
  published: boolean;
  reviewStatus:
    | "draft"
    | "pending_review"
    | "approved"
    | "rejected"
    | "active"
    | "closed";
  roleLabels: string[];
  title: string | null;
  type_engagement: string | null;
};

interface CompanyOpportunitiesTabsProps {
  companyName: string;
  jobs: OpportunityJob[];
  showInactiveTab: boolean;
}

type TabKey = "active" | "inactive";

function getLabel(
  options: Array<{ value: string; label: string }>,
  value: string | null | undefined,
  fallback: string,
) {
  if (!value) return fallback;
  return options.find((option) => option.value === value)?.label ?? fallback;
}

function isActiveJob(job: OpportunityJob) {
  return job.reviewStatus === "active" || job.reviewStatus === "approved" || job.published;
}

function getStatusMeta(job: OpportunityJob) {
  if (isActiveJob(job)) {
    return {
      dotClass: "bg-emerald-500",
      label: "Active",
      labelClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    };
  }

  if (job.reviewStatus === "pending_review") {
    return {
      dotClass: "bg-amber-500",
      label: "Pending review",
      labelClass: "bg-amber-50 text-amber-700 ring-amber-100",
    };
  }

  if (job.reviewStatus === "closed") {
    return {
      dotClass: "bg-slate-400",
      label: "Closed",
      labelClass: "bg-slate-100 text-slate-600 ring-slate-200",
    };
  }

  if (job.reviewStatus === "rejected") {
    return {
      dotClass: "bg-rose-500",
      label: "Rejected",
      labelClass: "bg-rose-50 text-rose-700 ring-rose-100",
    };
  }

  return {
    dotClass: "bg-slate-400",
    label: "Inactive",
    labelClass: "bg-slate-100 text-slate-600 ring-slate-200",
  };
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,250,0.88))] p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <BriefcaseBusiness className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}

function ContextTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-slate-50/85 p-3 ring-1 ring-slate-200/80">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        <Icon className="h-3.5 w-3.5 text-sky-700" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

export function CompanyOpportunitiesTabs({
  companyName,
  jobs,
  showInactiveTab,
}: CompanyOpportunitiesTabsProps) {
  const activeJobs = useMemo(() => jobs.filter(isActiveJob), [jobs]);
  const inactiveJobs = useMemo(() => jobs.filter((job) => !isActiveJob(job)), [jobs]);
  const [activeTab, setActiveTab] = useState<TabKey>("active");

  const visibleJobs = activeTab === "active" ? activeJobs : inactiveJobs;

  return (
    <section id="open-roles" className="mt-8 rounded-[28px] bg-white/78 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-black/5 backdrop-blur-xl sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Opportunities
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Roles from {companyName}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-slate-500">
          Browse live openings and, when available to you, review inactive roles separately.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === "active"
              ? "bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
          }`}
        >
          <Activity className="h-4 w-4" />
          Active jobs
          <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "active" ? "bg-white/15" : "bg-slate-100"}`}>
            {activeJobs.length}
          </span>
        </button>

        {showInactiveTab ? (
          <button
            type="button"
            onClick={() => setActiveTab("inactive")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "inactive"
                ? "bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
            }`}
          >
            <Activity className="h-4 w-4" />
            Inactive jobs
            <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "inactive" ? "bg-white/15" : "bg-slate-100"}`}>
              {inactiveJobs.length}
            </span>
          </button>
        ) : null}
      </div>

      {visibleJobs.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visibleJobs.map((job) => {
            const status = getStatusMeta(job);

            return (
              <article
                key={job.id}
                className="flex h-full flex-col rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(245,248,252,0.96))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${status.labelClass}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {job.postedLabel}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                        {job.title?.trim() || "Open opportunity"}
                      </h3>
                    </div>
                  </div>

                  <div className="w-[132px] shrink-0 rounded-[20px] bg-slate-950 px-3.5 py-2.5 text-right text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                      Budget
                    </p>
                    <p className="mt-1 whitespace-nowrap text-sm font-semibold tracking-[0.02em] text-white">
                      {job.budgetLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ContextTile
                    icon={BriefcaseBusiness}
                    label="Project type"
                    value={getLabel(projectTypes, job.project_type, "Flexible setup")}
                  />
                  <ContextTile
                    icon={MonitorSmartphone}
                    label="Work style"
                    value={getLabel(jobTypes, job.job_type, "Flexible location")}
                  />
                  <ContextTile
                    icon={Users2}
                    label="Engagement"
                    value={getLabel(typeEngagements, job.type_engagement, "Flexible engagement")}
                  />
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {job.descriptionPreview}
                </p>

                <div className="mt-5 flex flex-wrap gap-2.5 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                    <MapPin className="h-4 w-4 text-sky-700" />
                    {job.locationLabel}
                  </span>
                  {job.duration && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                      <CalendarDays className="h-4 w-4 text-sky-700" />
                      {getLabel(projectDuration, job.duration, "Flexible duration")}
                    </span>
                  )}
                </div>

                {job.roleLabels.length > 0 && (
                  <div className="mt-4 rounded-[20px] bg-slate-50/85 p-3 ring-1 ring-slate-200/80">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <Sparkles className="h-3.5 w-3.5 text-sky-700" />
                      Available support lanes
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                    {job.roleLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                      >
                        {label}
                      </span>
                    ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-6">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-sky-800"
                  >
                    View role details
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : activeTab === "active" ? (
        <EmptyState
          title="No active roles right now"
          description="This company profile is live, but there are no currently active opportunities at the moment."
        />
      ) : (
        <EmptyState
          title="No inactive roles to review"
          description="There are no inactive, closed, or pending roles available in this view right now."
        />
      )}
    </section>
  );
}
