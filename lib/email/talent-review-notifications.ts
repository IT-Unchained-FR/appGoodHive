import { sendEmail } from "@/lib/email/emailService";
import { getOrCreateReferralLink } from "@/lib/referrals";

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
  userId,
}: {
  email?: string | null;
  firstName?: string | null;
  approvedRoles: TalentRole[];
  userId: string;
}) => {
  if (!email || !approvedRoles.length) return false;

  const roleList = formatRoleList(approvedRoles);
  const safeName = firstName?.trim() || "there";
  const referralLink = await getOrCreateReferralLink(userId);
  const linkedInCopy = `They verified me. Will they verify you? 🐝
Just got accepted into GoodHive.io after a real evaluation interview. A curated hive of Web3 talents where being "in" actually means something - because most applicants don't make it.
No fake profiles. No recruiter spam. Just verified builders.
I passed. Your move: ${referralLink}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #92400e;">You're in - your profile is now live ✅</h2>
      <p style="margin: 0 0 12px;">Hi ${escapeHtml(safeName)},</p>
      <p style="margin: 0 0 12px;">Congrats! You passed the assessment. Your profile is now validated and visible to recruiters on GoodHive.</p>
      <p style="margin: 0 0 12px;">Even better: you now have direct access to GoodHive's clients and can browse all job offers in full detail.</p>
      <p style="margin: 0 0 12px;">Now that your profile is live, you can start receiving mission offers, and your referral link is active. Recommend other talents or clients and earn rewards for it.</p>
      <p style="margin: 0 0 12px;">Keep your referral link handy: each person you refer to the hive means rewards for you, and it is the easiest way to start earning today.</p>
      <p style="margin: 0 0 12px;"><strong>Your referral link:</strong> <a href="${escapeHtml(referralLink)}" style="color: #d97706; font-weight: 700; text-decoration: none;">${escapeHtml(referralLink)}</a></p>
      <p style="margin: 20px 0 8px;"><strong>Want to share the news? Here's a ready-to-post message for LinkedIn:</strong></p>
      <div style="margin: 0 0 16px; padding: 16px; border-radius: 12px; background: #fff7ed; border: 1px solid #fed7aa; white-space: pre-wrap;">${escapeHtml(linkedInCopy)}</div>
      <p style="margin: 0 0 12px;"><strong>Approved role(s):</strong> ${escapeHtml(roleList)}</p>
      <p style="margin: 0;">Looking forward to seeing you land your first mission,</p>
      <p style="margin: 20px 0 0; color: #6b7280;">The GoodHive Team 🐝</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "You're in - your profile is now live ✅",
    html,
  });
};

export const sendTalentRejectionEmail = async ({
  email,
  firstName,
  rejectedRoles,
  rejectionReason: _rejectionReason,
}: {
  email?: string | null;
  firstName?: string | null;
  rejectedRoles: TalentRole[];
  rejectionReason?: string | null;
}) => {
  if (!email || !rejectedRoles.length) return false;

  const roleList = formatRoleList(rejectedRoles);
  const safeName = firstName?.trim() || "there";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #991b1b;">Following up on your GoodHive assessment</h2>
      <p style="margin: 0 0 12px;">Hi ${escapeHtml(safeName)},</p>
      <p style="margin: 0 0 12px;">Thank you sincerely for the time you took for the call, and for your interest in GoodHive.</p>
      <p style="margin: 0 0 12px;">After review, your profile doesn't match our current requirements. GoodHive is currently focused exclusively on Web3 tech talent, and our clients have very specific needs in that space. This isn't a judgment on your value - we'd simply rather be honest with you than leave you wondering.</p>
      <p style="margin: 0 0 12px;">That said, we're planning to open new verticals in the future where your profile would be a much stronger fit. We'd love to stay in touch and reach out when that happens.</p>
      <p style="margin: 0 0 12px;"><strong>Role(s):</strong> ${escapeHtml(roleList)}</p>
      <p style="margin: 0;">We wish you all the best - and who knows, our paths may cross again sooner than you think.</p>
      <p style="margin: 20px 0 0;">Take care,</p>
      <p style="margin: 20px 0 0; color: #6b7280;">The GoodHive Team 🐝</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Following up on your GoodHive assessment",
    html,
  });
};

export const sendTalentDeferredEmail = async ({
  email,
  firstName,
}: {
  email?: string | null;
  firstName?: string | null;
}) => {
  if (!email) return false;

  const safeName = firstName?.trim() || "there";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #92400e;">We're keeping your profile warm</h2>
      <p style="margin: 0 0 12px;">Hi ${escapeHtml(safeName)},</p>
      <p style="margin: 0 0 12px;">Thanks for your time during our call, and for your interest in GoodHive.</p>
      <p style="margin: 0 0 12px;">Your profile is on the right track, but not yet aligned with our current requirements. Feel free to come back to us in ~3 months and in the meantime, don't hesitate to ask us for advice on which skills to develop.</p>
      <p style="margin: 0;">Keep going,</p>
      <p style="margin: 20px 0 0; color: #6b7280;">The GoodHive Team 🐝</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "We're keeping your profile warm",
    html,
  });
};
