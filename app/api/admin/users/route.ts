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

    // Execute query with filters
    const users = conditions.length > 0
      ? await sql`
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
          WHERE ${sql.join(conditions, sql` AND `)}
          ORDER BY ${orderBy}
        `
      : await sql`
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
          ORDER BY ${orderBy}
        `;

    return new Response(
      JSON.stringify({
        message: "Successfully Retrieved All Users.",
        users,
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
