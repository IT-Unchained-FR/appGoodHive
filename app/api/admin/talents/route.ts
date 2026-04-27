export const revalidate = 0;

import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import sql from "@/lib/db";
import {
  buildDateFilter,
  buildTextSearchFilter,
  buildWhereClause,
  buildColumnFilters,
} from "@/lib/admin-filters";

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
    latest: "COALESCE(u.created_at, t.created_at) DESC, t.user_id ASC",
    oldest: "COALESCE(u.created_at, t.created_at) ASC, t.user_id ASC",
    "name-asc":
      "LOWER(TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')))) ASC, COALESCE(u.created_at, t.created_at) DESC",
    "name-desc":
      "LOWER(TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')))) DESC, COALESCE(u.created_at, t.created_at) DESC",
    "email-asc":
      "LOWER(COALESCE(t.email, '')) ASC, COALESCE(u.created_at, t.created_at) DESC",
    "email-desc":
      "LOWER(COALESCE(t.email, '')) DESC, COALESCE(u.created_at, t.created_at) DESC",
    status: `CASE
      WHEN u.talent_status = 'approved' OR t.approved = true THEN 1
      WHEN u.talent_status IN ('pending', 'in_review') OR t.inreview = true THEN 2
      WHEN u.talent_status = 'deferred' THEN 3
      WHEN u.talent_status = 'rejected' OR (u.talent_status IS NULL AND t.approved = false AND t.inreview = false) THEN 4
      ELSE 5
    END ASC, COALESCE(u.created_at, t.created_at) DESC`,
  };

  return legacySortMap[sort] || legacySortMap.latest;
};

