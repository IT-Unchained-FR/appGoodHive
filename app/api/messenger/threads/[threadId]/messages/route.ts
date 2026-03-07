import { NextRequest, NextResponse } from "next/server";

import sql from "@/lib/db";
import type {
  CreateMessengerMessageRequest,
  MessengerMessage,
} from "@/interfaces/messenger";

function resolveActorUserId(request: NextRequest, fallback?: string | null) {
  return request.headers.get("x-user-id") ?? fallback ?? null;
}

async function assertThreadAccess(threadId: string, userId: string) {
  const rows = await sql`
    SELECT id, company_user_id, talent_user_id
    FROM goodhive.messenger_threads
    WHERE id = ${threadId}::uuid
    LIMIT 1
  `;

  if (rows.length === 0) {
    return { ok: false as const, status: 404, message: "Thread not found" };
  }

  const thread = rows[0];

  if (thread.company_user_id !== userId && thread.talent_user_id !== userId) {
    return { ok: false as const, status: 403, message: "Unauthorized" };
  }

  return { ok: true as const, thread };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const { threadId } = await params;
    const userId = request.nextUrl.searchParams.get("userId") ?? resolveActorUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 },
      );
    }

    const access = await assertThreadAccess(threadId, userId);
    if (!access.ok) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status },
      );
    }

    const limitValue = Number(request.nextUrl.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitValue)
      ? Math.min(Math.max(Math.trunc(limitValue), 1), 100)
      : 50;
    const before = request.nextUrl.searchParams.get("before");

    const rows = await sql`
      SELECT
        id,
        thread_id,
        sender_user_id,
        message_type,
        message_text,
        attachment_url,
        created_at,
        updated_at
      FROM goodhive.messenger_messages
      WHERE thread_id = ${threadId}::uuid
        AND (${before ?? null}::timestamptz IS NULL OR created_at < ${before ?? null}::timestamptz)
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const messages = [...rows].reverse() as MessengerMessage[];

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch thread messages:", error);
    return NextResponse.json(
      { message: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const { threadId } = await params;
    const body = (await request.json()) as CreateMessengerMessageRequest;

    const senderUserId = resolveActorUserId(request, body.senderUserId ?? null);
    const messageText = body.messageText?.trim();
    const messageType = body.messageType ?? "text";

    if (!senderUserId) {
      return NextResponse.json(
        { message: "senderUserId is required" },
        { status: 400 },
      );
    }

    if (!messageText) {
      return NextResponse.json(
        { message: "messageText is required" },
        { status: 400 },
      );
    }

    const access = await assertThreadAccess(threadId, senderUserId);
    if (!access.ok) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status },
      );
    }

    const createdRows = await sql`
      INSERT INTO goodhive.messenger_messages (
        thread_id,
        sender_user_id,
        message_type,
        message_text,
        attachment_url,
        created_at,
        updated_at
      ) VALUES (
        ${threadId}::uuid,
        ${senderUserId}::uuid,
        ${messageType},
        ${messageText},
        ${body.attachmentUrl ?? null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const message = createdRows[0] as MessengerMessage;

    await sql`
      UPDATE goodhive.messenger_threads
      SET
        last_message_at = ${message.created_at}::timestamptz,
        updated_at = NOW()
      WHERE id = ${threadId}::uuid
    `;

    await sql`
      INSERT INTO goodhive.messenger_thread_reads (thread_id, user_id, last_read_at, updated_at)
      VALUES (${threadId}::uuid, ${senderUserId}::uuid, NOW(), NOW())
      ON CONFLICT (thread_id, user_id)
      DO UPDATE SET
        last_read_at = EXCLUDED.last_read_at,
        updated_at = EXCLUDED.updated_at
    `;

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Failed to send thread message:", error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 },
    );
  }
}
