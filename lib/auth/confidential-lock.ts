/**
 * Shared copy for every place where confidential company/talent data is
 * blurred out. Kept free of server-only imports so client components can use
 * it directly.
 *
 * The important rule: a viewer who is already signed in must never be told to
 * "connect your wallet". They need the verification path instead.
 */
export type TalentVerificationStage =
  | "none"
  | "in_review"
  | "approved"
  | "deferred"
  | "rejected"
  /** Signed in, but we have not resolved the profile state yet. */
  | "unknown";

export type ConfidentialLockReason =
  | "connect"
  | "complete_profile"
  | "in_review"
  | "rejected"
  | "verify";

export interface ConfidentialLockCopy {
  /** Blurred inline text rendered in place of the hidden value. */
  blurredLabel: string;
  ctaHref: string | null;
  ctaLabel: string | null;
  description: string;
  reason: ConfidentialLockReason;
  title: string;
}

const TALENT_PROFILE_HREF = "/talents/my-profile";

const connectPlaceholders = [
  "Connect Wallet to see",
  "Connect to view",
  "Connect to reveal",
  "Connect to see company",
  "Connect Wallet to view",
  "Connect Wallet to reveal",
  "Connect to see",
  "Connect Wallet here",
];

const verifyPlaceholders = [
  "Get verified to see",
  "Verify profile to view",
  "Unlock after approval",
  "Verified talents only",
];

const reviewPlaceholders = [
  "Unlocks after review",
  "Pending verification",
  "In review — hidden",
  "Verified talents only",
];

const pickFromSeed = (options: string[], seed: string) => {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return options[Math.abs(hash) % options.length];
};

export function resolveConfidentialLockReason({
  isAuthenticated,
  talentVerificationStage,
}: {
  isAuthenticated: boolean;
  talentVerificationStage: TalentVerificationStage;
}): ConfidentialLockReason {
  if (!isAuthenticated) {
    return "connect";
  }

  if (talentVerificationStage === "unknown") {
    return "verify";
  }

  if (talentVerificationStage === "rejected") {
    return "rejected";
  }

  if (talentVerificationStage === "none") {
    return "complete_profile";
  }

  // "in_review", "deferred", and the unexpected "approved"-but-still-locked
  // case (e.g. an approved talent viewing a field gated for another reason)
  // all resolve to "your submission is with our team".
  return "in_review";
}

export function getConfidentialLockCopy({
  isAuthenticated,
  seed = "company",
  subject = "company",
  talentVerificationStage,
}: {
  isAuthenticated: boolean;
  seed?: string;
  /** What is being hidden — used to keep the copy readable. */
  subject?: "company" | "talent";
  talentVerificationStage: TalentVerificationStage;
}): ConfidentialLockCopy {
  const reason = resolveConfidentialLockReason({
    isAuthenticated,
    talentVerificationStage,
  });
  const subjectLabel = subject === "talent" ? "talent" : "company";

  if (reason === "connect") {
    return {
      blurredLabel: pickFromSeed(connectPlaceholders, seed),
      ctaHref: null,
      ctaLabel: "Connect Wallet",
      description: `Connect your wallet to view this ${subjectLabel}.`,
      reason,
      title: "Connect to reveal",
    };
  }

  if (reason === "complete_profile") {
    return {
      blurredLabel: pickFromSeed(verifyPlaceholders, seed),
      ctaHref: TALENT_PROFILE_HREF,
      ctaLabel: "Go to my profile",
      description: `Fill in your talent profile and submit it for verification to unlock ${subjectLabel} details.`,
      reason,
      title: "Complete your profile to unlock",
    };
  }

  if (reason === "verify") {
    return {
      blurredLabel: pickFromSeed(verifyPlaceholders, seed),
      ctaHref: TALENT_PROFILE_HREF,
      ctaLabel: "Go to my profile",
      description: `${
        subjectLabel === "talent" ? "Talent" : "Company"
      } details unlock once your GoodHive profile is verified.`,
      reason,
      title: "Verified profiles only",
    };
  }

  if (reason === "rejected") {
    return {
      blurredLabel: pickFromSeed(verifyPlaceholders, seed),
      ctaHref: TALENT_PROFILE_HREF,
      ctaLabel: "Update my profile",
      description: `Your profile needs changes before it can be approved. Update it and resubmit to unlock ${subjectLabel} details.`,
      reason,
      title: "Verification needs an update",
    };
  }

  return {
    blurredLabel: pickFromSeed(reviewPlaceholders, seed),
    ctaHref: TALENT_PROFILE_HREF,
    ctaLabel: "View my profile",
    description:
      "Your profile is with our team for verification. Hang tight — this unlocks as soon as you're approved.",
    reason,
    title: "Verification in progress",
  };
}
