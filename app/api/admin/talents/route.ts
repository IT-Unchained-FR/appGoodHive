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
    const mentorStatus = searchParams.get('mentorStatus');
    const sort = searchParams.get('sort') || 'latest';

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const offset = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ message: "Invalid pagination parameters" }),
        { status: 400 }
      );
    }

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
        conditions.push(sql`t.created_at >= ${ranges[dateRange]}`);
      } else if (dateRange.includes(',')) {
        const [start, end] = dateRange.split(',');
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(sql`t.created_at BETWEEN ${startDate} AND ${endDate}`);
      }
    }

    // Approval status filter
    if (status && status !== 'all') {
      if (status === 'approved') {
        conditions.push(sql`(u.talent_status = 'approved' OR t.approved = true)`);
      } else if (status === 'pending' || status === 'in_review') {
        conditions.push(sql`(u.talent_status IN ('pending', 'in_review') OR t.inreview = true)`);
      } else if (status === 'deferred') {
        conditions.push(sql`u.talent_status = 'deferred'`);
      } else if (status === 'rejected') {
        conditions.push(sql`(u.talent_status = 'rejected' OR (u.talent_status IS NULL AND t.approved = false AND t.inreview = false))`);
      }
    }

    // Role filter (talent/mentor/recruiter)
    if (role && role !== 'all') {
      if (role === 'talent') {
        conditions.push(sql`t.talent = true`);
      } else if (role === 'mentor') {
        conditions.push(sql`t.mentor = true`);
      } else if (role === 'recruiter') {
        conditions.push(sql`t.recruiter = true`);
      }
    }

    // Mentor status filter (approved/pending/deferred/rejected/not-applied)
    if (mentorStatus && mentorStatus !== 'all') {
      if (mentorStatus === 'approved') {
        conditions.push(sql`t.mentor = true AND u.mentor_status = 'approved'`);
      } else if (mentorStatus === 'pending') {
        conditions.push(sql`t.mentor = true AND u.mentor_status = 'pending'`);
      } else if (mentorStatus === 'deferred') {
        conditions.push(sql`t.mentor = true AND u.mentor_status = 'deferred'`);
      } else if (mentorStatus === 'rejected') {
        conditions.push(sql`t.mentor = true AND u.mentor_status = 'rejected'`);
      } else if (mentorStatus === 'not-applied') {
        conditions.push(sql`(t.mentor = false OR t.mentor IS NULL)`);
      }
    }

    // Build sort clause
    const sortMap: Record<string, any> = {
      latest: sql`t.created_at DESC`,
      oldest: sql`t.created_at ASC`,
      'name-asc': sql`LOWER(t.first_name) ASC, LOWER(t.last_name) ASC`,
      'name-desc': sql`LOWER(t.first_name) DESC, LOWER(t.last_name) DESC`,
      'email-asc': sql`LOWER(t.email) ASC`,
      'email-desc': sql`LOWER(t.email) DESC`,
      status: sql`CASE
        WHEN u.talent_status = 'approved' OR t.approved = true THEN 1
        WHEN u.talent_status IN ('pending', 'in_review') OR t.inreview = true THEN 2
        WHEN u.talent_status = 'deferred' THEN 3
        WHEN u.talent_status = 'rejected' OR (t.approved = false AND t.inreview = false) THEN 4
        ELSE 5
      END, t.created_at DESC`,
    };
    const orderBy = sortMap[sort] || sortMap.latest;

    // Build WHERE clause without sql.join (not available in some runtimes)
    const whereClause =
      conditions.length > 0
        ? conditions.reduce(
            (acc, condition, index) =>
              index === 0 ? condition : sql`${acc} AND ${condition}`,
            sql``,
          )
        : null;

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM goodhive.talents t
      LEFT JOIN goodhive.users u ON t.user_id = u.userid
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
    `;
    const total = parseInt(countResult[0].total, 10);

    // Execute query with filters and pagination, joining with users table for status fields
    const talents = await sql`
      SELECT
        t.*,
        u.mentor_status,
        u.talent_status,
        u.recruiter_status,
        u.mentor_deferred_until,
        u.talent_deferred_until,
        u.recruiter_deferred_until,
        u.mentor_status_reason,
        u.talent_status_reason,
        u.recruiter_status_reason
      FROM goodhive.talents t
      LEFT JOIN goodhive.users u ON t.user_id = u.userid
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      ORDER BY ${orderBy}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Set Cache-Control header to disable caching
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    });

    return new Response(
      JSON.stringify({
        data: talents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Error fetching talents:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to fetch talents from database",
        error: error instanceof Error ? error.message : "Unknown database error"
      }),
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
