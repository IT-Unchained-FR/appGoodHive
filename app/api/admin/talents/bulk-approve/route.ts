import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import { bulkOperationSchema, validateInput } from "@/app/lib/admin-validations";
import {
  sendTalentApprovalEmail,
  type TalentRole,
} from "@/lib/email/talent-review-notifications";

export const dynamic = "force-dynamic";

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verify(token, getAdminJWTSecret()) as { role: string };
    if (decoded.role !== "admin") {
      throw new Error("Not authorized");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export async function POST(req: NextRequest) {
  try {
    await verifyAdminToken();
    const body = await req.json();

    // Validate input
    const validation = validateInput(bulkOperationSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          message: "Validation failed",
          errors: validation.errors,
        }),
        { status: 400 }
      );
    }

    const { userIds, approvalTypes } = validation.data;
    const selectedRoles = (["talent", "mentor", "recruiter"] as const).filter(
      (role) => Boolean(approvalTypes?.[role]),
    ) as TalentRole[];

    if (!selectedRoles.length) {
      return new Response(
        JSON.stringify({ message: "Select at least one role to approve" }),
        { status: 400 },
      );
    }

    // Batch update talents - single query for all users
    await sql`
      UPDATE goodhive.talents
      SET
        approved = true,
        talent = CASE WHEN ${Boolean(approvalTypes?.talent)} THEN true ELSE talent END,
        mentor = CASE WHEN ${Boolean(approvalTypes?.mentor)} THEN true ELSE mentor END,
        recruiter = CASE WHEN ${Boolean(approvalTypes?.recruiter)} THEN true ELSE recruiter END,
        inreview = false
      WHERE user_id = ANY(${userIds})
    `;

    // Batch update user statuses - single query for all users
    await sql`
      UPDATE goodhive.users
      SET
        talent_status = CASE
          WHEN ${Boolean(approvalTypes?.talent)} THEN 'approved'
          ELSE talent_status
        END,
        mentor_status = CASE
          WHEN ${Boolean(approvalTypes?.mentor)} THEN 'approved'
          ELSE mentor_status
        END,
        recruiter_status = CASE
          WHEN ${Boolean(approvalTypes?.recruiter)} THEN 'approved'
          ELSE recruiter_status
        END,
        talent_status_reason = CASE
          WHEN ${Boolean(approvalTypes?.talent)} THEN NULL
          ELSE talent_status_reason
        END,
        mentor_status_reason = CASE
          WHEN ${Boolean(approvalTypes?.mentor)} THEN NULL
          ELSE mentor_status_reason
        END,
        recruiter_status_reason = CASE
          WHEN ${Boolean(approvalTypes?.recruiter)} THEN NULL
          ELSE recruiter_status_reason
        END
      WHERE userid = ANY(${userIds})
    `;

    const users = await sql<{
      userid: string;
      email: string | null;
      approved_roles: Array<{ role: string }>;
      first_name: string | null;
    }[]>`
      SELECT users.userid, users.email, users.approved_roles, talents.first_name
      FROM goodhive.users
      LEFT JOIN goodhive.talents ON talents.user_id = users.userid
      WHERE users.userid = ANY(${userIds})
    `;

    for (const user of users) {
      for (const role of selectedRoles) {
        if (!user.approved_roles?.some((entry) => entry.role === role)) {
          await sql`
            UPDATE goodhive.users
            SET approved_roles = array_append(
              COALESCE(approved_roles, ARRAY[]::jsonb[]),
              jsonb_build_object('role', ${role}::TEXT, 'approval_time', CURRENT_TIMESTAMP)
            )
            WHERE userid = ${user.userid}
          `;
        }
      }
    }

    await Promise.all(
      users
        .filter((user) => Boolean(user.email))
        .map((user) =>
          sendTalentApprovalEmail({
            email: user.email,
            firstName: user.first_name,
            approvedRoles: selectedRoles,
          }),
        ),
    );

    return new Response(
      JSON.stringify({
        message: `Successfully approved ${userIds.length} talent(s)`,
        roles: selectedRoles,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk approve error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error approving talents" }),
      { status: 500 }
    );
  }
}
