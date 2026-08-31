import type { TalentVerificationStage } from "@/lib/auth/confidential-lock";
import { resolveConfidentialLockReason } from "@/lib/auth/confidential-lock";

export interface ConfidentialAccessNotice {
  ctaHref: string | null;
  ctaLabel: string | null;
  description: string;
  steps: string[];
  title: string;
}

const TALENT_PROFILE_HREF = "/talents/my-profile";

/**
 * Full-size "here's how to unlock company details" notice. Same decision tree
 * as the inline blur tooltip, but with the explicit step-by-step the user needs
 * on a listing page.
 */
/**
 * What is being withheld. Only changes wording — the gate itself is identical,
 * so a single verification unlocks every subject.
 */
export type ConfidentialAccessSubject = "company" | "talent" | "contact";

const SUBJECT_COPY: Record<
  ConfidentialAccessSubject,
  { hiddenThing: string; lockedTitle: string; unlockLine: string }
> = {
  company: {
    hiddenThing: "Company names, logos, and contact details",
    lockedTitle: "Company details are hidden",
    unlockLine: "company details unlock",
  },
  talent: {
    hiddenThing: "Talent names, contact details, and CVs",
    lockedTitle: "Talent details are hidden",
    unlockLine: "talent details unlock",
  },
  contact: {
    hiddenThing: "Direct requests and messaging",
    lockedTitle: "Sending requests is for verified members",
    unlockLine: "you can send direct requests",
  },
};

export function getConfidentialAccessNotice({
  isAuthenticated,
  subject = "company",
  talentVerificationStage,
}: {
  isAuthenticated: boolean;
  subject?: ConfidentialAccessSubject;
  talentVerificationStage: TalentVerificationStage;
}): ConfidentialAccessNotice {
  const reason = resolveConfidentialLockReason({
    isAuthenticated,
    talentVerificationStage,
  });
  const { hiddenThing, lockedTitle, unlockLine } = SUBJECT_COPY[subject];

  if (reason === "connect") {
    return {
      ctaHref: null,
      ctaLabel: null,
      description: `${hiddenThing} stay hidden until you have a verified GoodHive profile.`,
      steps: [
        "Connect your wallet to create your GoodHive account.",
        "Fill in your profile and submit it for verification.",
        `Once our team approves you, ${unlockLine} everywhere.`,
      ],
      title: lockedTitle,
    };
  }

  if (reason === "complete_profile") {
    return {
      ctaHref: TALENT_PROFILE_HREF,
      ctaLabel: "Go to my profile",
      description: `You're signed in, but you don't have a verified profile yet. ${hiddenThing} unlock once you're verified.`,
      steps: [
        "Go to your profile page and fill in every required section.",
        "Submit your profile for verification.",
        `Our team reviews it, and ${unlockLine} as soon as you're approved.`,
      ],
      title: "Complete your profile to continue",
    };
  }

  if (reason === "rejected") {
    return {
      ctaHref: TALENT_PROFILE_HREF,
      ctaLabel: "Update my profile",
      description: `Your profile needs changes before it can be approved, so ${hiddenThing.toLowerCase()} stay hidden for now.`,
      steps: [
        "Open your profile page and review the feedback from our team.",
        "Update the missing or incorrect details and resubmit.",
        `${unlockLine.charAt(0).toUpperCase()}${unlockLine.slice(1)} as soon as you're approved.`,
      ],
      title: "Your profile needs an update",
    };
  }

  if (reason === "verify") {
    return {
      ctaHref: TALENT_PROFILE_HREF,
      ctaLabel: "Go to my profile",
      description: `${hiddenThing} unlock once your GoodHive profile is verified.`,
      steps: [
        "Make sure your profile is complete.",
        "Submit it for verification if you haven't already.",
        `${unlockLine.charAt(0).toUpperCase()}${unlockLine.slice(1)} as soon as our team approves you.`,
      ],
      title: "Verified profiles only",
    };
  }

  return {
    ctaHref: TALENT_PROFILE_HREF,
    ctaLabel: "View my profile",
    description: `Thanks for submitting your profile — our team is reviewing it. Please keep patience; ${unlockLine} the moment you're approved.`,
    steps: [
      "Your profile has been submitted for verification.",
      "Our team is reviewing your application.",
      `You'll get access as soon as you're approved.`,
    ],
    title: "Verification in progress",
  };
}
