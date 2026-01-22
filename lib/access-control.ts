import sql from "@/lib/db";

type ViewerApproval = {
  isApprovedTalent: boolean;
  isApprovedCompany: boolean;
  isApproved: boolean;
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

export function maskName(firstName?: string | null, lastName?: string | null) {
  const safeFirst = (firstName || "").trim();
  const safeLast = (lastName || "").trim();

  return {
    firstName: safeFirst ? `${safeFirst[0]}.` : "Talent",
    lastName: safeLast ? `${safeLast[0]}.` : "Professional",
  };
}
