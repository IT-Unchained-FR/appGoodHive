import sql from "@/lib/db";
import type { NextRequest } from "next/server";
import { requireAdminAuth } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const stringValue = value == null ? "" : String(value);
    return stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "talents";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const talentDateFilter = startDate && endDate
      ? sql`t.created_at::date BETWEEN ${startDate}::date AND ${endDate}::date`
      : startDate
        ? sql`t.created_at::date >= ${startDate}::date`
        : endDate
          ? sql`t.created_at::date <= ${endDate}::date`
          : sql`TRUE`;

    const companyDateFilter = startDate && endDate
      ? sql`c.created_at::date BETWEEN ${startDate}::date AND ${endDate}::date`
      : startDate
        ? sql`c.created_at::date >= ${startDate}::date`
        : endDate
          ? sql`c.created_at::date <= ${endDate}::date`
          : sql`TRUE`;

    const jobDateFilter = startDate && endDate
      ? sql`j.posted_at::date BETWEEN ${startDate}::date AND ${endDate}::date`
      : startDate
        ? sql`j.posted_at::date >= ${startDate}::date`
        : endDate
          ? sql`j.posted_at::date <= ${endDate}::date`
          : sql`TRUE`;

    let rows: Record<string, unknown>[] = [];

    if (type === "talents") {
      rows = await sql`
        SELECT
          t.first_name,
          t.last_name,
          u.email,
          u.talent_status AS status,
          t.phone_number AS phone,
          CONCAT_WS(', ', NULLIF(t.city, ''), NULLIF(t.country, '')) AS location,
          t.linkedin,
          t.portfolio,
          t.created_at
        FROM goodhive.talents t
        JOIN goodhive.users u ON u.userid = t.user_id
        WHERE ${talentDateFilter}
        ORDER BY t.created_at DESC
      `;
    } else if (type === "companies") {
      rows = await sql`
        SELECT
          c.designation AS company_name,
          u.email,
          CASE WHEN c.approved THEN 'approved' ELSE 'pending' END AS status,
          c.created_at
        FROM goodhive.companies c
        JOIN goodhive.users u ON u.userid = c.user_id
        WHERE ${companyDateFilter}
        ORDER BY c.created_at DESC
      `;
    } else if (type === "jobs") {
      rows = await sql`
        SELECT
          j.title,
          j.status,
          j.review_status,
          j.budget_min,
          j.budget_max,
          j.token_currency,
          j.posted_at,
          j.published
        FROM goodhive.job_offers j
        WHERE ${jobDateFilter}
        ORDER BY j.posted_at DESC
      `;
    } else {
      return new Response(JSON.stringify({ message: "Unsupported report type" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const csv = toCSV(rows);
    const dateString = new Date().toISOString().split("T")[0];
    const filename = `goodhive-${type}-${dateString}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating admin report:", error);

    return new Response(
      JSON.stringify({ message: "Failed to generate report" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
