export const revalidate = 0; // Disable ISR completely

import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get filter parameters
    const dateRange = searchParams.get('dateRange');
    const status = searchParams.get('status');
    const location = searchParams.get('location');
    const sort = searchParams.get('sort') || 'latest';

    // Build WHERE conditions
    const conditions = [];

    // Date filter
    if (dateRange && dateRange !== 'any') {
      const now = new Date();
      const ranges: Record<string, Date> = {
        '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '3d': new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '14d': new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };

      if (dateRange in ranges) {
        conditions.push(sql`created_at >= ${ranges[dateRange]}`);
      } else if (dateRange.includes(',')) {
        const [start, end] = dateRange.split(',');
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(sql`created_at BETWEEN ${startDate} AND ${endDate}`);
      }
    }

    // Status filter (published)
    if (status && status !== 'all') {
      if (status === 'published') {
        conditions.push(sql`published = true`);
      } else if (status === 'unpublished') {
        conditions.push(sql`published = false`);
      }
    }

    // Location filter (city or country)
    if (location && location.trim()) {
      const locationTerm = `%${location.trim()}%`;
      conditions.push(sql`(LOWER(city) LIKE LOWER(${locationTerm}) OR LOWER(country) LIKE LOWER(${locationTerm}))`);
    }

    // Build sort clause
    const sortMap: Record<string, any> = {
      latest: sql`created_at DESC`,
      oldest: sql`created_at ASC`,
      'title-asc': sql`LOWER(title) ASC`,
      'title-desc': sql`LOWER(title) DESC`,
      'company-asc': sql`LOWER(company_name) ASC`,
      'company-desc': sql`LOWER(company_name) DESC`,
    };
    const orderBy = sortMap[sort] || sortMap.latest;

    // Build WHERE clause without relying on sql.join (not available in some runtimes)
    const whereClause =
      conditions.length > 0
        ? conditions.reduce(
            (acc, condition, index) =>
              index === 0 ? condition : sql`${acc} AND ${condition}`,
            sql``,
          )
        : null;

    // Execute query with filters
    const jobs = await sql`
      SELECT *
      FROM goodhive.job_offers
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      ORDER BY ${orderBy}
    `;

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    });

    return new Response(JSON.stringify(jobs), { status: 200, headers });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching jobs data" }),
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
