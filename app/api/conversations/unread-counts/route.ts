import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth/sessionUtils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await requireSession();

    const counts = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN ct.company_user_id = ${sessionUser.user_id}::uuid THEN unread.unread_count ELSE 0 END), 0)::int AS company_unread,
        COALESCE(SUM(CASE WHEN ct.talent_user_id = ${sessionUser.user_id}::uuid THEN unread.unread_count ELSE 0 END), 0)::int AS talent_unread
      FROM goodhive.conversation_threads ct
      INNER JOIN goodhive.conversation_participants cp
        ON cp.thread_id = ct.id
       AND cp.user_id = ${sessionUser.user_id}::uuid
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS unread_count
        FROM goodhive.conversation_messages cm
        WHERE cm.thread_id = ct.id
          AND cm.deleted_at IS NULL
          AND cm.sender_user_id <> ${sessionUser.user_id}::uuid
          AND (
            cp.last_read_at IS NULL
            OR cm.created_at > cp.last_read_at
          )
      ) unread ON TRUE
    `;

    const row = counts[0] || { company_unread: 0, talent_unread: 0 };

    return NextResponse.json(
      {
        totalUnread: (row.company_unread || 0) + (row.talent_unread || 0),
        companyUnread: row.company_unread || 0,
        talentUnread: row.talent_unread || 0,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    const maybeError = error as { code?: string; errno?: number };
    if (
      maybeError?.code === "ECONNREFUSED" ||
      maybeError?.code === "57P01" ||
      maybeError?.code === "ECONNRESET"
    ) {
      console.warn("Unread counts unavailable because the database is unreachable");
      return NextResponse.json(
        {
          totalUnread: 0,
          companyUnread: 0,
          talentUnread: 0,
          degraded: true,
        },
        { status: 200 },
      );
    }

    console.error("Error fetching unread counts:", error);
    return NextResponse.json(
      { message: "Failed to fetch unread counts" },
      { status: 500 },
    );
  }
}
