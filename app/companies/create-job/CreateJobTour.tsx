"use client";

import type { Step } from "react-joyride";
import { GuidedTour } from "@/app/components/tour/GuidedTour";

const TOUR_STORAGE_PREFIX = "goodhive:create-job-tour-done:";

const journey = [
  { label: "Draft", detail: "Fill in the job details" },
  { label: "Review", detail: "GoodHive team approves it" },
  { label: "Publish", detail: "Create it on the blockchain" },
  { label: "Fund", detail: "Provision escrow funds" },
];

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Let's post your first job 🚀",
    content: (
      <div>
        <p className="mb-4">
          A job on GoodHive goes through four stages. This tour shows you
          each one.
        </p>
        <ol className="space-y-2">
          {journey.map((item, i) => (
            <li key={item.label} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                {i + 1}
              </span>
              <span className="text-sm">
                <span className="font-semibold text-gray-900">
                  {item.label}
                </span>{" "}
                <span className="text-gray-500">· {item.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    ),
  },
  {
    target: '[data-tour="create-with-ai"]',
    title: "Short on time? Start with a few lines",
    content:
      "Describe the role in your own words and we draft the title, description, skills and budget. You can edit everything afterwards.",
  },
  {
    target: '[data-tour="job-image"]',
    title: "Job image",
    content:
      "Add a cover image for the job page. If you skip this, your company logo is used.",
  },
  {
    target: '[data-tour="job-title"]',
    title: "Job title",
    content:
      "A clear, specific title, e.g. “Senior Solidity Engineer, DeFi protocol”.",
  },
  {
    target: '[data-tour="job-engagement"]',
    title: "Engagement, location & duration",
    content:
      "Choose freelance, employee or either, whether the role is remote, hybrid or on-site, and how long it runs.",
  },
  {
    target: '[data-tour="job-description-ai"]',
    title: "Write the description with AI",
    content:
      "Generate a full description from your title and skills, or write the sections yourself.",
  },
  {
    target: '[data-tour="job-sections"]',
    title: "Description sections",
    content:
      "Split the job into sections such as responsibilities, requirements and benefits. Click a section to edit it, drag to reorder. Rough notes are tidied when you save.",
  },
  {
    target: '[data-tour="job-skills"]',
    title: "Required skills",
    content:
      "Add at least 3 skills a candidate must have. Specific tools and languages match talent better than soft skills.",
  },
  {
    target: '[data-tour="job-services"]',
    title: "Who can respond",
    content:
      "Talent is always on: you choose candidates yourself. Add Recruiters to get a shortlist introduced to you, or Mentors to vet candidates and guide your hire. Each adds a fee.",
  },
  {
    target: '[data-tour="job-budget"]',
    title: "Budget",
    content:
      "Choose fixed price or hourly, then enter the budget or hourly rate.",
  },
  {
    target: '[data-tour="job-commission"]',
    title: "Total to fund",
    content:
      "Your budget plus GoodHive's fee for each service you picked. Open it to see the breakdown.",
  },
  {
    target: '[data-tour="job-chain"]',
    title: "Network & currency",
    content:
      "The network is set for you. Pick the stablecoin talent will be paid in. Both are fixed once the job is published on-chain.",
  },
  {
    target: '[data-tour="job-save-draft"]',
    title: "Save a draft",
    content:
      "Save your progress any time. You don't need a wallet to save or submit.",
  },
  {
    target: '[data-tour="job-submit-review"]',
    title: "Submit for review",
    content:
      "Unlocks once the checklist on the right is complete. The GoodHive team reviews every job before it can be published.",
  },
  {
    target: "body",
    placement: "center",
    title: "Publish on the blockchain ⛓️",
    content: (
      <div className="space-y-3">
        <p>After your job is approved, come back to this page:</p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>
            Click <strong>Publish to blockchain</strong> at the top of the
            page or in the panel on the right.
          </li>
          <li>Connect your wallet and confirm the transaction.</li>
          <li>
            Add a <strong>provision fund</strong>. The funds are held in the
            job&apos;s smart contract so talent can be paid on-chain.
          </li>
        </ol>
        <p className="text-sm text-gray-500">
          Once it&apos;s published and funded, your job is live for talent.
        </p>
      </div>
    ),
  },
];

interface CreateJobTourProps {
  userId: string;
  /** Start the tour automatically if this user hasn't seen it yet. */
  autoStart: boolean;
  /** Incremented by the parent to replay the tour on demand. */
  replayToken: number;
}

export function CreateJobTour({
  userId,
  autoStart,
  replayToken,
}: CreateJobTourProps) {
  return (
    <GuidedTour
      steps={steps}
      storageKey={`${TOUR_STORAGE_PREFIX}${userId}`}
      autoStart={autoStart}
      replayToken={replayToken}
    />
  );
}