const getTalentSortClause = ({
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
    name: `LOWER(TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')))) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    user_id: `CAST(t.user_id AS TEXT) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    email: `LOWER(COALESCE(t.email, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    phone_number: `LOWER(TRIM(CONCAT(COALESCE(t.phone_country_code, ''), ' ', COALESCE(t.phone_number, '')))) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    location: `LOWER(TRIM(CONCAT(COALESCE(t.city, ''), ' ', COALESCE(t.country, '')))) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    linkedin: `LOWER(COALESCE(t.linkedin, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    github: `LOWER(COALESCE(t.github, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    stackoverflow: `LOWER(COALESCE(t.stackoverflow, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    twitter: `LOWER(COALESCE(t.twitter, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    portfolio: `LOWER(COALESCE(t.portfolio, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    telegram: `LOWER(COALESCE(t.telegram, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    cv_url: `LOWER(COALESCE(t.cv_url, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    availability_status: `LOWER(COALESCE(t.availability_status, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    wallet_address: `LOWER(COALESCE(t.wallet_address, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    talent: `COALESCE(t.talent, false) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    talent_status: `CASE
      WHEN u.talent_status = 'approved' OR t.approved = true THEN 1
      WHEN u.talent_status IN ('pending', 'in_review') OR t.inreview = true THEN 2
      WHEN u.talent_status = 'deferred' THEN 3
      WHEN u.talent_status = 'rejected' OR (u.talent_status IS NULL AND t.approved = false AND t.inreview = false) THEN 4
      ELSE 5
    END ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    mentor: `COALESCE(t.mentor, false) ${direction}, LOWER(COALESCE(u.mentor_status, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    recruiter: `COALESCE(t.recruiter, false) ${direction}, LOWER(COALESCE(u.recruiter_status, '')) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    approved: `COALESCE(t.approved, false) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    referred_by: `LOWER(COALESCE(
      NULLIF(TRIM(CONCAT(COALESCE(ref_talents.first_name, ''), ' ', COALESCE(ref_talents.last_name, ''))), ''),
      ref_users.email,
      ref.user_id::text,
      u.referred_by,
      ''
    )) ${direction}, COALESCE(u.created_at, t.created_at) DESC`,
    created_at: `COALESCE(u.created_at, t.created_at) ${direction}, t.user_id ASC`,
  };

  return sortMap[sortBy] || getLegacySortClause(sort);
};

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken();
    const { searchParams } = new URL(req.url);

    const dateRange = searchParams.get("dateRange");
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const rawSearch = searchParams.get("search");
    const search = rawSearch?.trim().replace(/\s+/g, " ") || "";
    const sort = searchParams.get("sort") || "latest";
    const sortBy = searchParams.get("sortBy");
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const requestedPage = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    if (requestedPage < 1 || limit < 1 || limit > 5000) {
      return new Response(
        JSON.stringify({ message: "Invalid pagination parameters" }),
        { status: 400 },
      );
    }

    const filters = [];

    const dateFilter = buildDateFilter(
      dateRange,
      "COALESCE(u.created_at, t.created_at)",
    );
    if (dateFilter.condition) filters.push(dateFilter);

    if (status && status !== "all") {
      if (status === "approved") {
        filters.push({
          condition: "(u.talent_status = $ OR t.approved = $)",
          values: ["approved", true],
        });
      } else if (status === "pending" || status === "in_review") {
        filters.push({
          condition:
            "(u.talent_status IN ($, $) OR t.inreview = $)",
          values: ["pending", "in_review", true],
        });
      } else if (status === "deferred") {
        filters.push({ condition: "u.talent_status = $", values: ["deferred"] });
      } else if (status === "rejected") {
        filters.push({
          condition:
            "(u.talent_status = $ OR (u.talent_status IS NULL AND t.approved = $ AND t.inreview = $))",
          values: ["rejected", false, false],
        });
      }
    }

    if (role && role !== "all") {
      if (role === "talent") {
        filters.push({ condition: "t.talent = $", values: [true] });
      } else if (role === "mentor") {
        filters.push({ condition: "t.mentor = $", values: [true] });
      } else if (role === "recruiter") {
        filters.push({ condition: "t.recruiter = $", values: [true] });
      }
    }

    const searchFilter = buildTextSearchFilter(search, [
      "COALESCE(t.first_name, '')",
      "COALESCE(t.last_name, '')",
      "TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')))",
      "COALESCE(t.email, '')",
      "COALESCE(t.user_id::text, '')",
      "COALESCE(t.telegram, '')",
      "COALESCE(t.github, '')",
      "COALESCE(t.linkedin, '')",
      "COALESCE(t.portfolio, '')",
      "COALESCE(t.stackoverflow, '')",
      "COALESCE(t.twitter, '')",
      "COALESCE(t.wallet_address, '')",
      "COALESCE(t.city, '')",
      "COALESCE(t.country, '')",
      "COALESCE(t.phone_number, '')",
      "COALESCE(t.phone_country_code, '')",
      "COALESCE(u.referred_by, '')",
      "COALESCE(ref.user_id::text, '')",
      "COALESCE(ref_users.email, '')",
      "NULLIF(TRIM(CONCAT(COALESCE(ref_talents.first_name, ''), ' ', COALESCE(ref_talents.last_name, ''))), '')",
    ]);
    if (searchFilter.condition) filters.push(searchFilter);

    const columnFiltersJson = searchParams.get("columnFilters");
    const columnMap: Record<string, string> = {
      name: "TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')))",
      user_id: "t.user_id::text",
      email: "t.email",
      phone_number: "TRIM(CONCAT(COALESCE(t.phone_country_code, ''), ' ', COALESCE(t.phone_number, '')))",
      location: "TRIM(CONCAT(COALESCE(t.city, ''), ' ', COALESCE(t.country, '')))",
      linkedin: "t.linkedin",
      github: "t.github",
      stackoverflow: "t.stackoverflow",
      twitter: "t.twitter",
      portfolio: "t.portfolio",
      telegram: "t.telegram",
      cv_url: "t.cv_url",
      availability_status: "t.availability_status",
      wallet_address: "t.wallet_address",
      talent: "t.talent",
      mentor: "t.mentor",
      recruiter: "t.recruiter",
      approved: "t.approved",
      referred_by: "COALESCE(NULLIF(TRIM(CONCAT(COALESCE(ref_talents.first_name, ''), ' ', COALESCE(ref_talents.last_name, ''))), ''), ref_users.email, ref.user_id::text, u.referred_by, '')"
    };

    const columnFilters = buildColumnFilters(columnFiltersJson, columnMap);
    filters.push(...columnFilters);

    const { whereClause, values } = buildWhereClause(filters);
    const fromClause = `
      FROM goodhive.talents t
      LEFT JOIN goodhive.users u ON t.user_id = u.userid
      LEFT JOIN goodhive.referrals ref ON ref.referral_code = u.referred_by
      LEFT JOIN goodhive.talents ref_talents ON ref_talents.user_id = ref.user_id
      LEFT JOIN goodhive.users ref_users ON ref_users.userid = ref.user_id
    `;
    const sortClause = getTalentSortClause({ sort, sortBy, sortDir });

    const countQuery = `
      SELECT COUNT(*) AS total
      ${fromClause}
      ${whereClause}
    `;
    const countResult = await sql.unsafe(countQuery, values);
    const total = parseInt(countResult[0]?.total ?? "0", 10);
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        t.*,
        u.created_at AS user_created_at,
        u.mentor_status,
        u.talent_status,
        u.recruiter_status,
        u.referred_by,
        u.mentor_deferred_until,
        u.talent_deferred_until,
        u.recruiter_deferred_until,
        u.mentor_status_reason,
        u.talent_status_reason,
        u.recruiter_status_reason,
        ref.user_id AS referrer_user_id,
        ref_users.email AS referrer_email,
        COALESCE(
          NULLIF(
            TRIM(
              CONCAT(
                COALESCE(ref_talents.first_name, ''),
                ' ',
                COALESCE(ref_talents.last_name, '')
              )
            ),
            ''
          ),
          ref_users.email,
          ref.user_id::text
        ) AS referrer_name
      ${fromClause}
      ${whereClause}
      ORDER BY ${sortClause}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const talents = await sql.unsafe(query, [...values, limit, offset]);

    return new Response(
      JSON.stringify({
        data: talents,
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
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isAuthError =
      msg === "No token provided" ||
      msg === "Not authorized" ||
      msg === "Invalid token";

    console.error("Error fetching talents:", error);

    return new Response(
      JSON.stringify({
        error: msg,
        message: isAuthError
          ? "Unauthorized"
          : "Failed to fetch talents from database",
      }),
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
        status: isAuthError ? 401 : 500,
      },
    );
  }
}
