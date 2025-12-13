import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

// Types for analytics data
interface DateCount {
  date: Date | string;
  count: number | string;
}

interface ApprovalRate {
  category: string;
  approved: number | string;
  pending: number | string;
  rejected: number | string;
}

const verifyAdminToken = async (req: NextRequest) => {
  // Check Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = verify(token, getAdminJWTSecret()) as { role: string };
      if (decoded.role === "admin") return decoded;
    } catch (error) {
      // Fall through to cookie check
    }
  }

  // Fallback to cookie check
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

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req);

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Normalize date range (default: last 30 days including today)
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
    // Clamp order if inverted
    if (startDate > endDate) {
      const tmp = new Date(startDate);
      startDate.setTime(endDate.getTime());
      endDate.setTime(tmp.getTime());
    }
    // Ensure time component covers full days
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // User growth over time (continuous date series)
    const userGrowth = await sql`
      WITH date_series AS (
        SELECT generate_series(${startDate}::date, ${endDate}::date, '1 day'::interval) AS date
      ),
      counts AS (
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM goodhive.users
        WHERE created_at::date BETWEEN ${startDate}::date AND ${endDate}::date
        GROUP BY DATE(created_at)
      )
      SELECT ds.date::date AS date, COALESCE(c.count, 0) AS count
      FROM date_series ds
      LEFT JOIN counts c ON ds.date::date = c.date
      ORDER BY ds.date ASC
    `;

    // Job posting trends
    const jobTrends = await sql`
      WITH date_series AS (
        SELECT generate_series(${startDate}::date, ${endDate}::date, '1 day'::interval) AS date
      ),
      counts AS (
        SELECT DATE(posted_at) AS date, COUNT(*) AS count
        FROM goodhive.job_offers
        WHERE posted_at::date BETWEEN ${startDate}::date AND ${endDate}::date
        GROUP BY DATE(posted_at)
      )
      SELECT ds.date::date AS date, COALESCE(c.count, 0) AS count
      FROM date_series ds
      LEFT JOIN counts c ON ds.date::date = c.date
      ORDER BY ds.date ASC
    `;

    // Approval rates
    const approvalRates = await sql`
      SELECT
        'talents' as type,
        COUNT(*) FILTER (WHERE approved = true) as approved,
        COUNT(*) FILTER (WHERE approved = false) as pending,
        COUNT(*) as total
      FROM goodhive.talents
        UNION ALL
      SELECT
        'companies' as type,
        COUNT(*) FILTER (WHERE approved = true) as approved,
        COUNT(*) FILTER (WHERE approved = false) as pending,
        COUNT(*) FILTER (WHERE published = true) as published,
        COUNT(*) FILTER (WHERE published = false) as unpublished,
        COUNT(*) as total
      FROM goodhive.companies
    `;

    // User registrations by role
    const usersByRole = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE talent_status = 'approved') as talents,
        COUNT(*) FILTER (WHERE mentor_status = 'approved') as mentors,
        COUNT(*) FILTER (WHERE recruiter_status = 'approved') as recruiters
      FROM goodhive.users
    `;

    // Activity by day (last 7 days)
    // Note: Simplified due to missing timestamp columns in some tables
    const dailyActivity = await sql`
      SELECT
        DATE(posted_at) as date,
        'jobs' as type,
        COUNT(*) as count
      FROM goodhive.job_offers
      WHERE posted_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(posted_at)
      ORDER BY date DESC
    `;

    // Helper function to safely format dates from PostgreSQL
    const formatDate = (date: Date | string): string => {
      if (!date) return "";
      // If it's already a string in YYYY-MM-DD format, return it
      if (typeof date === "string") {
        return date.split("T")[0]; // Handle both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss' formats
      }
      // If it's a Date object, format it
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      // Otherwise, try to convert to Date
      try {
        return new Date(date).toISOString().split("T")[0];
      } catch {
        return String(date).split("T")[0];
      }
    };

    const analytics = {
      userGrowth: userGrowth.map((row) => ({
        date: formatDate(row.date),
        count: Number(row.count),
      })),
      jobTrends: jobTrends.map((row) => ({
        date: formatDate(row.date),
        count: Number(row.count),
      })),
      approvalRates: approvalRates.map((row) => ({
        type: row.type,
        approved: Number(row.approved || 0),
        pending: Number(row.pending || 0),
        published: Number(row.published || 0),
        unpublished: Number(row.unpublished || 0),
        total: Number(row.total || 0),
        approvalRate: row.total > 0
          ? ((Number(row.approved || 0) / Number(row.total || 0)) * 100).toFixed(1)
            : "0",
      })),
      usersByRole: {
        talents: Number(usersByRole[0]?.talents || 0),
        mentors: Number(usersByRole[0]?.mentors || 0),
        recruiters: Number(usersByRole[0]?.recruiters || 0),
      },
      dailyActivity: dailyActivity.map((row) => ({
        date: formatDate(row.date),
        type: row.type,
        count: Number(row.count),
      })),
    };

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    if (
      error instanceof Error &&
      (error.message === "No token provided" ||
        error.message === "Invalid token" ||
        error.message === "Not authorized")
    ) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return new Response(
      JSON.stringify({
        message: "Failed to generate analytics data",
        error: error instanceof Error ? error.message : "Analytics query failed",
        details: "Check if all required database tables exist and have proper permissions"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
