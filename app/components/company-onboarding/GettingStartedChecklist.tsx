"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Rocket, X } from "lucide-react";

import { getJobBalance } from "@/lib/contracts/jobManager";
import { CompanyHiddenNotice } from "./CompanyHiddenNotice";
import { REVIEW_TURNAROUND } from "@/lib/jobs/review";
import type {
  CompanyOnboardingProgress,
  CompanyOnboardingStepId,
} from "@/lib/jobs/company-onboarding";

const DISMISS_STORAGE_PREFIX = "goodhive:company-checklist-dismissed:";

interface StepDef {
  id: CompanyOnboardingStepId;
  label: string;
  detail: string;
  cta: string;
  href: (p: CompanyOnboardingProgress) => string;
}

const jobsHref = (p: CompanyOnboardingProgress) =>
  p.focusJobId
    ? `/companies/dashboard/jobs?activate=${p.focusJobId}`
    : "/companies/dashboard/jobs";

const STEPS: StepDef[] = [
  {
    id: "profile",
    label: "Complete your profile",
    detail: "Add your logo, description and contact details, then submit it.",
    cta: "Open profile",
    href: () => "/companies/my-profile",
  },
  {
    id: "approved",
    label: "Profile approved",
    detail: "The GoodHive team checks your company before you can post jobs.",
    cta: "View profile",
    href: () => "/companies/my-profile",
  },
  {
    id: "create_job",
    label: "Create a job",
    detail: "Describe the role, skills and budget, then submit it for review.",
    cta: "Create job",
    href: () => "/companies/create-job",
  },
  {
    id: "job_approved",
    label: "Job approved",
    detail: "We check each job is clear and complete before it can go live.",
    cta: "View jobs",
    href: () => "/companies/dashboard/jobs",
  },
  {
    id: "publish",
    label: "Publish on the blockchain",
    detail: "Connect your wallet and create the job's escrow contract.",
    cta: "Publish",
    href: jobsHref,
  },
  {
    id: "fund",
    label: "Fund the job",
    detail: "Add a provision fund to escrow. It pays talent when a mission is done.",
    cta: "Add funds",
    href: jobsHref,
  },
  {
    id: "live",
    label: "Live",
    detail: "Your job is visible to talent and open for applications.",
    cta: "View job",
    href: (p) => (p.focusJobId ? `/jobs/${p.focusJobId}` : "/companies/dashboard/jobs"),
  },
];

interface GettingStartedChecklistProps {
  userId: string | null;
}

export function GettingStartedChecklist({ userId }: GettingStartedChecklistProps) {
  const [progress, setProgress] = useState<CompanyOnboardingProgress | null>(null);
  const [escrowFunded, setEscrowFunded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    try {
      setDismissed(localStorage.getItem(`${DISMISS_STORAGE_PREFIX}${userId}`) === "1");
    } catch {
      // Storage unavailable — keep the checklist visible.
    }
  }, [userId]);

  useEffect(() => {
    fetch("/api/companies/onboarding-progress", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { success: boolean; data?: CompanyOnboardingProgress }) => {
        if (json.success && json.data) setProgress(json.data);
      })
      .catch(() => {});
  }, []);

  // Funds can be in escrow while activation failed; the DB can't tell, so
  // read the balance on-chain for that one case.
  useEffect(() => {
    if (!progress?.steps.publish || progress.steps.live) return;
    if (progress.focusBlockchainJobId === null) return;
    let cancelled = false;
    getJobBalance(progress.focusBlockchainJobId)
      .then((balance) => {
        if (!cancelled && balance > 0n) setEscrowFunded(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [progress]);

  if (!progress) return null;

  const done: Record<CompanyOnboardingStepId, boolean> = {
    ...progress.steps,
    fund: progress.steps.fund || escrowFunded,
  };
  const completed = STEPS.filter((s) => done[s.id]).length;
  const allDone = completed === STEPS.length;
  const current = STEPS.find((s) => !done[s.id]) ?? null;

  // Never let the checklist hide this warning, even once dismissed.
  if (allDone && dismissed) {
    return progress.companyHidden ? <CompanyHiddenNotice /> : null;
  }

  const waitingOnUs =
    (current?.id === "approved" && progress.profilePendingReview) ||
    (current?.id === "job_approved" && progress.jobPendingReview);

  const dismiss = () => {
    setDismissed(true);
    try {
      if (userId) localStorage.setItem(`${DISMISS_STORAGE_PREFIX}${userId}`, "1");
    } catch {
      // Ignore storage failures.
    }
  };

  return (
    <section
      className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Getting started
          </p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">
            {allDone
              ? progress.companyHidden
                ? "Your job is live, but hidden from talent"
                : "You're all set. Your job is live."
              : "Get your first job live on GoodHive"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {completed} of {STEPS.length} steps done. Each step ticks itself off as you go.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-500"
              style={{ width: `${(completed / STEPS.length) * 100}%` }}
            />
          </div>
          {allDone && (
            <button
              type="button"
              onClick={dismiss}
              aria-label="Hide checklist"
              className="rounded-full p-1.5 text-gray-400 transition hover:bg-white hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {progress.companyHidden && (
        <div className="border-b border-amber-100 px-6 py-4">
          <CompanyHiddenNotice />
        </div>
      )}

      <ol className="divide-y divide-gray-100">
        {STEPS.map((step, i) => {
          const isDone = done[step.id];
          const isCurrent = current?.id === step.id;
          const isWaiting = isCurrent && waitingOnUs;

          return (
            <li
              key={step.id}
              className={`flex items-start gap-4 px-6 py-4 ${isCurrent ? "bg-amber-50/40" : ""}`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`font-semibold ${
                    isDone ? "text-gray-500 line-through decoration-gray-300" : "text-gray-900"
                  }`}
                >
                  {step.label}
                </p>
                {!isDone && (isCurrent || i === 0) && (
                  <p className="mt-0.5 text-sm text-gray-600">{step.detail}</p>
                )}
                {isWaiting && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    With the GoodHive team, usually {REVIEW_TURNAROUND}. We&apos;ll email you when it&apos;s done.
                  </p>
                )}
              </div>

              {isCurrent && !isWaiting && (
                <Link
                  href={step.href(progress)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  {step.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {isDone && step.id === "live" && (
                <Link
                  href={step.href(progress)}
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700"
                >
                  <Rocket className="h-4 w-4" />
                  {step.cta}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
