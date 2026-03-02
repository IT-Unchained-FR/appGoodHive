import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth/sessionUtils";
import {
  buildCompanyThreadUrl,
  buildTalentThreadUrl,
  createNotificationEvent,
  markNotificationEmailed,
  sendConversationMessageEmail,
  shouldSendNotificationEmail,
} from "@/lib/notifications/conversationNotifications";

interface SendMessageRequest {
  body: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const sessionUser = await requireSession();
    const { threadId } = await params;
    const body: SendMessageRequest = await request.json();
    const messageBody = body.body?.trim();

    if (!messageBody) {
      return NextResponse.json(
        { message: "Message body is required" },
        { status: 400 },
      );
    }

    if (messageBody.length > 5000) {
      return NextResponse.json(
        { message: "Message is too long" },
        { status: 400 },
      );
    }

    const participantRows = await sql`
      SELECT
        cp.participant_role,
        cp.is_active,
        cp.is_blocked,
        ct.status,
        ct.company_user_id,
        ct.talent_user_id,
        jo.title AS job_title,
        COALESCE(c.designation, 'Company') AS company_name,
        ja.applicant_name AS talent_name,
        company_user.email AS company_email,
        talent_user.email AS talent_email
      FROM goodhive.conversation_participants cp
      INNER JOIN goodhive.conversation_threads ct
        ON ct.id = cp.thread_id
      INNER JOIN goodhive.job_offers jo
        ON jo.id = ct.job_id
      INNER JOIN goodhive.job_applications ja
        ON ja.id = ct.job_application_id
      LEFT JOIN goodhive.companies c
        ON c.user_id = ct.company_user_id
      LEFT JOIN goodhive.users company_user
        ON company_user.userid = ct.company_user_id
      LEFT JOIN goodhive.users talent_user
        ON talent_user.userid = ct.talent_user_id
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
        { message: "You cannot send messages in this conversation" },
        { status: 403 },
      );
    }

    if (participant.status === "closed" || participant.status === "blocked") {
      return NextResponse.json(
        { message: "This conversation is closed" },
        { status: 409 },
      );
    }

    const previewText = messageBody.replace(/\s+/g, " ").slice(0, 240);
    const nextStatus =
      participant.participant_role === "company"
        ? "awaiting_talent"
        : "awaiting_company";

    const result = await sql.begin(async (tx) => {
      const messageRows = await tx`
        INSERT INTO goodhive.conversation_messages (
          thread_id,
          sender_user_id,
          sender_role,
          message_type,
          body,
          body_plaintext,
          created_at
        ) VALUES (
          ${threadId}::uuid,
          ${sessionUser.user_id}::uuid,
          ${participant.participant_role},
          'text',
          ${messageBody},
          ${messageBody},
          NOW()
        )
        RETURNING
          id,
          thread_id,
          sender_user_id,
          sender_role,
          message_type,
          body,
          body_plaintext,
          created_at,
          edited_at
      `;

      const createdMessage = messageRows[0];

      await tx`
        UPDATE goodhive.conversation_threads
        SET
          status = ${nextStatus}::goodhive.conversation_thread_status,
          last_message_at = ${createdMessage.created_at},
          last_message_preview = ${previewText},
          updated_at = NOW()
        WHERE id = ${threadId}::uuid
      `;

      await tx`
        UPDATE goodhive.conversation_participants
        SET
          last_read_message_id = ${createdMessage.id}::uuid,
          last_read_at = ${createdMessage.created_at},
          typing_started_at = NULL,
          typing_expires_at = NULL,
          updated_at = NOW()
        WHERE thread_id = ${threadId}::uuid
          AND user_id = ${sessionUser.user_id}::uuid
      `;

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

      return { createdMessage, nextStatus };
    });

    const recipientUserId =
      participant.participant_role === "company"
        ? participant.talent_user_id
        : participant.company_user_id;
    const recipientEmail =
      participant.participant_role === "company"
        ? participant.talent_email
        : participant.company_email;
    const recipientName =
      participant.participant_role === "company"
        ? participant.talent_name || "there"
        : participant.company_name || "there";
    const senderName =
      participant.participant_role === "company"
        ? participant.company_name || "Company"
        : participant.talent_name || "Talent";
    const threadUrl =
      participant.participant_role === "company"
        ? buildTalentThreadUrl(threadId)
        : buildCompanyThreadUrl(threadId);

    const notificationEventId = await createNotificationEvent({
      userId: recipientUserId,
      eventType: "new_message",
      threadId,
      messageId: result.createdMessage.id,
      metadata: {
        jobTitle: participant.job_title,
        senderName,
      },
    });

    if (recipientEmail) {
      const shouldEmail = await shouldSendNotificationEmail({
        userId: recipientUserId,
        threadId,
        eventType: "new_message",
      });

      if (shouldEmail) {
        const emailSent = await sendConversationMessageEmail({
          recipientEmail,
          recipientName,
          senderName,
          jobTitle: participant.job_title,
          messageBody,
          threadUrl,
        });

        if (emailSent && notificationEventId) {
          await markNotificationEmailed(notificationEventId);
        }
      }
    }

    return NextResponse.json(
      {
        message: result.createdMessage,
        threadStatus: result.nextStatus,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    console.error("Error sending message:", error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 },
    );
  }
}
