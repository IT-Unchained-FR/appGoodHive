import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth/sessionUtils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const sessionUser = await requireSession();
    const { threadId } = await params;

    const threadRows = await sql`
      SELECT
        ct.id,
        ct.job_id,
        ct.job_application_id,
        ct.status,
        ct.created_at,
        ct.updated_at,
        ct.last_message_at,
        ct.last_message_preview,
        jo.title AS job_title,
        ja.status AS application_status,
        ct.talent_user_id,
        ja.applicant_name AS talent_name,
        ja.applicant_email AS talent_email,
        t.image_url AS talent_image_url,
        COALESCE(t.title, t.about_work, t.description) AS talent_headline,
        ct.company_user_id,
        COALESCE(c.designation, 'Company') AS company_name,
        c.image_url AS company_image_url,
        c.headline AS company_headline,
        cp.participant_role AS viewer_role,
        (cp.is_active = true AND cp.is_blocked = false AND ct.status NOT IN ('closed', 'blocked')) AS can_reply,
        CASE
          WHEN cp.participant_role = 'company' THEN talent_user.last_active
          ELSE company_user.last_active
        END AS counterpart_last_active_at,
        EXISTS (
          SELECT 1
          FROM goodhive.conversation_participants counterpart
          WHERE counterpart.thread_id = ct.id
            AND counterpart.user_id <> ${sessionUser.user_id}::uuid
            AND counterpart.typing_expires_at IS NOT NULL
            AND counterpart.typing_expires_at > NOW()
        ) AS counterpart_is_typing,
        (
          SELECT COUNT(DISTINCT cm.sender_role)
          FROM goodhive.conversation_messages cm
          WHERE cm.thread_id = ct.id
            AND cm.deleted_at IS NULL
            AND cm.sender_role IN ('company', 'talent')
        ) = 2 AS has_two_way_exchange
      FROM goodhive.conversation_threads ct
      INNER JOIN goodhive.job_applications ja
        ON ja.id = ct.job_application_id
      INNER JOIN goodhive.job_offers jo
        ON jo.id = ct.job_id
      LEFT JOIN goodhive.talents t
        ON t.user_id = ct.talent_user_id
      LEFT JOIN goodhive.companies c
        ON c.user_id = ct.company_user_id
      LEFT JOIN goodhive.users talent_user
        ON talent_user.userid = ct.talent_user_id
      LEFT JOIN goodhive.users company_user
        ON company_user.userid = ct.company_user_id
      INNER JOIN goodhive.conversation_participants cp
        ON cp.thread_id = ct.id
       AND cp.user_id = ${sessionUser.user_id}::uuid
      WHERE ct.id = ${threadId}::uuid
      LIMIT 1
    `;

    if (threadRows.length === 0) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 },
      );
    }

    const messages = await sql`
      SELECT
        id,
        thread_id,
        sender_user_id,
        sender_role,
        message_type,
        body,
        body_plaintext,
        created_at,
        edited_at
      FROM goodhive.conversation_messages
      WHERE thread_id = ${threadId}::uuid
        AND deleted_at IS NULL
      ORDER BY created_at ASC, id ASC
    `;

    return NextResponse.json(
      {
        thread: threadRows[0],
        messages,
        viewerUserId: sessionUser.user_id,
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

    console.error("Error fetching conversation thread:", error);
    return NextResponse.json(
      { message: "Failed to fetch conversation" },
      { status: 500 },
    );
  }
}
