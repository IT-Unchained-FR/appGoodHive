"use client";

import type { Step } from "react-joyride";
import { GuidedTour } from "@/app/components/tour/GuidedTour";
import { REVIEW_TURNAROUND } from "@/lib/jobs/review";

const TOUR_STORAGE_PREFIX = "goodhive:jobs-list-tour-done:";

const statuses = [
  { label: "Draft", badge: "bg-slate-100 text-slate-700", detail: "Only you can see it. Edit and submit when ready." },
  { label: "Pending Review", badge: "bg-amber-100 text-amber-700", detail: `The GoodHive team is checking it, usually ${REVIEW_TURNAROUND}.` },
  { label: "Rejected", badge: "bg-rose-100 text-rose-700", detail: "Read the feedback, fix it and resubmit." },
  { label: "Approved", badge: "bg-emerald-100 text-emerald-700", detail: "Ready to publish on the blockchain and fund." },
  { label: "Active", badge: "bg-sky-100 text-sky-700", detail: "Live and funded. Talent can apply." },
  { label: "Closed", badge: "bg-slate-200 text-slate-700", detail: "Unpublished. No longer visible to talent." },
];

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Your jobs, step by step",
    content: (
      <div>
        <p className="mb-3">Every job shows a status. Here&apos;s what each one means:</p>
        <ul className="space-y-2">
          {statuses.map((s) => (
            <li key={s.label} className="flex items-start gap-2 text-sm">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.badge}`}>
                {s.label}
              </span>
              <span className="text-gray-600">{s.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    target: '[data-tour="jobs-counts"]',
    title: "At a glance",
    content: "How many jobs are drafts, waiting for review, or live right now.",
  },
  {
    target: '[data-tour="jobs-create"]',
    title: "Post a new job",
    content: "Start a new job here. It's saved as a draft until you submit it for review.",
  },
  {
    target: '[data-tour="job-status"]',
    title: "Status",
    content: "Where this job is in its journey. The next step is always the highlighted button below it.",
  },
  {
    target: '[data-tour="job-primary-action"]',
    title: "Next step",
    content:
      "This button changes with the status: Edit for drafts, Publish to Blockchain once approved, then Add Provision Fund to go live, and View Live once it is.",
  },
  {
    target: '[data-tour="job-submit"]',
    title: "Submit for review",
    content: "When a draft is ready, send it to the GoodHive team. We'll email you when it's approved.",
  },
  {
    target: '[data-tour="job-applicants"]',
    title: "Applicants",
    content: "See everyone who applied to this job and review their profiles.",
  },
  {
    target: '[data-tour="job-assignments"]',
    title: "Assignments & payouts",
    content:
      "Once a job is approved, assign talent to it. When they finish the mission, confirm it here to pay them from escrow.",
  },
  {
    target: '[data-tour="job-close"]',
    title: "Close a job",
    content: "Unpublish a job when you're done hiring. Closing doesn't touch the funds in escrow.",
  },
];

interface JobsListTourProps {
  userId: string;
  replayToken: number;
}

export function JobsListTour({ userId, replayToken }: JobsListTourProps) {
  return (
    <GuidedTour
      steps={steps}
      storageKey={`${TOUR_STORAGE_PREFIX}${userId}`}
      autoStart
      replayToken={replayToken}
    />
  );
}
