import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import { recordContactLog, type ContactActorType, type ContactLogType, type LinkClickType } from "@/lib/contact-logs";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

function isActorType(value: unknown): value is ContactActorType {
  return value === "company" || value === "talent";
}

function isContactType(value: unknown): value is ContactLogType {
  return value === "direct" || value === "job_request" || value === "link_click";
}

function isLinkClickType(value: unknown): value is LinkClickType {
  return (
    value === "github" ||
    value === "linkedin" ||
    value === "twitter" ||
    value === "portfolio" ||
    value === "website"
  );
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeOptionalUuid(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.user_id;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const logs = await sql`
      SELECT
        cl.id,
        cl.company_user_id,
        cl.talent_user_id,
        cl.job_id,
        cl.thread_id,
        cl.job_request_id,
        cl.actor_user_id,
        cl.actor_type,
        cl.contact_type,
        cl.message_preview,
        cl.created_at,
        cl.updated_at,
        CASE
          WHEN cl.company_user_id = ${userId}::uuid THEN 'company'
          ELSE 'talent'
        END AS viewer_type,
        CASE
          WHEN cl.actor_user_id = ${userId}::uuid THEN 'sent'
          ELSE 'received'
        END AS direction,
        CASE
          WHEN cl.company_user_id = ${userId}::uuid THEN cl.talent_user_id
          ELSE cl.company_user_id
        END AS other_user_id,
        CASE
          WHEN cl.company_user_id = ${userId}::uuid THEN 'talent'
          ELSE 'company'
        END AS other_user_type,
        CASE
          WHEN cl.company_user_id = ${userId}::uuid
            THEN COALESCE(
              NULLIF(TRIM(CONCAT_WS(' ', talent_profile.first_name, talent_profile.last_name)), ''),
              talent_user.email,
              'GoodHive Talent'
            )
          ELSE COALESCE(
            NULLIF(company_profile.designation, ''),
            NULLIF(TRIM(CONCAT_WS(' ', company_user.first_name, company_user.last_name)), ''),
            company_user.email,
            'GoodHive Company'
          )
        END AS other_user_name,
        CASE
          WHEN cl.company_user_id = ${userId}::uuid THEN NULLIF(talent_profile.image_url, '')
          ELSE NULLIF(company_profile.image_url, '')
        END AS other_user_avatar,
        CASE
          WHEN cl.company_user_id = ${userId}::uuid THEN NULLIF(talent_profile.title, '')
          ELSE COALESCE(NULLIF(company_profile.headline, ''), NULLIF(company_profile.designation, ''))
        END AS other_user_headline,
        jo.title AS job_title
      FROM goodhive.contact_logs cl
      LEFT JOIN goodhive.users company_user
        ON company_user.userid = cl.company_user_id
      LEFT JOIN goodhive.users talent_user
        ON talent_user.userid = cl.talent_user_id
      LEFT JOIN goodhive.companies company_profile
        ON company_profile.user_id::text = cl.company_user_id::text
      LEFT JOIN goodhive.talents talent_profile
        ON talent_profile.user_id::text = cl.talent_user_id::text
      LEFT JOIN goodhive.job_offers jo
        ON jo.id = cl.job_id
      WHERE cl.company_user_id = ${userId}::uuid
         OR cl.talent_user_id = ${userId}::uuid
      ORDER BY cl.created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch contact logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact logs" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.user_id;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const companyUserId = normalizeOptionalUuid(body.companyUserId);
    const talentUserId = normalizeOptionalUuid(body.talentUserId);
    const actorType = body.actorType;
    const contactType = body.contactType;
    const messagePreview = typeof body.messagePreview === "string" ? body.messagePreview : null;
    const rawLinkType = body.linkType;
    const linkType = isLinkClickType(rawLinkType) ? rawLinkType : null;
    const linkUrl = normalizeOptionalString(body.linkUrl);
    const sourcePage = normalizeOptionalString(body.sourcePage);

    if (!companyUserId || !talentUserId || !isActorType(actorType) || !isContactType(contactType)) {
      return NextResponse.json(
        { success: false, error: "companyUserId, talentUserId, actorType, and contactType are required" },
        { status: 400 },
      );
    }

    if (contactType === "link_click" && (!linkType || !linkUrl)) {
      return NextResponse.json(
        { success: false, error: "linkType and linkUrl are required for link clicks" },
        { status: 400 },
      );
    }

    if (userId !== companyUserId && userId !== talentUserId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if ((actorType === "company" && userId !== companyUserId) || (actorType === "talent" && userId !== talentUserId)) {
      return NextResponse.json({ success: false, error: "Actor type does not match current user" }, { status: 403 });
    }

    await recordContactLog({
      companyUserId,
      talentUserId,
      actorUserId: userId,
      actorType,
      contactType,
      messagePreview,
      jobId: normalizeOptionalUuid(body.jobId),
      threadId: normalizeOptionalUuid(body.threadId),
      jobRequestId: normalizeOptionalUuid(body.jobRequestId),
      linkType,
      linkUrl,
      sourcePage,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to create contact log:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create contact log" },
      { status: 500 },
    );
  }
}
