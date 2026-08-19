export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import sql from "@/lib/db";
import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("No token provided");
  const decoded = verify(token, getAdminJWTSecret()) as { role: string };
  if (decoded.role !== "admin") throw new Error("Not authorized");
  return decoded;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await verifyAdminToken();

    const [campaign] = await sql`
      SELECT id, subject, body_html, audience_filter, recipient_count, sent_count, failed_count,
             status, created_by, created_at, completed_at
      FROM goodhive.newsletter_campaigns
      WHERE id = ${params.id}
    `;

    if (!campaign) {
      return new Response(JSON.stringify({ message: "Campaign not found" }), { status: 404 });
    }

    const recipients = await sql`
      SELECT user_id, email, status, error, sent_at
      FROM goodhive.newsletter_recipients
      WHERE campaign_id = ${params.id}
      ORDER BY (status = 'failed') DESC, sent_at DESC NULLS LAST
    `;

    return new Response(JSON.stringify({ data: { campaign, recipients } }), { status: 200 });
  } catch (error) {
    console.error("Error fetching newsletter campaign detail:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }
    return new Response(JSON.stringify({ message: "Failed to fetch campaign" }), { status: 500 });
  }
}
