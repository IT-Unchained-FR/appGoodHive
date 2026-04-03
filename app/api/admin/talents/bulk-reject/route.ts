import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";
import { bulkOperationSchema, validateInput } from "@/app/lib/admin-validations";
import {
  sendTalentRejectionEmail,
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

    const { userIds, rejectionReason } = validation.data;
    const normalizedReason =
      rejectionReason?.trim() || "Your submission did not meet review requirements.";

    // Batch update talents - single query for all users
    await sql`
      UPDATE goodhive.talents
      SET inreview = false
      WHERE user_id = ANY(${userIds})
    `;

    const users = await sql<{
      userid: string;
      email: string | null;
      first_name: string | null;
      talent: boolean | null;
      mentor: boolean | null;
      recruiter: boolean | null;
      talent_status: string | null;
      mentor_status: string | null;
      recruiter_status: string | null;
    }[]>`
      SELECT
        users.userid,
        users.email,
        talents.first_name,
        talents.talent,
        talents.mentor,
        talents.recruiter,
        users.talent_status,
        users.mentor_status,
        users.recruiter_status
      FROM goodhive.users
      LEFT JOIN goodhive.talents ON talents.user_id = users.userid
      WHERE users.userid = ANY(${userIds})
    `;

    for (const user of users) {
      const rejectedRoles = ([
        user.talent && user.talent_status !== "approved" ? "talent" : null,
        user.mentor && user.mentor_status !== "approved" ? "mentor" : null,
        user.recruiter && user.recruiter_status !== "approved" ? "recruiter" : null,
      ].filter(Boolean) as TalentRole[]);

      await sql`
        UPDATE goodhive.users
        SET
          talent_status = CASE
            WHEN ${rejectedRoles.includes("talent")} THEN 'rejected'
            ELSE talent_status
          END,
          mentor_status = CASE
            WHEN ${rejectedRoles.includes("mentor")} THEN 'rejected'
            ELSE mentor_status
          END,
          recruiter_status = CASE
            WHEN ${rejectedRoles.includes("recruiter")} THEN 'rejected'
            ELSE recruiter_status
          END,
          talent_status_reason = CASE
            WHEN ${rejectedRoles.includes("talent")} THEN ${normalizedReason}
            ELSE talent_status_reason
          END,
          mentor_status_reason = CASE
            WHEN ${rejectedRoles.includes("mentor")} THEN ${normalizedReason}
            ELSE mentor_status_reason
          END,
          recruiter_status_reason = CASE
            WHEN ${rejectedRoles.includes("recruiter")} THEN ${normalizedReason}
            ELSE recruiter_status_reason
          END
        WHERE userid = ${user.userid}
      `;

      if (user.email && rejectedRoles.length) {
        await sendTalentRejectionEmail({
          email: user.email,
          firstName: user.first_name,
          rejectedRoles,
          rejectionReason: normalizedReason,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Successfully rejected ${userIds.length} talent(s)`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk reject error:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error rejecting talents" }),
      { status: 500 }
    );
  }
}
