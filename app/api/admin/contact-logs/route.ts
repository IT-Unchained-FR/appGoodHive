import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

const verifyAdminToken = () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("No token");
  const decoded = verify(token, getAdminJWTSecret()) as { role: string };
  if (decoded.role !== "admin") throw new Error("Not authorized");
  return decoded;
};

export async function GET(request: NextRequest) {
  try {
    verifyAdminToken();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contactType = searchParams.get("contact_type") ?? null;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

  const validContactTypes = ["direct", "job_request", "link_click"];
  const typeFilter =
    contactType && validContactTypes.includes(contactType) ? contactType : null;

  try {
    const logs = await sql`
      SELECT
        cl.id,
        cl.company_user_id,
        cl.talent_user_id,
        cl.job_id,
        cl.actor_user_id,
        cl.actor_type,
        cl.contact_type,
        cl.message_preview,
        cl.link_type,
        cl.link_url,
        cl.source_page,
        cl.created_at,
        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', talent_profile.first_name, talent_profile.last_name)), ''),
          talent_user.email,
          'Unknown Talent'
        ) AS talent_name,
        COALESCE(
          NULLIF(company_profile.designation, ''),
          company_user.email,
          'Unknown Company'
        ) AS company_name,
        jo.title AS job_title
      FROM goodhive.contact_logs cl
      LEFT JOIN goodhive.users company_user
        ON company_user.userid = cl.company_user_id
      LEFT JOIN goodhive.users talent_user
        ON talent_user.userid = cl.talent_user_id
      LEFT JOIN goodhive.companies company_profile
        ON company_profile.user_id::text = cl.company_user_id::text
      LEFT JOIN goodhive.talents talent_profile
        ON talent_profile.user_id::text = cl.talent_user_id::text
      LEFT JOIN goodhive.job_offers jo
        ON jo.id = cl.job_id
      WHERE ${typeFilter !== null ? sql`cl.contact_type = ${typeFilter}` : sql`TRUE`}
      ORDER BY cl.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [{ total }] = await sql<[{ total: number }]>`
      SELECT COUNT(*)::int AS total
      FROM goodhive.contact_logs
      WHERE ${typeFilter !== null ? sql`contact_type = ${typeFilter}` : sql`TRUE`}
    `;

    return NextResponse.json({ success: true, logs, total }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch admin contact logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact logs" },
      { status: 500 },
    );
  }
}
