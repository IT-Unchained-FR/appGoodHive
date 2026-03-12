import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql<{
      id: string;
      type: string;
      title: string;
      body: string | null;
      data: Record<string, unknown> | null;
      read: boolean;
      created_at: string;
    }[]>`
      SELECT id, type, title, body, data, read, created_at
      FROM goodhive.notifications
      WHERE user_id = ${sessionUser.user_id}::uuid
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
