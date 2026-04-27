import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import sql from "@/lib/db";
import {
  buildDateFilter,
  buildLocationFilter,
  buildTextSearchFilter,
  buildWhereClause,
  buildColumnFilters,
} from "@/lib/admin-filters";

export const revalidate = 0;

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("No token provided");
  const decoded = verify(token, getAdminJWTSecret()) as { role: string };
  if (decoded.role !== "admin") throw new Error("Not authorized");
  return decoded;
};

const getLegacySortClause = (sort: string) => {
  const legacySortMap: Record<string, string> = {
    latest: "c.created_at DESC, c.user_id ASC",
    oldest: "c.created_at ASC, c.user_id ASC",
    "name-asc": "LOWER(COALESCE(c.designation, '')) ASC, c.created_at DESC",
    "name-desc": "LOWER(COALESCE(c.designation, '')) DESC, c.created_at DESC",
  };

  return legacySortMap[sort] || legacySortMap.latest;
};

const getCompanySortClause = ({
  sort,
  sortBy,
  sortDir,
}: {
  sort: string;
  sortBy: string | null;
  sortDir: "asc" | "desc";
}) => {
  if (!sortBy) {
    return getLegacySortClause(sort);
  }

  const direction = sortDir === "asc" ? "ASC" : "DESC";
  const sortMap: Record<string, string> = {
    designation: `LOWER(COALESCE(c.designation, '')) ${direction}, c.created_at DESC`,
    email: `LOWER(COALESCE(c.email, '')) ${direction}, c.created_at DESC`,
    phone: `LOWER(TRIM(CONCAT(COALESCE(c.phone_country_code, ''), ' ', COALESCE(c.phone_number, '')))) ${direction}, c.created_at DESC`,
    address: `LOWER(TRIM(CONCAT(COALESCE(c.city, ''), ' ', COALESCE(c.country, ''), ' ', COALESCE(c.address, '')))) ${direction}, c.created_at DESC`,
    approved: `COALESCE(c.approved, false) ${direction}, COALESCE(c.published, false) ${direction}, c.created_at DESC`,
    created_at: `c.created_at ${direction}, c.user_id ASC`,
  };

  return sortMap[sortBy] || getLegacySortClause(sort);
};

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken();
    const { searchParams } = new URL(req.url);

    const dateRange = searchParams.get("dateRange");
    const status = searchParams.get("status");
    const location = searchParams.get("location");
    const rawSearch = searchParams.get("search");
    const search = rawSearch?.trim().replace(/\s+/g, " ") || "";
    const sort = searchParams.get("sort") || "latest";
    const sortBy = searchParams.get("sortBy");
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const requestedPage = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    if (requestedPage < 1 || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ message: "Invalid pagination parameters" }),
        { status: 400 },
      );
    }

    const filters = [];

    const dateFilter = buildDateFilter(dateRange, "c.created_at");
    if (dateFilter.condition) filters.push(dateFilter);

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

    const locationFilter = buildLocationFilter(location, "c.city", "c.country");
    if (locationFilter.condition) filters.push(locationFilter);

    const searchFilter = buildTextSearchFilter(search, [
      "COALESCE(c.designation, '')",
      "COALESCE(c.email, '')",
      "COALESCE(c.user_id::text, '')",
      "COALESCE(c.wallet_address, '')",
      "COALESCE(c.city, '')",
      "COALESCE(c.country, '')",
      "COALESCE(c.address, '')",
      "COALESCE(c.phone_number, '')",
      "COALESCE(c.phone_country_code, '')",
      "COALESCE(c.headline, '')",
      "COALESCE(c.telegram, '')",
      "COALESCE(c.github, '')",
      "COALESCE(c.linkedin, '')",
      "COALESCE(c.portfolio, '')",
      "COALESCE(c.twitter, '')",
      "COALESCE(c.status, '')",
    ]);
    if (searchFilter.condition) filters.push(searchFilter);

    const columnFiltersJson = searchParams.get("columnFilters");
    const columnMap: Record<string, string> = {
      designation: "c.designation",
      email: "c.email",
      phone: "TRIM(CONCAT(COALESCE(c.phone_country_code, ''), ' ', COALESCE(c.phone_number, '')))",
      address: "TRIM(CONCAT(COALESCE(c.city, ''), ' ', COALESCE(c.country, ''), ' ', COALESCE(c.address, '')))",
      approved: "c.approved",
      created_at: "c.created_at",
      user_id: "c.user_id::text",
      city: "c.city",
      country: "c.country",
      headline: "c.headline",
    };

    const columnFilters = buildColumnFilters(columnFiltersJson, columnMap);
    filters.push(...columnFilters);

    const { whereClause, values } = buildWhereClause(filters);
    const sortClause = getCompanySortClause({ sort, sortBy, sortDir });

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM goodhive.companies c
      ${whereClause}
    `;
    const countResult = await sql.unsafe(countQuery, values);
    const total = parseInt(countResult[0]?.total ?? "0", 10);
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * limit;

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
          totalPages,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      }),
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isAuthError =
      message === "No token provided" ||
      message === "Not authorized" ||
      message === "Invalid token";

    console.error("Error fetching companies:", error);

    return new Response(
      JSON.stringify({
        error: message,
        message: isAuthError
          ? "Unauthorized"
          : "Failed to fetch companies from database",
      }),
      { status: isAuthError ? 401 : 500 },
    );
  }
}
