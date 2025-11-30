export const revalidate = 0; // Disable ISR completely

import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get filter parameters
    const dateRange = searchParams.get('dateRange');
    const status = searchParams.get('status') || 'pending'; // Default to pending
    const location = searchParams.get('location');
    const sort = searchParams.get('sort') || 'latest';

    // Build WHERE conditions as strings
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Status filter: pending, approved, rejected, all
    if (status && status !== 'all') {
      if (status === 'pending') {
        conditions.push(`inReview = true`);
      } else if (status === 'approved') {
        conditions.push(`approved = true`);
      } else if (status === 'rejected') {
        conditions.push(`approved = false AND inReview = false`);
      }
    }

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
        conditions.push(`created_at >= $${paramIndex}`);
        params.push(ranges[dateRange]);
        paramIndex++;
      } else if (dateRange.includes(',')) {
        const [start, end] = dateRange.split(',');
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(`created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        params.push(startDate, endDate);
        paramIndex += 2;
      }
    }

    // Location filter (city or country)
    if (location && location.trim()) {
      const locationTerm = `%${location.toLowerCase().trim()}%`;
      conditions.push(`(LOWER(city) LIKE $${paramIndex} OR LOWER(country) LIKE $${paramIndex + 1})`);
      params.push(locationTerm, locationTerm);
      paramIndex += 2;
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : 'WHERE inReview = true';

    // Build sort clause
    const sortMap: Record<string, string> = {
      latest: 'created_at DESC',
      oldest: 'created_at ASC',
      'headline-asc': 'LOWER(headline) ASC',
      'headline-desc': 'LOWER(headline) DESC',
    };
    const orderBy = sortMap[sort] || sortMap.latest;

    // Execute query with filters
    const query = `
      SELECT *, inreview AS "inReview"
      FROM goodhive.companies
      ${whereClause}
      ORDER BY ${orderBy}
    `;

    const pending_companies = await sql.unsafe(query, params);

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    });

    return new Response(JSON.stringify(pending_companies), { status: 200, headers });
  } catch (error) {
    console.error("Error fetching pending companies:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching company data" }),
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

    try {
    await sql`
      UPDATE goodhive.companies
      SET approved = true, inreview = false
      WHERE user_id = ${userId}
      `;

    await sql`
      UPDATE goodhive.users
      SET recruiter_status = 'approved'
      WHERE userid = ${userId}
      `;

    return new Response(
      JSON.stringify({ message: "Approved company successfully" }),
    );
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Unable to approve the company" }),
      {
        status: 500,
      },
    );
  }
}
