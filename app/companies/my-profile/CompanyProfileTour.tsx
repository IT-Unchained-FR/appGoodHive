"use client";

import type { Step } from "react-joyride";
import { GuidedTour } from "@/app/components/tour/GuidedTour";

const TOUR_STORAGE_PREFIX = "goodhive:company-profile-tour-done:";

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to GoodHive! 🐝",
    content:
      "Let's set up your company profile. It only takes a few minutes, and once it's approved you can start posting jobs.",
  },
  {
    target: '[data-tour="profile-image"]',
    title: "Add your logo",
    content:
      "Upload your company logo or a profile picture. It's required before you can submit for review.",
  },
  {
    target: '[data-tour="company-name"]',
    title: "Company name",
    content: "Enter your company's official name as talent will see it.",
  },
  {
    target: '[data-tour="company-description"]',
    title: "Tell your story",
    content:
      "Describe your mission, culture, and what you're building. A strong description attracts better talent.",
  },
  {
    target: '[data-tour="contact-email"]',
    title: "Contact email",
    content: "The email we'll use to reach you about your profile and applicants.",
  },
  {
    target: '[data-tour="location"]',
    title: "Location",
    content: "Add your city and country.",
  },
  {
    target: '[data-tour="phone"]',
    title: "Phone number",
    content: "Pick your country code and enter a phone number.",
  },
  {
    target: '[data-tour="telegram"]',
    title: "Telegram",
    content: "Share your Telegram handle so the GoodHive team and talent can reach you quickly.",
  },
  {
    target: '[data-tour="social-links"]',
    title: "Social links (optional)",
    content: "Add LinkedIn, X, GitHub, or your website to build trust with candidates.",
  },
  {
    target: '[data-tour="save-draft"]',
    title: "Save as you go",
    content: "Not finished yet? Save a draft and come back any time.",
  },
  {
    target: '[data-tour="submit-review"]',
    title: "Submit for review",
    content:
      "When all required fields are filled, submit your profile. The core team will review it, and once approved you can create jobs.",
  },
  {
    target: '[data-tour="how-it-works"]',
    title: "Need a refresher?",
    content: "Watch the walkthrough video here, or replay this tour at any time.",
  },
];

interface CompanyProfileTourProps {
  userId: string;
  /** Start the tour automatically if this user hasn't seen it yet. */
  autoStart: boolean;
  /** Incremented by the parent to replay the tour on demand. */
  replayToken: number;
}

export function CompanyProfileTour({
  userId,
  autoStart,
  replayToken,
}: CompanyProfileTourProps) {
  return (
    <GuidedTour
      steps={steps}
      storageKey={`${TOUR_STORAGE_PREFIX}${userId}`}
      autoStart={autoStart}
      replayToken={replayToken}
    />
  );
}
