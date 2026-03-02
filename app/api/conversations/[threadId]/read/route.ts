import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth/sessionUtils";

interface MarkReadRequest {
  lastReadMessageId?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const sessionUser = await requireSession();
    const { threadId } = await params;
    const body: MarkReadRequest = await request.json().catch(() => ({}));

    const participantRows = await sql`
      SELECT id
      FROM goodhive.conversation_participants
      WHERE thread_id = ${threadId}::uuid
        AND user_id = ${sessionUser.user_id}::uuid
      LIMIT 1
    `;

    if (participantRows.length === 0) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 },
      );
    }

    let targetMessageRows;

    if (body.lastReadMessageId) {
      targetMessageRows = await sql`
        SELECT id, created_at
        FROM goodhive.conversation_messages
        WHERE id = ${body.lastReadMessageId}::uuid
          AND thread_id = ${threadId}::uuid
          AND deleted_at IS NULL
        LIMIT 1
      `;
    } else {
      targetMessageRows = await sql`
        SELECT id, created_at
        FROM goodhive.conversation_messages
        WHERE thread_id = ${threadId}::uuid
          AND deleted_at IS NULL
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `;
    }

    if (targetMessageRows.length === 0) {
      return NextResponse.json({ unreadCount: 0 }, { status: 200 });
    }

    const targetMessage = targetMessageRows[0];

    await sql`
      UPDATE goodhive.conversation_participants
      SET
        last_read_message_id = ${targetMessage.id}::uuid,
        last_read_at = ${targetMessage.created_at},
        updated_at = NOW()
      WHERE thread_id = ${threadId}::uuid
        AND user_id = ${sessionUser.user_id}::uuid
        AND (
          last_read_at IS NULL
          OR last_read_at < ${targetMessage.created_at}
        )
    `;

    return NextResponse.json({ unreadCount: 0 }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    console.error("Error marking conversation as read:", error);
    return NextResponse.json(
      { message: "Failed to update read state" },
      { status: 500 },
    );
  }
}

