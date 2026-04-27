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
    const referralCode = searchParams.get("code");
    
    if (!referralCode) {
      return new Response(JSON.stringify({ success: false, error: "Referral code is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the talents that signed up using this referral code
    const query = `
      SELECT 
        t.user_id,
        t.first_name,
        t.last_name,
        t.image_url,
        t.talent,
        t.recruiter,
        t.mentor,
        t.approved,
        u.email,
        u.talent_status,
        u.mentor_status,
        u.recruiter_status,
        u.created_at
      FROM goodhive.users u
      LEFT JOIN goodhive.talents t ON u.userid = t.user_id
      WHERE u.referred_by = $1
      ORDER BY u.created_at DESC
    `;

    const results = await sql.unsafe(query, [referralCode]);

    return new Response(JSON.stringify({ success: true, data: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching referred talents:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isAuthError = msg === "No token provided" || msg === "Not authorized";

    return new Response(
      JSON.stringify({ success: false, error: isAuthError ? "Unauthorized" : "Failed to fetch referred talents" }),
      { status: isAuthError ? 401 : 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
