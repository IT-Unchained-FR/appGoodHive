import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import type {
  CreateMessengerThreadRequest,
  MessengerThread,
  MessengerThreadListItem,
} from "@/interfaces/messenger";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.user_id ?? null;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const parsedLimit = limitParam ? Number(limitParam) : null;
    const limit =
      parsedLimit && Number.isFinite(parsedLimit)
        ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 100)
        : null;

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const rows = await sql`
      SELECT
        t.id,
        t.company_user_id,
        t.talent_user_id,
        t.thread_type,
        t.job_id,
        t.job_application_id,
        t.job_request_id,
        t.created_by_user_id,
        t.last_message_at,
        t.created_at,
        t.updated_at,
        CASE
          WHEN t.company_user_id = ${userId}::uuid THEN t.talent_user_id
          ELSE t.company_user_id
        END AS other_user_id,
        CASE
          WHEN t.company_user_id = ${userId}::uuid THEN 'talent'
          ELSE 'company'
        END AS other_user_role,
        CASE
          WHEN t.company_user_id = ${userId}::uuid
            THEN COALESCE(NULLIF(TRIM(CONCAT_WS(' ', talent_profile.first_name, talent_profile.last_name)), ''), other_u.email, 'GoodHive Talent')
          ELSE
            COALESCE(NULLIF(company_profile.designation, ''), other_u.email, 'GoodHive Company')
        END AS other_user_name,
        CASE
          WHEN t.company_user_id = ${userId}::uuid THEN NULLIF(talent_profile.image_url, '')
          ELSE NULLIF(company_profile.image_url, '')
        END AS other_user_avatar,
        CASE
          WHEN t.company_user_id = ${userId}::uuid THEN NULLIF(talent_profile.title, '')
          ELSE COALESCE(NULLIF(company_profile.headline, ''), NULLIF(company_profile.designation, ''))
        END AS other_user_headline,
        CASE
          WHEN t.company_user_id = ${userId}::uuid THEN NULLIF(talent_profile.skills, '')
          ELSE NULL
        END AS other_user_skills,
        CASE
          WHEN t.company_user_id = ${userId}::uuid
            THEN NULLIF(TRIM(CONCAT_WS(', ', talent_profile.city, talent_profile.country)), '')
          ELSE NULL
        END AS other_user_location,
        CASE
          WHEN t.company_user_id = ${userId}::uuid
            THEN LEFT(NULLIF(TRIM(talent_profile.about_work), ''), 200)
          ELSE LEFT(NULLIF(TRIM(company_profile.description), ''), 200)
        END AS other_user_bio,
        lm.id AS last_message_id,
        lm.message_text AS last_message_text,
        lm.sender_user_id AS last_message_sender_user_id,
        COALESCE(unread.unread_count, 0) AS unread_count
      FROM goodhive.messenger_threads t
      LEFT JOIN LATERAL (
        SELECT m.id, m.message_text, m.sender_user_id, m.created_at
        FROM goodhive.messenger_messages m
        WHERE m.thread_id = t.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON TRUE
      LEFT JOIN goodhive.messenger_thread_reads tr
        ON tr.thread_id = t.id AND tr.user_id = ${userId}::uuid
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS unread_count
        FROM goodhive.messenger_messages um
        WHERE um.thread_id = t.id
          AND um.sender_user_id <> ${userId}::uuid
          AND um.created_at > COALESCE(tr.last_read_at, 'epoch'::timestamptz)
      ) unread ON TRUE
      LEFT JOIN goodhive.users other_u
        ON other_u.userid = CASE
          WHEN t.company_user_id = ${userId}::uuid THEN t.talent_user_id
          ELSE t.company_user_id
        END
      LEFT JOIN goodhive.talents talent_profile
        ON talent_profile.user_id::text = other_u.userid::text
      LEFT JOIN goodhive.companies company_profile
        ON company_profile.user_id::text = other_u.userid::text
      WHERE t.company_user_id = ${userId}::uuid
         OR t.talent_user_id = ${userId}::uuid
      ORDER BY COALESCE(lm.created_at, t.updated_at) DESC
      LIMIT ${limit}
    `;

    const unreadSummaryRows = await sql`
      SELECT COALESCE(SUM(unread.unread_count), 0)::int AS total_unread_count
      FROM goodhive.messenger_threads t
      LEFT JOIN goodhive.messenger_thread_reads tr
        ON tr.thread_id = t.id AND tr.user_id = ${userId}::uuid
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS unread_count
        FROM goodhive.messenger_messages um
        WHERE um.thread_id = t.id
          AND um.sender_user_id <> ${userId}::uuid
          AND um.created_at > COALESCE(tr.last_read_at, 'epoch'::timestamptz)
      ) unread ON TRUE
      WHERE t.company_user_id = ${userId}::uuid
         OR t.talent_user_id = ${userId}::uuid
    `;

    const threads: MessengerThreadListItem[] = rows.map((row: any) => ({
      ...row,
      unread_count: Number(row.unread_count || 0),
    }));
    const totalUnreadCount = Number(unreadSummaryRows[0]?.total_unread_count || 0);

    return NextResponse.json({ threads, totalUnreadCount }, { status: 200 });
  } catch (error) {
    console.error("Failed to list messenger threads:", error);
    return NextResponse.json(
      { message: "Failed to list threads" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const actorId = sessionUser?.user_id ?? null;

    if (!actorId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as CreateMessengerThreadRequest;
    const {
      companyUserId,
      talentUserId,
      threadType,
      jobId,
      jobApplicationId,
      jobRequestId,
    } = body;

    if (!companyUserId || !talentUserId) {
      return NextResponse.json(
        { message: "companyUserId and talentUserId are required" },
        { status: 400 },
      );
    }

    if (companyUserId === talentUserId) {
      return NextResponse.json(
        { message: "companyUserId and talentUserId must be different" },
        { status: 400 },
      );
    }

    if (actorId !== companyUserId && actorId !== talentUserId) {
      return NextResponse.json(
        { message: "Actor must be a participant in the thread" },
        { status: 403 },
      );
    }

    const [companyRows, talentRows] = await Promise.all([
      sql<{ user_id: string; published: boolean }[]>`
        SELECT user_id, published
        FROM goodhive.companies
        WHERE user_id = ${companyUserId}::uuid
        LIMIT 1
      `,
      sql<{ user_id: string; talent_status: string | null }[]>`
        SELECT t.user_id, u.talent_status
        FROM goodhive.talents t
        LEFT JOIN goodhive.users u ON u.userid = t.user_id
        WHERE t.user_id = ${talentUserId}::uuid
        LIMIT 1
      `,
    ]);

    if (companyRows.length === 0) {
      return NextResponse.json(
        { message: "companyUserId must belong to a company profile" },
        { status: 400 },
      );
    }

    if (talentRows.length === 0) {
      return NextResponse.json(
        { message: "talentUserId must belong to a talent profile" },
        { status: 400 },
      );
    }

    if (!companyRows[0].published) {
      return NextResponse.json(
        { message: "Company profile is not yet approved" },
        { status: 403 },
      );
    }

    if (talentRows[0].talent_status !== "approved") {
      return NextResponse.json(
        { message: "Talent profile is not yet approved" },
        { status: 403 },
      );
    }

    const effectiveThreadType =
      threadType ??
      (jobApplicationId ? "application" : jobRequestId ? "request" : jobId ? "job" : "direct");

    let existingRows: MessengerThread[] = [];

    if (jobApplicationId) {
      existingRows = await sql`
        SELECT *
        FROM goodhive.messenger_threads
        WHERE job_application_id = ${jobApplicationId}::int
        LIMIT 1
      `;
    } else if (jobRequestId) {
      existingRows = await sql`
        SELECT *
        FROM goodhive.messenger_threads
        WHERE job_request_id = ${jobRequestId}::uuid
        LIMIT 1
      `;
    } else {
      existingRows = await sql`
        SELECT *
        FROM goodhive.messenger_threads
        WHERE company_user_id = ${companyUserId}::uuid
          AND talent_user_id = ${talentUserId}::uuid
          AND thread_type = ${effectiveThreadType}
          AND COALESCE(job_id::text, '') = COALESCE(${jobId ?? null}::text, '')
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }

    if (existingRows.length > 0) {
      return NextResponse.json(
        { thread: existingRows[0], created: false },
        { status: 200 },
      );
    }

    const created = await sql`
      INSERT INTO goodhive.messenger_threads (
        company_user_id,
        talent_user_id,
        thread_type,
        job_id,
        job_application_id,
        job_request_id,
        created_by_user_id,
        created_at,
        updated_at
      ) VALUES (
        ${companyUserId}::uuid,
        ${talentUserId}::uuid,
        ${effectiveThreadType},
        ${jobId ?? null}::uuid,
        ${jobApplicationId ?? null}::int,
        ${jobRequestId ?? null}::uuid,
        ${actorId}::uuid,
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const thread = created[0] as MessengerThread;

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

    return NextResponse.json(
      { thread, created: true },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create messenger thread:", error);
    return NextResponse.json(
      { message: "Failed to create thread" },
      { status: 500 },
    );
  }
}
