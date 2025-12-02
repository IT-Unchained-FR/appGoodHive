import { NextRequest } from "next/server";
import sql from "@/lib/db";
import { requireAdminAuth } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify admin token
    const authError = requireAdminAuth(request);
    if (authError) return authError;

    // 2. Validate userId
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ message: "User ID is required" }),
        { status: 400 }
      );
    }

    // 3. Get user's related data counts (for response)
    const talents = await sql`
      SELECT user_id FROM goodhive.talents WHERE user_id = ${id}
    `;

    const companies = await sql`
      SELECT user_id FROM goodhive.companies WHERE user_id = ${id}
    `;

    const companyIds = companies.map((c) => c.user_id);

    let jobs: any[] = [];
    if (companyIds.length > 0) {
      jobs = await sql`
        SELECT id FROM goodhive.job_offers WHERE user_id = ANY(${companyIds})
      `;
    }

    // 4. CASCADE DELETE (order matters for foreign keys)
    // Delete jobs first (depends on companies)
    if (companyIds.length > 0) {
      await sql`
        DELETE FROM goodhive.job_offers WHERE user_id = ANY(${companyIds})
      `;
    }

    // Delete talents and companies (depend on users)
    await sql`DELETE FROM goodhive.talents WHERE user_id = ${id}`;
    await sql`DELETE FROM goodhive.companies WHERE user_id = ${id}`;

    // Finally delete the user
    const result = await sql`
      DELETE FROM goodhive.users WHERE userid = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ message: "User not found" }),
        { status: 404 }
      );
    }

    // 5. Return success with deletion summary
    return new Response(
      JSON.stringify({
        message: "User deleted successfully",
        deleted: {
          talents: talents.length,
          companies: companies.length,
          jobs: jobs.length,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);

    return new Response(
      JSON.stringify({
        message: "Failed to delete user",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
