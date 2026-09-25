"use client";

import type { Step } from "react-joyride";
import { GuidedTour } from "@/app/components/tour/GuidedTour";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";

const TOUR_STORAGE_PREFIX = "goodhive:fund-manager-tour-done:";

const steps: Step[] = [
  {
    target: '[data-tour="fm-escrow"]',
    title: "Money in escrow",
    content:
      "What this job's smart contract holds right now. Talent payouts come from here, so keep it at or above what you owe.",
  },
  {
    target: '[data-tour="fm-wallet"]',
    title: "Your wallet",
    content: "What you can move into escrow. This is your connected wallet, not a GoodHive balance.",
  },
  {
    target: '[data-tour="fm-tabs"]',
    title: "Three things you can do",
    content: (
      <ul className="space-y-1.5 text-sm">
        <li>
          <strong>Add funds:</strong> top up escrow from your wallet.
        </li>
        <li>
          <strong>Withdraw:</strong> send unused escrow back to your wallet.
        </li>
        <li>
          <strong>Pay fees:</strong> pay GoodHive&apos;s service fees for this job.
        </li>
      </ul>
    ),
  },
  {
    target: '[data-tour="fm-amount"]',
    title: "Amount",
    content: "Type an amount or use Max to fill in everything available for the selected action.",
  },
  {
    target: '[data-tour="fm-action"]',
    title: "Confirm in your wallet",
    content:
      "Your wallet asks you to sign. Adding funds usually takes two signatures: one to allow the token transfer, one to send it.",
  },
  {
    target: '[data-tour="fm-services"]',
    title: "Services & fees",
    content: "The GoodHive services on this job and the fee each one adds, as set when you published.",
  },
];

interface FundManagerTourProps {
  replayToken: number;
}

export function FundManagerTour({ replayToken }: FundManagerTourProps) {
  const userId = useCurrentUserId();
  if (!userId) return null;

  return (
    <GuidedTour
      steps={steps}
      storageKey={`${TOUR_STORAGE_PREFIX}${userId}`}
      autoStart
      replayToken={replayToken}
    />
  );
}
