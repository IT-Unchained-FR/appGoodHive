import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import {
  buildDateFilter,
  buildLocationFilter,
  buildWhereClause,
} from "@/lib/admin-filters";

export const revalidate = 0; // Disable ISR for admin data

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const dateRange = searchParams.get("dateRange");
    const status = searchParams.get("status");
    const location = searchParams.get("location");
    const sort = searchParams.get("sort") || "latest";

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ message: "Invalid pagination parameters" }),
        { status: 400 }
      );
    }

    const filters = [];

    // Date range on company creation
    const dateFilter = buildDateFilter(dateRange, "c.created_at");
    if (dateFilter.condition) filters.push(dateFilter);

    // Approval status
    if (status && status !== "all") {
      if (status === "approved") {
        filters.push({ condition: "c.approved = $", values: [true] });
      } else if (status === "pending") {
        filters.push({
          condition: "(c.approved = $ OR c.approved IS NULL OR c.inreview = $)",
          values: [false, true],
        });
      }
    }

    // Location (city or country)
    const locationFilter = buildLocationFilter(location, "c.city", "c.country");
    if (locationFilter.condition) filters.push(locationFilter);

    const { whereClause, values } = buildWhereClause(filters);

    const sortMap: Record<string, string> = {
      latest: "c.created_at DESC",
      oldest: "c.created_at ASC",
      "name-asc": "LOWER(c.designation) ASC",
      "name-desc": "LOWER(c.designation) DESC",
    };
    const sortClause = sortMap[sort] || sortMap.latest;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM goodhive.companies c
      ${whereClause}
    `;
    const countResult = await sql.unsafe(countQuery, values);
    const total = parseInt(countResult[0].total, 10);

    // Get paginated data
    const query = `
      SELECT c.*
      FROM goodhive.companies c
      ${whereClause}
      ORDER BY ${sortClause}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const companies = await sql.unsafe(query, [...values, limit, offset]);

    return new Response(
      JSON.stringify({
        data: companies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching companies:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to fetch companies from database",
        error: error instanceof Error ? error.message : "Unknown database error"
      }),
      {
        status: 500,
      },
    );
  }
}
