"use client";

import type { Step } from "react-joyride";
import { GuidedTour } from "@/app/components/tour/GuidedTour";

const TOUR_STORAGE_PREFIX = "goodhive:top-candidates-tour-done:";

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Let AI find your best fits ✨",
    content:
      "Pick one of your published jobs and GoodHive ranks approved, available talent against it. You get the top 5 with a match score and the reasons behind it.",
  },
  {
    target: '[data-tour="tc-job"]',
    title: "Choose a job",
    content: "Only published jobs appear here. Candidates are ranked against this job's skills and description.",
  },
  {
    target: '[data-tour="tc-generate"]',
    title: "Generate picks",
    content: "Runs the ranking. It can take a moment the first time. Use Refresh Picks later to see new talent.",
  },
  {
    target: '[data-tour="tc-card"]',
    title: "Candidate cards",
    content: "Ranked best first. The percentage shows how well their profile matches the job. Click a card to see why they fit, where they fall short, and to contact them.",
  },
];

interface TopCandidatesTourProps {
  userId: string;
  replayToken: number;
}

export function TopCandidatesTour({ userId, replayToken }: TopCandidatesTourProps) {
  return (
    <GuidedTour
      steps={steps}
      storageKey={`${TOUR_STORAGE_PREFIX}${userId}`}
      autoStart
      replayToken={replayToken}
    />
  );
}
