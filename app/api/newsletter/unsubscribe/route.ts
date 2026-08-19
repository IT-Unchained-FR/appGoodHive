import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/newsletter-token";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token");

  const userId = token ? verifyUnsubscribeToken(token) : null;

  if (!userId) {
    return NextResponse.redirect(new URL("/newsletter/unsubscribe?status=invalid", origin));
  }

  try {
    await sql`
      UPDATE goodhive.users
      SET newsletter_opt_out = true, newsletter_opt_out_at = now()
      WHERE userid = ${userId}
    `;
  } catch (error) {
    console.error("Error processing newsletter unsubscribe:", error);
    return NextResponse.redirect(new URL("/newsletter/unsubscribe?status=error", origin));
  }

  return NextResponse.redirect(new URL("/newsletter/unsubscribe?status=success", origin));
}
