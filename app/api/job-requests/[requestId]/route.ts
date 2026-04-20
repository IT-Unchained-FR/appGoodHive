import { NextRequest, NextResponse } from "next/server";

import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import type { JobRequestStatus } from "@/interfaces/messenger";

const VALID_STATUSES: JobRequestStatus[] = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "declined",
  "withdrawn",
  "archived",
];

const STATUS_DISPLAY: Record<JobRequestStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

function canTransitionStatus({
  currentStatus,
  nextStatus,
  isCompany,
  isTalent,
}: {
  currentStatus: JobRequestStatus;
  nextStatus: JobRequestStatus;
  isCompany: boolean;
  isTalent: boolean;
}) {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (nextStatus === "viewed") {
    return currentStatus === "sent" && isTalent;
  }

  if (nextStatus === "accepted" || nextStatus === "declined") {
    return (currentStatus === "sent" || currentStatus === "viewed") && isTalent;
  }

  if (nextStatus === "withdrawn") {
    return (currentStatus === "sent" || currentStatus === "viewed") && isCompany;
  }

  if (nextStatus === "archived") {
    return (
      currentStatus === "accepted" ||
      currentStatus === "declined" ||
      currentStatus === "withdrawn"
    );
  }

  if (nextStatus === "sent") {
    return currentStatus === "draft" && isCompany;
  }

  return false;
}

function resolveActorUserId(request: NextRequest, fallback?: string | null) {
  return request.headers.get("x-user-id") ?? fallback ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { requestId } = await params;
    const sessionUser = await getSessionUser();
    const userId =
      sessionUser?.user_id ??
      request.nextUrl.searchParams.get("userId") ??
      resolveActorUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const rows = await sql`
      SELECT *
      FROM goodhive.job_requests
      WHERE id = ${requestId}::uuid
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    const row = rows[0];

    if (row.company_user_id !== userId && row.talent_user_id !== userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 },
      );
    }

    return NextResponse.json({ request: row }, { status: 200 });
  } catch (error) {
    console.error("Failed to get job request:", error);
    return NextResponse.json(
      { message: "Failed to get job request" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { requestId } = await params;
    const sessionUser = await getSessionUser();
    const body = await request.json();
    const userId =
      sessionUser?.user_id ?? resolveActorUserId(request, body.userId ?? null);
    const status = body.status as JobRequestStatus | undefined;

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { message: "Valid status is required" },
        { status: 400 },
      );
    }

    const existingRows = await sql`
      SELECT *
      FROM goodhive.job_requests
      WHERE id = ${requestId}::uuid
      LIMIT 1
    `;

    if (existingRows.length === 0) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    const existing = existingRows[0];
    const isCompany = existing.company_user_id === userId;
    const isTalent = existing.talent_user_id === userId;

    if (!isCompany && !isTalent) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 },
      );
    }

    const currentStatus = existing.status as JobRequestStatus;

    if (
      !canTransitionStatus({
        currentStatus,
        nextStatus: status,
        isCompany,
        isTalent,
      })
    ) {
      return NextResponse.json(
        {
          message: `Invalid status transition from ${currentStatus} to ${status}`,
        },
        { status: 409 },
      );
    }

    if (currentStatus === status) {
      return NextResponse.json(
        { request: existing },
        { status: 200 },
      );
    }

    const updatedRows = await sql`
      UPDATE goodhive.job_requests
      SET
        status = ${status},
        updated_at = NOW()
      WHERE id = ${requestId}::uuid
      RETURNING *
    `;

    const threadRows = await sql`
      SELECT id
      FROM goodhive.messenger_threads
      WHERE job_request_id = ${requestId}::uuid
      LIMIT 1
    `;

    const threadId = threadRows[0]?.id as string | undefined;
    let statusMessage = null;

    if (threadId) {
      const statusMessageRows = await sql`
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
          ${userId}::uuid,
          'system',
          ${`Request status updated to ${STATUS_DISPLAY[status]}.`},
          NULL,
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      statusMessage = statusMessageRows[0] ?? null;

      if (statusMessage?.created_at) {
        await sql`
          UPDATE goodhive.messenger_threads
          SET
            last_message_at = ${statusMessage.created_at}::timestamptz,
            updated_at = NOW()
          WHERE id = ${threadId}::uuid
        `;

        await sql`
          INSERT INTO goodhive.messenger_thread_reads (thread_id, user_id, last_read_at, updated_at)
          VALUES (${threadId}::uuid, ${userId}::uuid, ${statusMessage.created_at}::timestamptz, NOW())
          ON CONFLICT (thread_id, user_id)
          DO UPDATE SET
            last_read_at = EXCLUDED.last_read_at,
            updated_at = EXCLUDED.updated_at
        `;
      }
    }

    return NextResponse.json(
      {
        request: updatedRows[0],
        statusMessage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update job request:", error);
    return NextResponse.json(
      { message: "Failed to update job request" },
      { status: 500 },
    );
  }
}
