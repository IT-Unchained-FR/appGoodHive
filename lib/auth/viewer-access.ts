import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import type { TalentVerificationStage } from "@/lib/auth/confidential-lock";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";

export type { TalentVerificationStage };

export interface ViewerAccess {
  canViewConfidentialInfo: boolean;
  /** Owns a company row with `approved = true`. */
  hasApprovedCompany: boolean;
  hasTalentProfile: boolean;
  isAdmin: boolean;
  isApprovedTalent: boolean;
  /**
   * `users.recruiter_status = 'approved'` — the recruiter/company-side role the
   * talent-facing UI checks. Tracked separately from `hasApprovedCompany`
   * because the two are set by different flows and do not always agree.
   */
  isApprovedRecruiter: boolean;
  isAuthenticated: boolean;
  talentStatus: string | null;
  talentVerificationStage: TalentVerificationStage;
  userId: string | null;
}

const anonymousAccess = (isAdmin: boolean): ViewerAccess => ({
  canViewConfidentialInfo: isAdmin,
  hasApprovedCompany: false,
  hasTalentProfile: false,
  isAdmin,
  isApprovedTalent: false,
  isApprovedRecruiter: false,
  isAuthenticated: false,
  talentStatus: null,
  talentVerificationStage: "none",
  userId: null,
});

export function resolveTalentVerificationStage({
  hasTalentProfile,
  talentStatus,
}: {
  hasTalentProfile: boolean;
  talentStatus: string | null;
}): TalentVerificationStage {
  if (talentStatus === "approved") {
    return "approved";
  }

  if (!hasTalentProfile) {
    return "none";
  }

  if (talentStatus === "rejected") {
    return "rejected";
  }

  if (talentStatus === "deferred") {
    return "deferred";
  }

  return "in_review";
}

function readAdminCookie(): boolean {
  const adminToken = cookies().get("admin_token")?.value ?? null;

  if (!adminToken) {
    return false;
  }

  try {
    jwt.verify(adminToken, getAdminJWTSecret());
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Single source of truth for "is this viewer allowed to see company identity,
 * contact details, and other confidential job data?".
 *
 * Confidential data unlocks for admins, approved talents, and users who own an
 * approved company profile. Everyone else — including signed-in talents whose
 * profile is still awaiting review — gets the redacted view.
 */
export async function getViewerAccess(): Promise<ViewerAccess> {
  const isAdmin = readAdminCookie();
  const sessionUser = await getSessionUser();
  const viewerUserId = sessionUser?.user_id ?? null;

  if (!viewerUserId) {
    return anonymousAccess(isAdmin);
  }

  const viewerRows = await sql<
    {
      approved_company_count: number;
      has_talent_profile: boolean;
      recruiter_status: string | null;
      talent_status: string | null;
    }[]
  >`
    SELECT
      u.talent_status,
      u.recruiter_status,
      (
        SELECT COUNT(*)::int
        FROM goodhive.companies c
        WHERE c.user_id = ${viewerUserId}::uuid
          AND c.approved = true
      ) AS approved_company_count,
      EXISTS(
        SELECT 1
        FROM goodhive.talents t
        WHERE t.user_id = ${viewerUserId}::uuid
      ) AS has_talent_profile
    FROM goodhive.users u
    WHERE u.userid = ${viewerUserId}::uuid
    LIMIT 1
  `;

  const viewer = viewerRows[0];
  const hasTalentProfile = viewer?.has_talent_profile === true;
  const talentStatus = viewer?.talent_status ?? null;
  const isApprovedTalent = hasTalentProfile && talentStatus === "approved";
  const hasApprovedCompany = Number(viewer?.approved_company_count || 0) > 0;
  const isApprovedRecruiter = viewer?.recruiter_status === "approved";

  return {
    canViewConfidentialInfo: isAdmin || isApprovedTalent || hasApprovedCompany,
    hasApprovedCompany,
    hasTalentProfile,
    isAdmin,
    isApprovedTalent,
    isApprovedRecruiter,
    isAuthenticated: true,
    talentStatus,
    talentVerificationStage: resolveTalentVerificationStage({
      hasTalentProfile,
      talentStatus,
    }),
    userId: viewerUserId,
  };
}
