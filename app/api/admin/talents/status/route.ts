import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import {
  sendTalentApprovalEmail,
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

type TalentStatus = "approved" | "in_review" | "rejected" | "deferred" | "pending";

export async function POST(req: NextRequest) {
  try {
    await verifyAdminToken();
    const body = await req.json();

    const userId = body?.userId as string | undefined;
    const status = body?.status as TalentStatus | undefined;
    const rejectionReason = (body?.rejectionReason as string | undefined)?.trim();

    if (!userId || !status) {
      return new Response(
        JSON.stringify({ message: "User ID and status are required" }),
        { status: 400 },
      );
    }

    if (!["approved", "in_review", "rejected", "deferred", "pending"].includes(status)) {
      return new Response(
        JSON.stringify({ message: "Invalid status" }),
        { status: 400 },
      );
    }

    const userRows = await sql<{
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
      WHERE users.userid = ${userId}
      LIMIT 1
    `;
    const user = userRows[0];

    if (!user) {
      return new Response(
        JSON.stringify({ message: "User not found" }),
        { status: 404 },
      );
    }

    const selectedRoles = ([
      user.talent ? "talent" : null,
      user.mentor ? "mentor" : null,
      user.recruiter ? "recruiter" : null,
    ].filter(Boolean) as TalentRole[]);

    const reviewableRoles = selectedRoles.filter((role) => {
      if (role === "talent") return user.talent_status !== "approved";
      if (role === "mentor") return user.mentor_status !== "approved";
      return user.recruiter_status !== "approved";
    });

    if (status === "approved") {
      await sql`
        UPDATE goodhive.talents
        SET approved = true, inreview = false
        WHERE user_id = ${userId}
      `;
      await sql`
        UPDATE goodhive.users
        SET
          talent_status = CASE WHEN ${selectedRoles.includes("talent")} THEN 'approved' ELSE talent_status END,
          mentor_status = CASE WHEN ${selectedRoles.includes("mentor")} THEN 'approved' ELSE mentor_status END,
          recruiter_status = CASE WHEN ${selectedRoles.includes("recruiter")} THEN 'approved' ELSE recruiter_status END,
          talent_status_reason = CASE WHEN ${selectedRoles.includes("talent")} THEN NULL ELSE talent_status_reason END,
          mentor_status_reason = CASE WHEN ${selectedRoles.includes("mentor")} THEN NULL ELSE mentor_status_reason END,
          recruiter_status_reason = CASE WHEN ${selectedRoles.includes("recruiter")} THEN NULL ELSE recruiter_status_reason END
        WHERE userid = ${userId}
      `;
      for (const role of selectedRoles) {
        await sql`
          UPDATE goodhive.users
          SET approved_roles = CASE
            WHEN EXISTS (
              SELECT 1
              FROM unnest(COALESCE(approved_roles, ARRAY[]::jsonb[])) item
              WHERE item->>'role' = ${role}
            ) THEN approved_roles
            ELSE array_append(
              COALESCE(approved_roles, ARRAY[]::jsonb[]),
              jsonb_build_object('role', ${role}::TEXT, 'approval_time', CURRENT_TIMESTAMP)
            )
          END
          WHERE userid = ${userId}
        `;
      }
      if (user.email && selectedRoles.length) {
        await sendTalentApprovalEmail({
          email: user.email,
          firstName: user.first_name,
          approvedRoles: selectedRoles,
        });
      }
    } else if (status === "in_review" || status === "pending") {
      await sql`
        UPDATE goodhive.talents
        SET inreview = true
        WHERE user_id = ${userId}
      `;
      await sql`
        UPDATE goodhive.users
        SET
          talent_status = CASE WHEN ${reviewableRoles.includes("talent")} THEN 'pending' ELSE talent_status END,
          mentor_status = CASE WHEN ${reviewableRoles.includes("mentor")} THEN 'pending' ELSE mentor_status END,
          recruiter_status = CASE WHEN ${reviewableRoles.includes("recruiter")} THEN 'pending' ELSE recruiter_status END,
          talent_status_reason = CASE WHEN ${reviewableRoles.includes("talent")} THEN NULL ELSE talent_status_reason END,
          mentor_status_reason = CASE WHEN ${reviewableRoles.includes("mentor")} THEN NULL ELSE mentor_status_reason END,
          recruiter_status_reason = CASE WHEN ${reviewableRoles.includes("recruiter")} THEN NULL ELSE recruiter_status_reason END
        WHERE userid = ${userId}
      `;
    } else if (status === "deferred") {
      await sql`
        UPDATE goodhive.talents
        SET inreview = false
        WHERE user_id = ${userId}
      `;
      await sql`
        UPDATE goodhive.users
        SET
          talent_status = CASE WHEN ${reviewableRoles.includes("talent")} THEN 'deferred' ELSE talent_status END,
          mentor_status = CASE WHEN ${reviewableRoles.includes("mentor")} THEN 'deferred' ELSE mentor_status END,
          recruiter_status = CASE WHEN ${reviewableRoles.includes("recruiter")} THEN 'deferred' ELSE recruiter_status END
        WHERE userid = ${userId}
      `;
    } else {
      await sql`
        UPDATE goodhive.talents
        SET inreview = false
        WHERE user_id = ${userId}
      `;
      await sql`
        UPDATE goodhive.users
        SET
          talent_status = CASE WHEN ${reviewableRoles.includes("talent")} THEN 'rejected' ELSE talent_status END,
          mentor_status = CASE WHEN ${reviewableRoles.includes("mentor")} THEN 'rejected' ELSE mentor_status END,
          recruiter_status = CASE WHEN ${reviewableRoles.includes("recruiter")} THEN 'rejected' ELSE recruiter_status END,
          talent_status_reason = CASE WHEN ${reviewableRoles.includes("talent")} THEN ${rejectionReason || "Profile submission was rejected by admin review."} ELSE talent_status_reason END,
          mentor_status_reason = CASE WHEN ${reviewableRoles.includes("mentor")} THEN ${rejectionReason || "Profile submission was rejected by admin review."} ELSE mentor_status_reason END,
          recruiter_status_reason = CASE WHEN ${reviewableRoles.includes("recruiter")} THEN ${rejectionReason || "Profile submission was rejected by admin review."} ELSE recruiter_status_reason END
        WHERE userid = ${userId}
      `;
      if (user.email && reviewableRoles.length) {
        await sendTalentRejectionEmail({
          email: user.email,
          firstName: user.first_name,
          rejectedRoles: reviewableRoles,
          rejectionReason:
            rejectionReason || "Profile submission was rejected by admin review.",
        });
      }
    }

    return new Response(
      JSON.stringify({ message: "Talent status updated" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Update talent status error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error updating talent status" }),
      { status: 500 },
    );
  }
}
