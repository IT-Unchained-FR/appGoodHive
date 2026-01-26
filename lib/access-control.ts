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

export async function getViewerApproval(
  viewerUserId?: string | null,
): Promise<ViewerApproval> {
  if (!viewerUserId) {
    return { isApprovedTalent: false, isApprovedCompany: false, isApproved: false };
  }

  const rows = await sql`
    SELECT talent_status, recruiter_status
    FROM goodhive.users
    WHERE userid = ${viewerUserId}
  `;

  if (rows.length === 0) {
    return { isApprovedTalent: false, isApprovedCompany: false, isApproved: false };
  }

  const isApprovedTalent = rows[0].talent_status === "approved";
  const isApprovedCompany = rows[0].recruiter_status === "approved";

  return {
    isApprovedTalent,
    isApprovedCompany,
    isApproved: isApprovedTalent || isApprovedCompany,
  };
}

export async function getViewerAccess(
  viewerUserId?: string | null,
): Promise<ViewerAccess> {
  if (!viewerUserId) {
    return {
      isApprovedTalent: false,
      isApprovedCompany: false,
      isApproved: false,
      isAuthenticated: false,
      tier: "public",
    };
  }

  const rows = await sql`
    SELECT talent_status, recruiter_status
    FROM goodhive.users
    WHERE userid = ${viewerUserId}
  `;

  if (rows.length === 0) {
    return {
      isApprovedTalent: false,
      isApprovedCompany: false,
      isApproved: false,
      isAuthenticated: false,
      tier: "public",
    };
  }

  const isApprovedTalent = rows[0].talent_status === "approved";
  const isApprovedCompany = rows[0].recruiter_status === "approved";
  const isApproved = isApprovedTalent || isApprovedCompany;
  const tier: ViewerAccess["tier"] = isApproved ? "approved" : "registered";

  return {
    isApprovedTalent,
    isApprovedCompany,
    isApproved,
    isAuthenticated: true,
    tier,
  };
}

export function maskName(firstName?: string | null, lastName?: string | null) {
  const safeFirst = (firstName || "").trim();
  const safeLast = (lastName || "").trim();

  return {
    firstName: safeFirst ? `${safeFirst[0]}.` : "Talent",
    lastName: safeLast ? `${safeLast[0]}.` : "Professional",
  };
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
