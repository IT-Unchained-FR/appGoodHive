"use client";

import { useMemo } from "react";

import { useAuth } from "@/app/contexts/AuthContext";
import {
  getConfidentialLockCopy,
  type ConfidentialLockCopy,
  type TalentVerificationStage,
} from "@/lib/auth/confidential-lock";

/**
 * Client-side companion to `getViewerAccess()`. Resolves how far the signed-in
 * viewer is through talent verification so blurred fields can show the right
 * next step instead of a generic "connect your wallet" prompt.
 */
export function useTalentVerificationStage(): {
  isAuthenticated: boolean;
  stage: TalentVerificationStage;
} {
  const { isAuthenticated, user } = useAuth();

  const stage = useMemo<TalentVerificationStage>(() => {
    if (!isAuthenticated || !user) {
      return "none";
    }

    if (user.talent_status === "approved") {
      return "approved";
    }

    // The cookie-seeded user may not carry this flag until /api/auth/me
    // resolves; stay generic rather than guessing wrong.
    if (typeof user.has_talent_profile !== "boolean") {
      return "unknown";
    }

    if (!user.has_talent_profile) {
      return "none";
    }

    if (user.talent_status === "rejected") {
      return "rejected";
    }

    if (user.talent_status === "deferred") {
      return "deferred";
    }

    return "in_review";
  }, [isAuthenticated, user]);

  return { isAuthenticated, stage };
}

export function useConfidentialLockCopy({
  seed,
  subject,
}: {
  seed?: string;
  subject?: "company" | "talent";
} = {}): ConfidentialLockCopy {
  const { isAuthenticated, stage } = useTalentVerificationStage();

  return useMemo(
    () =>
      getConfidentialLockCopy({
        isAuthenticated,
        seed,
        subject,
        talentVerificationStage: stage,
      }),
    [isAuthenticated, seed, stage, subject],
  );
}
