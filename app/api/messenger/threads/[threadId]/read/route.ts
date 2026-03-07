import { NextRequest, NextResponse } from "next/server";

import sql from "@/lib/db";
import type { MarkThreadReadRequest } from "@/interfaces/messenger";

function resolveActorUserId(request: NextRequest, fallback?: string | null) {
  return request.headers.get("x-user-id") ?? fallback ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const { threadId } = await params;
    const body = (await request.json()) as MarkThreadReadRequest;
    const userId = resolveActorUserId(request, body.userId ?? null);

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 },
      );
    }

    const threadRows = await sql`
      SELECT id, company_user_id, talent_user_id, job_request_id
      FROM goodhive.messenger_threads
      WHERE id = ${threadId}::uuid
      LIMIT 1
    `;

    if (threadRows.length === 0) {
      return NextResponse.json(
        { message: "Thread not found" },
        { status: 404 },
      );
    }

    const thread = threadRows[0];

    if (thread.company_user_id !== userId && thread.talent_user_id !== userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 },
      );
    }

    const readAt = body.readAt ?? new Date().toISOString();

    await sql`
      INSERT INTO goodhive.messenger_thread_reads (thread_id, user_id, last_read_at, updated_at)
      VALUES (${threadId}::uuid, ${userId}::uuid, ${readAt}::timestamptz, NOW())
      ON CONFLICT (thread_id, user_id)
      DO UPDATE SET
        last_read_at = EXCLUDED.last_read_at,
        updated_at = EXCLUDED.updated_at
    `;

    if (thread.job_request_id && userId === thread.talent_user_id) {
      await sql`
        UPDATE goodhive.job_requests
        SET
          status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END,
          updated_at = NOW()
        WHERE id = ${thread.job_request_id}::uuid
      `;
    }

    return NextResponse.json(
      {
        message: "Thread marked as read",
        threadId,
        userId,
        readAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to mark thread as read:", error);
    return NextResponse.json(
      { message: "Failed to mark thread as read" },
      { status: 500 },
    );
  }
}
