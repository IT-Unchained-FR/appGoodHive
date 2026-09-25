"use client";

import type { Step } from "react-joyride";
import { GuidedTour } from "@/app/components/tour/GuidedTour";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";

const TOUR_STORAGE_PREFIX = "goodhive:publish-fund-tour-done:";

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Two steps to go live ⛓️",
    content: (
      <div className="space-y-3">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>
            <strong>Publish</strong> creates your job&apos;s escrow contract on
            the blockchain.
          </li>
          <li>
            <strong>Fund</strong> moves money from your wallet into that escrow.
            It pays talent when they finish a mission.
          </li>
        </ol>
        <p className="text-sm text-gray-500">
          Your wallet asks you to confirm each transaction. You can close this
          window between steps and pick up where you left off.
        </p>
      </div>
    ),
  },
  {
    target: '[data-tour="activate-stepper"]',
    title: "Where you are",
    content: "A green tick means the step is done. If you left halfway, you resume from here.",
  },
  {
    target: '[data-tour="activate-wallet"]',
    title: "Wallet checklist",
    content:
      "Everything your wallet needs before a transaction: connected, on the right network, POL for network fees and the stablecoin to fund the job. Anything missing shows how to fix it, including free test tokens on testnet.",
  },
  {
    target: '[data-tour="activate-token"]',
    title: "Payment token",
    content:
      "The stablecoin talent will be paid in. It can't be changed after publishing, so pick the one you hold.",
  },
  {
    target: '[data-tour="activate-balance"]',
    title: "Wallet balance",
    content: "How much of the payment token you have available to fund this job.",
  },
  {
    target: '[data-tour="activate-amount"]',
    title: "Provision fund",
    content:
      "Enter at least what you expect to pay out for this job. You can add more or withdraw unused funds later with Manage Funds.",
  },
  {
    target: '[data-tour="activate-escrow-note"]',
    title: "Your money stays yours",
    content:
      "Funds sit in the job's smart contract, not with GoodHive. They're only released when you confirm a talent's payout.",
  },
  {
    target: '[data-tour="activate-submit"]',
    title: "Confirm",
    content: "Click here, then approve in your wallet. Wait for the confirmation before closing this window.",
  },
];

interface PublishFundTourProps {
  replayToken: number;
}

export function PublishFundTour({ replayToken }: PublishFundTourProps) {
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
