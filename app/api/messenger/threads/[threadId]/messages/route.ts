import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import sql from "@/lib/db";
import type {
  CreateMessengerMessageRequest,
  MessengerMessage,
} from "@/interfaces/messenger";

const resend = new Resend(process.env.RESEND_API_KEY);
const GOODHIVE_BASE_URL =
  process.env.GOODHIVE_BASE_URL?.replace(/\/+$/, "") ??
  "https://app.goodhive.io";
const MESSAGES_APP_URL = `${GOODHIVE_BASE_URL}/messages`;
const MAX_MESSAGE_LENGTH = 5000;

function resolveActorUserId(request: NextRequest, fallback?: string | null) {
  return request.headers.get("x-user-id") ?? fallback ?? null;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function notifyRecipientAboutNewMessage(
  recipientUserId: string,
  senderUserId: string,
) {
  if (recipientUserId === senderUserId) {
    return;
  }

  try {
    const [recipientRows, senderRows] = await Promise.all([
      sql`
        SELECT email
        FROM goodhive.users
        WHERE userid = ${recipientUserId}::uuid
        LIMIT 1
      `,
      sql`
        SELECT
          COALESCE(
            NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),
            NULLIF(company_profile.designation, ''),
            NULLIF(talent_profile.title, ''),
            u.email,
            'GoodHive Member'
          ) AS sender_name
        FROM goodhive.users u
        LEFT JOIN goodhive.talents talent_profile
          ON talent_profile.user_id::text = u.userid::text
        LEFT JOIN goodhive.companies company_profile
          ON company_profile.user_id::text = u.userid::text
        WHERE u.userid = ${senderUserId}::uuid
        LIMIT 1
      `,
    ]);

    const recipientEmail = recipientRows[0]?.email?.trim();
    if (!recipientEmail) {
      return;
    }

    const senderName = (senderRows[0]?.sender_name?.trim() || "GoodHive member").slice(0, 120);
    const escapedSenderName = escapeHtml(senderName);
    const subject = `New message from ${senderName} on GoodHive`;
    const isDev = process.env.NODE_ENV !== "production";
    const testEmail = process.env.TEST_EMAIL?.trim();

    if (isDev && !testEmail) {
      console.warn("TEST_EMAIL env var not set — skipping email in dev");
      return;
    }

    const targetRecipient = isDev ? testEmail : recipientEmail;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;padding:24px;">
        <h2 style="margin:0 0 12px;color:#111827;">New message from ${escapedSenderName}</h2>
        <p style="margin:0 0 16px;color:#374151;">
          You have a new message from ${escapedSenderName}. Log in to GoodHive to read it and reply.
        </p>
        <a
          href="${MESSAGES_APP_URL}"
          style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;"
        >
          Open Messages
        </a>
        <p style="margin:20px 0 0;color:#6b7280;">The GoodHive Team 🐝</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "GoodHive <no-reply@goodhive.io>",
      to: [targetRecipient],
      subject: isDev ? `[TEST] ${subject}` : subject,
      html,
      text: `You have a new message from ${senderName}. Log in to GoodHive to read it and reply: ${MESSAGES_APP_URL}`,
    });

    if (error) {
      console.error("Failed to send message notification email:", error);
    }
  } catch (error) {
    console.error("Failed to prepare message notification email:", error);
  }
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

    if (messageText.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { message: `messageText must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
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

    const recipientUserId =
      access.thread.company_user_id === senderUserId
        ? access.thread.talent_user_id
        : access.thread.company_user_id;

    await notifyRecipientAboutNewMessage(recipientUserId, senderUserId);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Failed to send thread message:", error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 },
    );
  }
}
