export const revalidate = 0; // Disable ISR completely

import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get filter parameters
    const dateRange = searchParams.get('dateRange');
    const status = searchParams.get('status') || 'pending'; // Default to pending
    const role = searchParams.get('role');
    const sort = searchParams.get('sort') || 'latest';

    // Build WHERE conditions as strings
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Status filter: pending, approved, rejected, all
    if (status && status !== 'all') {
      if (status === 'pending') {
        conditions.push(`talents.inReview = true`);
      } else if (status === 'approved') {
        conditions.push(`talents.approved = true`);
      } else if (status === 'rejected') {
        conditions.push(`talents.approved = false AND talents.inReview = false`);
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
        conditions.push(`talents.created_at >= $${paramIndex}`);
        params.push(ranges[dateRange]);
        paramIndex++;
      } else if (dateRange.includes(',')) {
        const [start, end] = dateRange.split(',');
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(`talents.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        params.push(startDate, endDate);
        paramIndex += 2;
      }
    }

    // Role filter (talent/mentor/recruiter)
    if (role && role !== 'all') {
      if (role === 'talent') {
        conditions.push(`talents.talent = true`);
      } else if (role === 'mentor') {
        conditions.push(`talents.mentor = true`);
      } else if (role === 'recruiter') {
        conditions.push(`talents.recruiter = true`);
      }
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : 'WHERE talents.inReview = true';

    // Build sort clause
    const sortMap: Record<string, string> = {
      latest: 'talents.created_at DESC',
      oldest: 'talents.created_at ASC',
      'name-asc': 'LOWER(talents.first_name) ASC, LOWER(talents.last_name) ASC',
      'name-desc': 'LOWER(talents.first_name) DESC, LOWER(talents.last_name) DESC',
      'email-asc': 'LOWER(talents.email) ASC',
      'email-desc': 'LOWER(talents.email) DESC',
    };
    const orderBy = sortMap[sort] || sortMap.latest;

    // Execute query with filters and JOIN with users table for additional fields
    const query = `
      SELECT
        talents.*,
        talents.inreview AS "inReview",
        users.referred_by,
        users.approved_roles,
        users.created_at AS user_created_at
      FROM goodhive.talents AS talents
      JOIN goodhive.users AS users ON talents.user_id = users.userid
      ${whereClause}
      ORDER BY ${orderBy}
    `;

    const pending_users = await sql.unsafe(query, params);

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    });

    return new Response(JSON.stringify(pending_users), { status: 200, headers });
  } catch (error) {
    console.error("Error fetching pending talents:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching users data" }),
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
      UPDATE goodhive.talents
      SET approved = true, talent = true, inreview = false
      WHERE user_id = ${userId}
      `;

    await sql`
      UPDATE goodhive.users
      SET talent_status = 'approved'
      WHERE userid = ${userId}
      `;

    return new Response(
      JSON.stringify({ message: "Approved talent successfully" }),
    );
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Unable to approve the talent" }),
      {
        status: 500,
      },
    );
  }
}
