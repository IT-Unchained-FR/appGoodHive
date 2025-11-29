export const revalidate = 0; // Disable ISR completely

import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get filter parameters
    const dateRange = searchParams.get('dateRange');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
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

    // Approval status filter
    if (status && status !== 'all') {
      if (status === 'approved') {
        conditions.push(sql`approved = true`);
      } else if (status === 'pending') {
        conditions.push(sql`approved = false OR approved IS NULL`);
      }
    }

    // Role filter (talent/mentor/recruiter)
    if (role && role !== 'all') {
      if (role === 'talent') {
        conditions.push(sql`talent = true`);
      } else if (role === 'mentor') {
        conditions.push(sql`mentor = true`);
      } else if (role === 'recruiter') {
        conditions.push(sql`recruiter = true`);
      }
    }

    // Build sort clause
    const sortMap: Record<string, any> = {
      latest: sql`created_at DESC`,
      oldest: sql`created_at ASC`,
      'name-asc': sql`LOWER(first_name) ASC, LOWER(last_name) ASC`,
      'name-desc': sql`LOWER(first_name) DESC, LOWER(last_name) DESC`,
      'email-asc': sql`LOWER(email) ASC`,
      'email-desc': sql`LOWER(email) DESC`,
    };
    const orderBy = sortMap[sort] || sortMap.latest;

    // Execute query with filters
    const talents = conditions.length > 0
      ? await sql`
          SELECT *
          FROM goodhive.talents
          WHERE ${sql.join(conditions, sql` AND `)}
          ORDER BY ${orderBy}
        `
      : await sql`
          SELECT *
          FROM goodhive.talents
          ORDER BY ${orderBy}
        `;

    // Set Cache-Control header to disable caching
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    });

    return new Response(JSON.stringify(talents), { status: 200, headers });
  } catch (error) {
    console.error("Error fetching talents:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching talents data" }),
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
