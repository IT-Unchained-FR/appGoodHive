import { NextRequest } from "next/server";
import sql from "@/lib/db";
import { requireAdminAuth } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin token
    const authError = requireAdminAuth(request);
    if (authError) return authError;

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ message: "User ID is required" }),
        { status: 400 }
      );
    }

    // Get counts of related data
    const [talents, companies] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM goodhive.talents WHERE user_id = ${id}`,
      sql`SELECT COUNT(*) as count FROM goodhive.companies WHERE user_id = ${id}`,
    ]);

    // Get company IDs to count jobs
    const companyList = await sql`
      SELECT user_id FROM goodhive.companies WHERE user_id = ${id}
    `;
    const companyIds = companyList.map((c) => c.user_id);

    let jobCount = 0;
    if (companyIds.length > 0) {
      const jobs = await sql`
        SELECT COUNT(*) as count
        FROM goodhive.job_offers
        WHERE user_id = ANY(${companyIds})
      `;
      jobCount = parseInt(jobs[0].count, 10);
    }

    return new Response(
      JSON.stringify({
        talents: parseInt(talents[0].count, 10),
        companies: parseInt(companies[0].count, 10),
        jobs: jobCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching related data:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to fetch related data",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
