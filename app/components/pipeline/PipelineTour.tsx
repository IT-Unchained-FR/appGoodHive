"use client";

import type { Step } from "react-joyride";
import { GuidedTour } from "@/app/components/tour/GuidedTour";
import { STAGES } from "./pipeline-types";

const TOUR_STORAGE_PREFIX = "goodhive:pipeline-tour-done:";

const steps: Step[] = [
  {
    target: '[data-tour="pipeline-board"]',
    title: "Your hiring board",
    content: (
      <div>
        <p className="mb-3">Each column is a hiring stage. Candidates move left to right:</p>
        <ol className="flex flex-wrap gap-1.5">
          {STAGES.map((stage) => (
            <li key={stage.key} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${stage.bg}`}>
              {stage.label}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-gray-500">Click a column header to collapse or expand it.</p>
      </div>
    ),
  },
  {
    target: '[data-tour="pipeline-find"]',
    title: "Add candidates",
    content: "Find talent and add them to your pipeline. They start in Shortlisted.",
  },
  {
    target: '[data-tour="pipeline-drag"]',
    title: "Move a candidate",
    content: "Drag a card by this handle to another column, or pick a stage from the dropdown on the card.",
  },
  {
    target: '[data-tour="pipeline-notes"]',
    title: "Private notes",
    content: "Keep notes on each candidate, like interview feedback. Talent never sees them.",
  },
  {
    target: '[data-tour="pipeline-actions"]',
    title: "Card actions",
    content: "Change stage, share a summary of the candidate, message them, open their profile, or remove them from the pipeline.",
  },
  {
    target: '[data-tour="pipeline-compare"]',
    title: "Compare side by side",
    content: "Select 2 or 3 candidates, then click Compare in the bar at the bottom to see them next to each other.",
  },
  {
    target: '[data-tour="pipeline-export"]',
    title: "Export",
    content: "Download your whole pipeline as a CSV file.",
  },
];

interface PipelineTourProps {
  userId: string;
  replayToken: number;
}

export function PipelineTour({ userId, replayToken }: PipelineTourProps) {
  return (
    <GuidedTour
      steps={steps}
      storageKey={`${TOUR_STORAGE_PREFIX}${userId}`}
      autoStart
      replayToken={replayToken}
    />
  );
}
