import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

// Lightweight endpoint — returns only the total unread message count.
// Used by the navbar to refresh the badge after an SSE unread event fires.
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.user_id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = sessionUser.user_id;

  try {
    const rows = await sql<{ total_unread_count: number }[]>`
      SELECT COALESCE(SUM(unread.unread_count), 0)::int AS total_unread_count
      FROM goodhive.messenger_threads t
      LEFT JOIN goodhive.messenger_thread_reads tr
        ON tr.thread_id = t.id AND tr.user_id = ${userId}::uuid
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS unread_count
        FROM goodhive.messenger_messages um
        WHERE um.thread_id = t.id
          AND um.sender_user_id <> ${userId}::uuid
          AND um.created_at > COALESCE(tr.last_read_at, 'epoch'::timestamptz)
      ) unread ON TRUE
      WHERE t.company_user_id = ${userId}::uuid
         OR t.talent_user_id  = ${userId}::uuid
    `;

    return NextResponse.json({
      success: true,
      data: { totalUnreadCount: rows[0]?.total_unread_count ?? 0 },
    });
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch unread count" },
      { status: 500 },
    );
  }
}
