import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import { bulkOperationSchema, validateInput } from "@/app/lib/admin-validations";

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

    // Approve talents in parallel
    await Promise.all(
      userIds.map(async (userId: string) => {
        // Update talent approval
        await sql`
          UPDATE goodhive.talents
          SET approved = true, talent = true, inreview = false
          WHERE user_id = ${userId}
        `;

        // Update user status based on approval types using safe conditional updates
        const talentStatus = approvalTypes?.talent ? 'approved' : null;
        const mentorStatus = approvalTypes?.mentor ? 'approved' : null;
        const recruiterStatus = approvalTypes?.recruiter ? 'approved' : null;

        // Use CASE statements for conditional updates (safe parameterized approach)
        await sql`
          UPDATE goodhive.users
          SET
            talent_status = COALESCE(${talentStatus}, talent_status),
            mentor_status = COALESCE(${mentorStatus}, mentor_status),
            recruiter_status = COALESCE(${recruiterStatus}, recruiter_status)
          WHERE userid = ${userId}
            AND (${talentStatus} IS NOT NULL
              OR ${mentorStatus} IS NOT NULL
              OR ${recruiterStatus} IS NOT NULL)
        `;
      })
    );

    return new Response(
      JSON.stringify({
        message: `Successfully approved ${userIds.length} talent(s)`,
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

