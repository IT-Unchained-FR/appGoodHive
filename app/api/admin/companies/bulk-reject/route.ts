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

    const { userIds, rejectionReason } = validation.data;

    // Batch update companies - single query for all users
    await sql`
      UPDATE goodhive.companies
      SET approved = false, inreview = false
      WHERE user_id = ANY(${userIds})
    `;

    // Batch update user statuses - single query for all users
    await sql`
      UPDATE goodhive.users
      SET recruiter_status = 'rejected'
      WHERE userid = ANY(${userIds})
    `;

    // TODO: Store rejection reason in audit log or separate table
    // rejectionReason is validated if provided but not yet stored

    return new Response(
      JSON.stringify({
        message: `Successfully rejected ${userIds.length} company(ies)`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk reject error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error rejecting companies" }),
      { status: 500 }
    );
  }
}

