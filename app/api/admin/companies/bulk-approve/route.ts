import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";
import { bulkOperationSchema, validateInput } from "@/app/lib/admin-validations";
import { notifyCompanyReviewOutcome } from "@/lib/email/company-review";
import { logAdminAction } from "@/app/lib/admin-audit";

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

    const { userIds } = validation.data;

    // Only companies that weren't approved yet get an email
    const newlyApproved = await sql<{ user_id: string }[]>`
      SELECT user_id FROM goodhive.companies
      WHERE user_id = ANY(${userIds}) AND approved IS NOT TRUE
    `;

    // Batch update companies - single query for all users
    await sql`
      UPDATE goodhive.companies
      SET approved = true, inreview = false, published = true
      WHERE user_id = ANY(${userIds})
    `;

    // Batch update user recruiter statuses - single query for all users
    await sql`
      UPDATE goodhive.users
      SET recruiter_status = 'approved'
      WHERE userid = ANY(${userIds})
    `;

    await notifyCompanyReviewOutcome({
      userIds: newlyApproved.map((row) => row.user_id),
      outcome: "approved",
    });

    await logAdminAction({ action: "company.approved", targetType: "company", targetId: userIds, details: { bulk: true } });

    return new Response(
      JSON.stringify({
        message: `Successfully approved ${userIds.length} company(ies)`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk approve error:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error approving companies" }),
      { status: 500 }
    );
  }
}
