import sql from "@/lib/db";

type ViewerApproval = {
  isApprovedTalent: boolean;
  isApprovedCompany: boolean;
  isApproved: boolean;
};

export type ViewerAccess = ViewerApproval & {
  isAuthenticated: boolean;
  tier: "public" | "registered" | "approved";
};

const notApproved: ViewerApproval = {
  isApprovedTalent: false,
  isApprovedCompany: false,
  isApproved: false,
};

// null when the viewer has no users row.
async function loadViewerApproval(viewerUserId: string): Promise<ViewerApproval | null> {
  const rows = await sql<
    { talent_status: string | null; recruiter_status: string | null; has_approved_company: boolean }[]
  >`
    SELECT
      u.talent_status,
      u.recruiter_status,
      EXISTS(
        SELECT 1 FROM goodhive.companies c
        WHERE c.user_id = u.userid AND c.approved = true
      ) AS has_approved_company
    FROM goodhive.users u
    WHERE u.userid = ${viewerUserId}
  `;

  if (rows.length === 0) return null;

  const isApprovedTalent = rows[0].talent_status === "approved";
  // An approved company profile counts even without recruiter access
  // (matches canViewConfidentialInfo in lib/auth/viewer-access.ts).
  const isApprovedCompany =
    rows[0].recruiter_status === "approved" || rows[0].has_approved_company;

  return {
    isApprovedTalent,
    isApprovedCompany,
    isApproved: isApprovedTalent || isApprovedCompany,
  };
}

export async function getViewerApproval(
  viewerUserId?: string | null,
): Promise<ViewerApproval> {
  if (!viewerUserId) return notApproved;
  return (await loadViewerApproval(viewerUserId)) ?? notApproved;
}

export async function getViewerAccess(
  viewerUserId?: string | null,
): Promise<ViewerAccess> {
  const approval = viewerUserId ? await loadViewerApproval(viewerUserId) : null;

  if (!approval) {
    return { ...notApproved, isAuthenticated: false, tier: "public" };
  }

  return {
    ...approval,
    isAuthenticated: true,
    tier: approval.isApproved ? "approved" : "registered",
  };
}

export function maskName(firstName?: string | null, lastName?: string | null) {
  const safeFirst = (firstName || "").trim();
  const safeLast = (lastName || "").trim();

  const scramble = (value: string) => {
    if (!value) return "";
    const first = value[0];
    const rest = value.slice(1).replace(/[A-Za-z0-9]/g, "*");
    return `${first}${rest || "*"}`;
  };

  return {
    firstName: safeFirst ? scramble(safeFirst) : "Talent",
    lastName: safeLast ? scramble(safeLast) : "Professional",
  };
}

export function maskInitials(firstName?: string | null, lastName?: string | null) {
  const safeFirst = (firstName || "").trim();
  const safeLast = (lastName || "").trim();
  const firstInitial = safeFirst ? `${safeFirst[0]}.` : "T.";
  const lastInitial = safeLast ? `${safeLast[0]}.` : "P.";
  return {
    firstName: firstInitial,
    lastName: lastInitial,
  };
}

export function formatNameForTier(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  tier: ViewerAccess["tier"],
) {
  if (tier === "approved") {
    return { firstName: firstName || "", lastName: lastName || "" };
  }

  if (tier === "registered") {
    return maskName(firstName, lastName);
  }

  return maskInitials(firstName, lastName);
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const maskToken = (value: string) =>
  value.replace(/[A-Za-z0-9]/g, "*");

export function maskNameInText(
  text?: string | null,
  firstName?: string | null,
  lastName?: string | null,
) {
  if (!text) return text || "";

  const safeFirst = (firstName || "").trim();
  const safeLast = (lastName || "").trim();
  const fullName = `${safeFirst} ${safeLast}`.trim();

  const patterns = [fullName, safeFirst, safeLast].filter(
    (value) => value.length > 1,
  );

  return patterns.reduce((result, value) => {
    const regex = new RegExp(`\\b${escapeRegExp(value)}\\b`, "gi");
    return result.replace(regex, (match) => maskToken(match));
  }, text);
}
