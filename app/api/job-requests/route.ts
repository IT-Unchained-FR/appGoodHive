import { NextRequest, NextResponse } from "next/server";

import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import type { CreateJobRequestBody, JobRequest } from "@/interfaces/messenger";

function resolveActorUserId(request: NextRequest, fallback?: string | null) {
  return request.headers.get("x-user-id") ?? fallback ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const userId =
      sessionUser?.user_id ??
      request.nextUrl.searchParams.get("userId") ??
      resolveActorUserId(request);
    const role = request.nextUrl.searchParams.get("role") ?? "both";
    const status = request.nextUrl.searchParams.get("status");

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const rows = await sql`
      SELECT
        jr.*,
        COALESCE(
          NULLIF(company_profile.designation, ''),
          NULLIF(TRIM(CONCAT_WS(' ', company_user.first_name, company_user.last_name)), ''),
          company_user.email,
          'Company'
        ) AS company_name,
        NULLIF(company_profile.image_url, '') AS company_avatar,
        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', talent_user.first_name, talent_user.last_name)), ''),
          NULLIF(talent_profile.title, ''),
          talent_user.email,
          'Talent'
        ) AS talent_name,
        NULLIF(talent_profile.image_url, '') AS talent_avatar,
        CASE
          WHEN jr.company_user_id = ${userId}::uuid THEN jr.talent_user_id
          ELSE jr.company_user_id
        END AS other_user_id
      FROM goodhive.job_requests jr
      LEFT JOIN goodhive.users company_user
        ON company_user.userid = jr.company_user_id
      LEFT JOIN goodhive.users talent_user
        ON talent_user.userid = jr.talent_user_id
      LEFT JOIN goodhive.companies company_profile
        ON company_profile.user_id::text = jr.company_user_id::text
      LEFT JOIN goodhive.talents talent_profile
        ON talent_profile.user_id::text = jr.talent_user_id::text
      WHERE
        (
          (${role} = 'company' AND jr.company_user_id = ${userId}::uuid)
          OR (${role} = 'talent' AND jr.talent_user_id = ${userId}::uuid)
          OR (
            ${role} = 'both'
            AND (jr.company_user_id = ${userId}::uuid OR jr.talent_user_id = ${userId}::uuid)
          )
        )
        AND (${status ?? null}::text IS NULL OR jr.status = ${status ?? null})
      ORDER BY jr.created_at DESC
    `;

    return NextResponse.json({ requests: rows }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch job requests:", error);
    return NextResponse.json(
      { message: "Failed to fetch job requests" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const body = (await request.json()) as CreateJobRequestBody;
    const {
      companyUserId,
      talentUserId,
      title,
      requestMessage,
      jobId,
      actorUserId,
    } = body;

    const actorId = sessionUser?.user_id ?? resolveActorUserId(request, actorUserId ?? null);

    if (!companyUserId || !talentUserId || !title?.trim()) {
      return NextResponse.json(
        { message: "companyUserId, talentUserId and title are required" },
        { status: 400 },
      );
    }

    if (companyUserId === talentUserId) {
      return NextResponse.json(
        { message: "companyUserId and talentUserId must be different" },
        { status: 400 },
      );
    }

    if (!actorId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (actorId !== companyUserId && actorId !== talentUserId) {
      return NextResponse.json(
        { message: "Actor must be a participant in the request" },
        { status: 403 },
      );
    }

    const normalizedRequestMessage = requestMessage?.trim() || null;

    const createdRequestRows = await sql`
      INSERT INTO goodhive.job_requests (
        company_user_id,
        talent_user_id,
        job_id,
        title,
        request_message,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${companyUserId}::uuid,
        ${talentUserId}::uuid,
        ${jobId ?? null}::uuid,
        ${title.trim()},
        ${normalizedRequestMessage},
        'sent',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const jobRequest = createdRequestRows[0] as JobRequest;

    const threadRows = await sql`
      INSERT INTO goodhive.messenger_threads (
        company_user_id,
        talent_user_id,
        thread_type,
        job_id,
        job_request_id,
        created_by_user_id,
        created_at,
        updated_at
      ) VALUES (
        ${companyUserId}::uuid,
        ${talentUserId}::uuid,
        'request',
        ${jobId ?? null}::uuid,
        ${jobRequest.id}::uuid,
        ${actorId}::uuid,
        NOW(),
        NOW()
      )
      ON CONFLICT (job_request_id)
      DO UPDATE SET updated_at = NOW()
      RETURNING *
    `;

    const thread = threadRows[0];
    let initialMessage = null;

    await sql`
      INSERT INTO goodhive.messenger_thread_reads (thread_id, user_id, last_read_at, updated_at)
      VALUES
        (${thread.id}::uuid, ${companyUserId}::uuid, NOW(), NOW()),
        (${thread.id}::uuid, ${talentUserId}::uuid, NOW(), NOW())
      ON CONFLICT (thread_id, user_id)
      DO UPDATE SET
        last_read_at = EXCLUDED.last_read_at,
        updated_at = EXCLUDED.updated_at
    `;

    if (normalizedRequestMessage) {
      const initialMessageRows = await sql`
        INSERT INTO goodhive.messenger_messages (
          thread_id,
          sender_user_id,
          message_type,
          message_text,
          attachment_url,
          created_at,
          updated_at
        ) VALUES (
          ${thread.id}::uuid,
          ${actorId}::uuid,
          'text',
          ${normalizedRequestMessage},
          NULL,
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      initialMessage = initialMessageRows[0] ?? null;

      if (initialMessage?.created_at) {
        await sql`
          UPDATE goodhive.messenger_threads
          SET
            last_message_at = ${initialMessage.created_at}::timestamptz,
            updated_at = NOW()
          WHERE id = ${thread.id}::uuid
        `;

        await sql`
          INSERT INTO goodhive.messenger_thread_reads (thread_id, user_id, last_read_at, updated_at)
          VALUES (${thread.id}::uuid, ${actorId}::uuid, ${initialMessage.created_at}::timestamptz, NOW())
          ON CONFLICT (thread_id, user_id)
          DO UPDATE SET
            last_read_at = EXCLUDED.last_read_at,
            updated_at = EXCLUDED.updated_at
        `;
      }
    }

    return NextResponse.json(
      {
        request: jobRequest,
        thread,
        initialMessage,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create job request:", error);
    return NextResponse.json(
      { message: "Failed to create job request" },
      { status: 500 },
    );
  }
}
