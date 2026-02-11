import sql from "@/lib/ragDb";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SessionRow = {
  id: string;
  channel: string;
  telegram_chat_id: string | null;
  fields: unknown;
};

type ConsentRow = {
  metadata: unknown;
  created_at: string;
};

type LeadRow = {
  fields: unknown;
};

const parseObject = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId")?.trim() ?? "";

  if (!UUID_PATTERN.test(sessionId)) {
    return Response.json({ error: "Valid sessionId is required" }, { status: 400 });
  }

  const sessionRows = await sql<SessionRow[]>`
    SELECT id, channel, telegram_chat_id, fields
    FROM goodhive.chat_sessions
    WHERE id = ${sessionId}
    LIMIT 1;
  `;
  const session = sessionRows[0];

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const consentRows = await sql<ConsentRow[]>`
    SELECT metadata, created_at
    FROM goodhive.consents
    WHERE session_id = ${sessionId}
      AND channel = 'telegram'
      AND type = 'telegram_start'
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const consent = consentRows[0];

  const leadRows = await sql<LeadRow[]>`
    SELECT fields
    FROM goodhive.superbot_leads
    WHERE session_id = ${sessionId}
      AND type = 'telegram'
    ORDER BY updated_at DESC
    LIMIT 1;
  `;
  const lead = leadRows[0];

  const sessionFields = parseObject(session.fields);
  const consentMetadata = parseObject(consent?.metadata);
  const leadFields = parseObject(lead?.fields);
  const leadTelegram =
    (parseObject(leadFields?.telegram) ?? parseObject(sessionFields?.telegramLead) ?? {}) as Record<
      string,
      unknown
    >;

  const username =
    (typeof leadTelegram.username === "string" && leadTelegram.username) ||
    (typeof consentMetadata?.username === "string" && consentMetadata.username) ||
    null;
  const firstName =
    (typeof leadTelegram.firstName === "string" && leadTelegram.firstName) ||
    (typeof consentMetadata?.firstName === "string" && consentMetadata.firstName) ||
    null;
  const lastName =
    (typeof leadTelegram.lastName === "string" && leadTelegram.lastName) ||
    (typeof consentMetadata?.lastName === "string" && consentMetadata.lastName) ||
    null;

  const consentedAt =
    (typeof leadTelegram.consentedAt === "string" && leadTelegram.consentedAt) ||
    consent?.created_at ||
    null;

  return Response.json({
    sessionId: session.id,
    linked: session.channel === "telegram" && !!session.telegram_chat_id,
    telegram: {
      chatId: session.telegram_chat_id,
      username,
      firstName,
      lastName,
      consentedAt,
    },
  });
}
