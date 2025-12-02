import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get filter parameters
    const dateRange = searchParams.get('dateRange');
    const status = searchParams.get('status');
    const hasProfile = searchParams.get('hasProfile');
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
    const params: any[] = [];

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
        conditions.push(sql`u.created_at >= ${ranges[dateRange]}`);
      } else if (dateRange.includes(',')) {
        const [start, end] = dateRange.split(',');
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(sql`u.created_at BETWEEN ${startDate} AND ${endDate}`);
      }
    }

    // Status filter (approved roles)
    if (status && status !== 'all') {
      conditions.push(sql`u.approved_roles ? ${status}`);
    }

    // Profile filter
    if (hasProfile === 'yes') {
      conditions.push(sql`t.user_id IS NOT NULL`);
    } else if (hasProfile === 'no') {
      conditions.push(sql`t.user_id IS NULL`);
    }

    // Build sort clause
    const sortMap: Record<string, any> = {
      latest: sql`u.created_at DESC`,
      oldest: sql`u.created_at ASC`,
      'email-asc': sql`LOWER(u.email) ASC`,
      'email-desc': sql`LOWER(u.email) DESC`,
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
      SELECT COUNT(DISTINCT u.userid) as total
      FROM goodhive.users u
      LEFT JOIN goodhive.talents t ON t.user_id = u.userid
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
    `;
    const total = parseInt(countResult[0].total, 10);

    // Execute query with filters and pagination
    const users = await sql`
      SELECT u.*,
        t.first_name,
        t.last_name,
        EXISTS (
          SELECT 1
          FROM goodhive.talents t2
          WHERE t2.user_id = u.userid
        ) as has_talent_profile
      FROM goodhive.users u
      LEFT JOIN goodhive.talents t ON t.user_id = u.userid
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      ORDER BY ${orderBy}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return new Response(
      JSON.stringify({
        message: "Successfully Retrieved All Users.",
        users,
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
      },
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ message: "Error Fetching Users" }), {
      status: 500,
    });
  }
}
