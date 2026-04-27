export const revalidate = 0;

import { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import sql from "@/lib/db";

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("No token provided");
  const decoded = verify(token, getAdminJWTSecret()) as { role: string };
  if (decoded.role !== "admin") throw new Error("Not authorized");
  return decoded;
};

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    
    // Base query to get referrers and count their referred users
    let query = `
      SELECT 
        r.user_id,
        r.referral_code,
        u.email,
        t.first_name,
        t.last_name,
        t.image_url,
        COUNT(referred.userid) AS referral_count
      FROM goodhive.referrals r
      LEFT JOIN goodhive.users u ON r.user_id = u.userid
      LEFT JOIN goodhive.talents t ON r.user_id = t.user_id
      LEFT JOIN goodhive.users referred ON referred.referred_by = r.referral_code
      GROUP BY r.user_id, r.referral_code, u.email, t.first_name, t.last_name, t.image_url
      HAVING COUNT(referred.userid) > 0
    `;

    const values: string[] = [];

    if (search) {
      values.push(`%${search}%`);
      const searchIndex = values.length;
      query = `
        WITH Aggregated AS (${query})
        SELECT * FROM Aggregated
        WHERE 
          LOWER(email) LIKE $${searchIndex} OR 
          LOWER(referral_code) LIKE $${searchIndex} OR
          LOWER(first_name) LIKE $${searchIndex} OR
          LOWER(last_name) LIKE $${searchIndex}
      `;
    }

    query += " ORDER BY referral_count DESC";

    const results = await sql.unsafe(query, values);

    return new Response(JSON.stringify({ success: true, data: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isAuthError = msg === "No token provided" || msg === "Not authorized";

    return new Response(
      JSON.stringify({ success: false, error: isAuthError ? "Unauthorized" : "Failed to fetch referrals" }),
      { status: isAuthError ? 401 : 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
