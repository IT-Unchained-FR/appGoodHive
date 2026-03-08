import { sendEmail } from "@/lib/email/emailService";

export type TalentRole = "talent" | "mentor" | "recruiter";

const ROLE_LABELS: Record<TalentRole, string> = {
  talent: "Talent",
  mentor: "Mentor",
  recruiter: "Recruiter",
};

const formatRoleList = (roles: TalentRole[]) =>
  roles.map((role) => ROLE_LABELS[role]).join(", ");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sendTalentApprovalEmail = async ({
  email,
  firstName,
  approvedRoles,
}: {
  email?: string | null;
  firstName?: string | null;
  approvedRoles: TalentRole[];
}) => {
  if (!email || !approvedRoles.length) return false;

  const roleList = formatRoleList(approvedRoles);
  const safeName = firstName?.trim() || "there";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #92400e;">Great news, ${escapeHtml(safeName)}!</h2>
      <p style="margin: 0 0 12px;">Your GoodHive profile update has been approved.</p>
      <p style="margin: 0 0 12px;"><strong>Approved role(s):</strong> ${escapeHtml(roleList)}</p>
      <p style="margin: 0 0 12px;">You can now continue from your talent profile and start using the approved role capabilities.</p>
      <p style="margin: 20px 0 0; color: #6b7280;">The GoodHive Team 🐝</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Your GoodHive role approval is complete (${roleList})`,
    html,
  });
};

export const sendTalentRejectionEmail = async ({
  email,
  firstName,
  rejectedRoles,
  rejectionReason,
}: {
  email?: string | null;
  firstName?: string | null;
  rejectedRoles: TalentRole[];
  rejectionReason?: string | null;
}) => {
  if (!email || !rejectedRoles.length) return false;

  const roleList = formatRoleList(rejectedRoles);
  const safeName = firstName?.trim() || "there";
  const reasonText = rejectionReason?.trim();

  const reasonBlock = reasonText
    ? `<div style="margin: 16px 0; padding: 14px; border-radius: 10px; background: #fff7ed; border: 1px solid #fed7aa;">
         <p style="margin: 0; font-size: 13px; color: #9a3412; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">Admin feedback</p>
         <p style="margin: 8px 0 0; color: #7c2d12;">${escapeHtml(reasonText)}</p>
       </div>`
    : "";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #991b1b;">Profile update reviewed, ${escapeHtml(safeName)}</h2>
      <p style="margin: 0 0 12px;">Your latest role submission was not approved this time.</p>
      <p style="margin: 0 0 12px;"><strong>Role(s):</strong> ${escapeHtml(roleList)}</p>
      ${reasonBlock}
      <p style="margin: 0;">You can update your profile and submit again anytime.</p>
      <p style="margin: 20px 0 0; color: #6b7280;">The GoodHive Team 🐝</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Update on your GoodHive role review (${roleList})`,
    html,
  });
};
