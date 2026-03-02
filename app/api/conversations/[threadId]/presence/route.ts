import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth/sessionUtils";

interface PresenceRequest {
  isTyping?: boolean;
}

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const sessionUser = await requireSession();
    const { threadId } = await params;
    const body: PresenceRequest = await request.json().catch(() => ({}));

    if (
      body.isTyping !== undefined &&
      typeof body.isTyping !== "boolean"
    ) {
      return NextResponse.json(
        { message: "isTyping must be a boolean" },
        { status: 400 },
      );
    }

    const participantRows = await sql`
      SELECT
        cp.id,
        cp.is_active,
        cp.is_blocked,
        ct.status
      FROM goodhive.conversation_participants cp
      INNER JOIN goodhive.conversation_threads ct
        ON ct.id = cp.thread_id
      WHERE cp.thread_id = ${threadId}::uuid
        AND cp.user_id = ${sessionUser.user_id}::uuid
      LIMIT 1
    `;

    if (participantRows.length === 0) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 },
      );
    }

    const participant = participantRows[0];

    if (!participant.is_active || participant.is_blocked) {
      return NextResponse.json(
        { message: "You cannot update presence in this conversation" },
        { status: 403 },
      );
    }

    if (participant.status === "closed" || participant.status === "blocked") {
      return NextResponse.json(
        { message: "This conversation is closed" },
        { status: 409 },
      );
    }

    await sql.begin(async (tx) => {
      await tx`
        UPDATE goodhive.users
        SET last_active = NOW()
        WHERE userid = ${sessionUser.user_id}::uuid
      `;

      await tx`
        UPDATE goodhive.talents
        SET last_active = NOW()
        WHERE user_id = ${sessionUser.user_id}::uuid
      `;

      if (body.isTyping === undefined) {
        await tx`
          UPDATE goodhive.conversation_participants
          SET updated_at = NOW()
          WHERE thread_id = ${threadId}::uuid
            AND user_id = ${sessionUser.user_id}::uuid
        `;
        return;
      }

      await tx`
        UPDATE goodhive.conversation_participants
        SET
          typing_started_at = CASE
            WHEN ${body.isTyping}::boolean THEN COALESCE(typing_started_at, NOW())
            ELSE NULL
          END,
          typing_expires_at = CASE
            WHEN ${body.isTyping}::boolean THEN NOW() + INTERVAL '6 seconds'
            ELSE NULL
          END,
          updated_at = NOW()
        WHERE thread_id = ${threadId}::uuid
          AND user_id = ${sessionUser.user_id}::uuid
      `;
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    console.error("Error updating conversation presence:", error);
    return NextResponse.json(
      { message: "Failed to update presence" },
      { status: 500 },
    );
  }
}
