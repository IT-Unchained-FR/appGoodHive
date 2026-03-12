import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: true, data: { count: 0 } });
    }

    const rows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::int AS count
      FROM goodhive.notifications
      WHERE user_id = ${sessionUser.user_id}::uuid AND read = FALSE
    `;

    return NextResponse.json({
      success: true,
      data: { count: Number(rows[0]?.count ?? 0) },
    });
  } catch (error) {
    console.error("Failed to fetch unread notification count:", error);
    return NextResponse.json({ success: true, data: { count: 0 } });
  }
}
