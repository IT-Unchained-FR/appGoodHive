import sql from "@/lib/db";

export type ContactActorType = "company" | "talent";
export type ContactLogType = "direct" | "job_request" | "link_click";
export type LinkClickType = "github" | "linkedin" | "twitter" | "portfolio" | "website";

interface RecordContactLogParams {
  companyUserId: string;
  talentUserId: string;
  actorUserId: string;
  actorType: ContactActorType;
  contactType: ContactLogType;
  messagePreview?: string | null;
  jobId?: string | null;
  threadId?: string | null;
  jobRequestId?: string | null;
  linkType?: LinkClickType | null;
  linkUrl?: string | null;
  sourcePage?: string | null;
}

function trimPreview(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 500) : null;
}

export async function recordContactLog({
  companyUserId,
  talentUserId,
  actorUserId,
  actorType,
  contactType,
  messagePreview,
  jobId = null,
  threadId = null,
  jobRequestId = null,
  linkType = null,
  linkUrl = null,
  sourcePage = null,
}: RecordContactLogParams) {
  await sql`
    INSERT INTO goodhive.contact_logs (
      company_user_id,
      talent_user_id,
      job_id,
      thread_id,
      job_request_id,
      actor_user_id,
      actor_type,
      contact_type,
      message_preview,
      link_type,
      link_url,
      source_page,
      created_at,
      updated_at
    ) VALUES (
      ${companyUserId}::uuid,
      ${talentUserId}::uuid,
      ${jobId}::uuid,
      ${threadId}::uuid,
      ${jobRequestId}::uuid,
      ${actorUserId}::uuid,
      ${actorType},
      ${contactType},
      ${trimPreview(messagePreview)},
      ${linkType},
      ${linkUrl},
      ${sourcePage},
      NOW(),
      NOW()
    )
  `;
}
