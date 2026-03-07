import sql from "@/lib/db";
import {
  sendTalentApprovalEmail,
  type TalentRole,
} from "@/lib/email/talent-review-notifications";

export async function POST(request: Request) {
  const { userId, approvalTypes, referral_code } = await request.json();

  try {
    const selectedRoles = (["talent", "mentor", "recruiter"] as const).filter(
      (role) => Boolean(approvalTypes?.[role]),
    ) as TalentRole[];

    if (!userId || !selectedRoles.length) {
      return new Response(
        JSON.stringify({ message: "User ID and at least one role are required" }),
        { status: 400 },
      );
    }

    await sql`
      UPDATE goodhive.talents
      SET
        approved = true,
        talent = CASE WHEN ${Boolean(approvalTypes?.talent)} THEN true ELSE talent END,
        mentor = CASE WHEN ${Boolean(approvalTypes?.mentor)} THEN true ELSE mentor END,
        recruiter = CASE WHEN ${Boolean(approvalTypes?.recruiter)} THEN true ELSE recruiter END,
        inReview = false
      WHERE user_id = ${userId}
    `;

    const updatedUser = await sql`
      UPDATE goodhive.users
      SET 
      talent_status = CASE 
      WHEN ${Boolean(approvalTypes?.talent)} IS TRUE THEN 'approved'
      ELSE talent_status
      END,
      mentor_status = CASE 
      WHEN ${Boolean(approvalTypes?.mentor)} IS TRUE THEN 'approved'
      ELSE mentor_status
      END,
      recruiter_status = CASE 
      WHEN ${Boolean(approvalTypes?.recruiter)} IS TRUE THEN 'approved'
      ELSE recruiter_status
      END,
      talent_status_reason = CASE
      WHEN ${Boolean(approvalTypes?.talent)} IS TRUE THEN NULL
      ELSE talent_status_reason
      END,
      mentor_status_reason = CASE
      WHEN ${Boolean(approvalTypes?.mentor)} IS TRUE THEN NULL
      ELSE mentor_status_reason
      END,
      recruiter_status_reason = CASE
      WHEN ${Boolean(approvalTypes?.recruiter)} IS TRUE THEN NULL
      ELSE recruiter_status_reason
      END
      WHERE userid = ${userId}
      RETURNING *;
    `;

    // Handle adding roles to approved_roles array dynamically
    for (const role of selectedRoles) {
      if (
        !updatedUser[0]?.approved_roles?.some((r: any) => r.role === role)
      ) {
        await sql`
        UPDATE goodhive.users
        SET approved_roles = array_append(approved_roles, jsonb_build_object('role', ${role}::TEXT, 'approval_time', CURRENT_TIMESTAMP))
        WHERE userid = ${userId};
      `;
      }
    }

    // Update referral table to add the approved talent
    if (referral_code)
      await sql`
      UPDATE goodhive.referrals
      SET approved_talents = array_append(approved_talents, ${userId})
      WHERE referral_code = ${referral_code};
    `;

    const userContact = await sql<{
      email: string | null;
      first_name: string | null;
    }[]>`
      SELECT users.email, talents.first_name
      FROM goodhive.users
      LEFT JOIN goodhive.talents ON talents.user_id = users.userid
      WHERE users.userid = ${userId}
      LIMIT 1
    `;
    const contact = userContact[0];

    if (contact?.email) {
      await sendTalentApprovalEmail({
        email: contact.email,
        firstName: contact.first_name,
        approvedRoles: selectedRoles,
      });
    }

    return new Response(
      JSON.stringify({ message: "Approved talent successfully", roles: selectedRoles }),
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ message: "Unable to approve the talent" }),
      {
        status: 500,
      },
    );
  }
}
