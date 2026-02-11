import sql from "@/lib/ragDb";
import { generateChatResponse } from "@/lib/rag";
import { evaluateGuardrails } from "./guardrails";
import { logSuperbotEvent } from "./events";

const BASE_URL = process.env.GOODHIVE_BASE_URL ?? "https://goodhive.io";
const TALENT_PROFILE_URL = `${BASE_URL}/talents/my-profile`;
const COMPANY_PROFILE_URL = `${BASE_URL}/companies/my-profile`;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type Channel = "telegram" | "web";

export type Action = {
  label: string;
  value?: string;
  callbackData?: string;
  url?: string;
};

export type EngineMessage = {
  text: string;
  actions?: Action[];
};

export type UserMeta = {
  username?: string;
  firstName?: string;
  lastName?: string;
  userAgent?: string;
  referrer?: string;
};

type ChatSessionRow = {
  id: string;
  channel: string;
  telegram_chat_id: string | null;
  status: string;
  flow: string | null;
  step: string | null;
  fields: unknown;
};

type SuperbotLeadRow = {
  id: string;
  fields: unknown;
};

export type ChatSession = {
  id: string;
  channel: Channel;
  telegramChatId: string | null;
  status: string;
  flow: string | null;
  step: string | null;
  fields: Record<string, unknown> | null;
};

function parseFields(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return value as Record<string, unknown>;
}

function mapSession(row: ChatSessionRow): ChatSession {
  return {
    id: row.id,
    channel: row.channel as Channel,
    telegramChatId: row.telegram_chat_id,
    status: row.status,
    flow: row.flow,
    step: row.step,
    fields: parseFields(row.fields),
  };
}

function parseStartPayload(text: string) {
  const parts = text.trim().split(" ");
  if (parts[0] !== "/start") return null;
  return parts[1] ?? "";
}

function sanitizeReturnUrl(value?: string | null) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    const host = parsed.hostname.toLowerCase();
    const isGoodHive =
      host === "goodhive.io" ||
      host === "www.goodhive.io" ||
      host === "goodhive-production.vercel.app";
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (!isGoodHive && !isLocal) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function resolveReturnUrlFromSession(session: ChatSession) {
  const sessionFields = session.fields ?? {};
  const webContext =
    typeof sessionFields.webContext === "object" && sessionFields.webContext
      ? (sessionFields.webContext as Record<string, unknown>)
      : null;
  const raw = typeof webContext?.lastPageUrl === "string" ? webContext.lastPageUrl : null;
  return sanitizeReturnUrl(raw);
}

function buildProfileActions(): Action[] {
  return [
    { label: "I'm a Talent", callbackData: "create_talent", url: TALENT_PROFILE_URL },
    { label: "I'm a Company", callbackData: "create_company", url: COMPANY_PROFILE_URL },
  ];
}

const WELCOME_MESSAGE = `Welcome to GoodHive!

GoodHive is the Web3-native, collaborative recruitment platform that connects top tech talent with innovative companies in the decentralized economy.

What makes us different:
- Peer-recommended talent - no cold sourcing
- 100% value redistributed to the community
- Smart-contract secured payments with escrow
- Community-first: talents co-build the network

Ready to get started? Create your profile:`;

export async function logChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  text: string,
  meta?: Record<string, unknown>,
) {
  const metaValue = meta ? JSON.stringify(meta) : null;
  await sql`
    INSERT INTO goodhive.chat_messages (session_id, role, text, meta)
    VALUES (${sessionId}, ${role}, ${text}, ${metaValue});
  `;
  await sql`
    UPDATE goodhive.chat_sessions SET updated_at = NOW() WHERE id = ${sessionId};
  `;
}

export async function getOrCreateSession(input: {
  channel: Channel;
  telegramChatId?: string | null;
  sessionId?: string | null;
}): Promise<ChatSession> {
  if (input.channel === "telegram") {
    const chatId = input.telegramChatId;
    if (!chatId) {
      throw new Error("Missing telegram chat id");
    }

    const existing = await sql<ChatSessionRow[]>`
      SELECT id, channel, telegram_chat_id, status, flow, step, fields
      FROM goodhive.chat_sessions
      WHERE telegram_chat_id = ${chatId}
      LIMIT 1;
    `;

    if (existing[0]) return mapSession(existing[0]);

    const created = await sql<ChatSessionRow[]>`
      INSERT INTO goodhive.chat_sessions (channel, telegram_chat_id, status, step)
      VALUES ('telegram', ${chatId}, 'active', 'chat')
      RETURNING id, channel, telegram_chat_id, status, flow, step, fields;
    `;

    return mapSession(created[0]);
  }

  const safeSessionId =
    input.sessionId && UUID_PATTERN.test(input.sessionId)
      ? input.sessionId
      : null;

  if (safeSessionId) {
    const existing = await sql<ChatSessionRow[]>`
      SELECT id, channel, telegram_chat_id, status, flow, step, fields
      FROM goodhive.chat_sessions
      WHERE id = ${safeSessionId}
      LIMIT 1;
    `;
    if (existing[0]) return mapSession(existing[0]);
  }

  const created = await sql<ChatSessionRow[]>`
    INSERT INTO goodhive.chat_sessions (channel, status, step)
    VALUES ('web', 'active', 'chat')
    RETURNING id, channel, telegram_chat_id, status, flow, step, fields;
  `;

  return mapSession(created[0]);
}

async function ensureConsent(
  session: ChatSession,
  channel: Channel,
  meta?: UserMeta,
) {
  const existing = await sql`
    SELECT id FROM goodhive.consents
    WHERE session_id = ${session.id} AND channel = ${channel}
    LIMIT 1;
  `;

  if (existing[0]) return true;

  if (channel === "web") {
    await sql`
      INSERT INTO goodhive.consents (session_id, channel, type, metadata)
      VALUES (${session.id}, 'web', 'web_start', ${meta ? JSON.stringify(meta) : null});
    `;
    return true;
  }

  return false;
}

async function updateWebSessionContext(session: ChatSession, meta?: UserMeta) {
  if (session.channel !== "web") return;
  const returnUrl = sanitizeReturnUrl(meta?.referrer ?? null);
  if (!returnUrl) return;

  const sessionFields = session.fields ?? {};
  const existingContext =
    typeof sessionFields.webContext === "object" && sessionFields.webContext
      ? (sessionFields.webContext as Record<string, unknown>)
      : {};
  const mergedFields = {
    ...sessionFields,
    webContext: {
      ...existingContext,
      lastPageUrl: returnUrl,
      updatedAt: new Date().toISOString(),
    },
  };

  await sql`
    UPDATE goodhive.chat_sessions
    SET fields = ${JSON.stringify(mergedFields)},
        updated_at = NOW()
    WHERE id = ${session.id};
  `;
  session.fields = mergedFields;
}

function normalizeTelegramHandle(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^@+/, "");
}

async function upsertTelegramLead(
  session: ChatSession,
  meta?: UserMeta,
  source: "telegram_start" | "web_to_telegram_handoff" = "telegram_start",
) {
  if (session.channel !== "telegram") return;

  const username = normalizeTelegramHandle(meta?.username);
  const firstName = meta?.firstName?.trim() || null;
  const lastName = meta?.lastName?.trim() || null;
  const timestamp = new Date().toISOString();

  const existingLeadRows = await sql<SuperbotLeadRow[]>`
    SELECT id, fields
    FROM goodhive.superbot_leads
    WHERE session_id = ${session.id}
      AND type = 'telegram'
    LIMIT 1;
  `;

  const existingLead = existingLeadRows[0];
  const existingLeadFields = parseFields(existingLead?.fields) ?? {};
  const existingTelegramData =
    typeof existingLeadFields.telegram === "object" && existingLeadFields.telegram
      ? (existingLeadFields.telegram as Record<string, unknown>)
      : {};

  const mergedLeadFields = {
    ...existingLeadFields,
    source,
    telegram: {
      ...existingTelegramData,
      chatId: session.telegramChatId,
      username: username ?? existingTelegramData.username ?? null,
      firstName: firstName ?? existingTelegramData.firstName ?? null,
      lastName: lastName ?? existingTelegramData.lastName ?? null,
      consentedAt: timestamp,
    },
  };

  if (existingLead) {
    await sql`
      UPDATE goodhive.superbot_leads
      SET fields = ${JSON.stringify(mergedLeadFields)},
          updated_at = NOW()
      WHERE id = ${existingLead.id};
    `;
  } else {
    await sql`
      INSERT INTO goodhive.superbot_leads (session_id, type, status, score, fields)
      VALUES (
        ${session.id},
        'telegram',
        'new',
        0,
        ${JSON.stringify(mergedLeadFields)}
      );
    `;
  }

  const sessionFields = session.fields ?? {};
  const existingSessionTelegram =
    typeof sessionFields.telegramLead === "object" && sessionFields.telegramLead
      ? (sessionFields.telegramLead as Record<string, unknown>)
      : {};
  const mergedSessionFields = {
    ...sessionFields,
    telegramLead: {
      ...existingSessionTelegram,
      source,
      chatId: session.telegramChatId,
      username: username ?? existingSessionTelegram.username ?? null,
      firstName: firstName ?? existingSessionTelegram.firstName ?? null,
      lastName: lastName ?? existingSessionTelegram.lastName ?? null,
      consentedAt: timestamp,
    },
  };

  await sql`
    UPDATE goodhive.chat_sessions
    SET fields = ${JSON.stringify(mergedSessionFields)},
        updated_at = NOW()
    WHERE id = ${session.id};
  `;
}

async function handleStart(params: {
  session: ChatSession;
  payload: string | null;
  meta?: UserMeta;
  send: (message: EngineMessage) => Promise<void>;
}) {
  const { session, payload, meta, send } = params;

  // Web-to-Telegram Handoff
  if (session.channel === "telegram" && payload?.startsWith("web_")) {
    const webSessionId = payload.replace("web_", "");
    // Validate UUID format to prevent SQL injection or errors
    if (UUID_PATTERN.test(webSessionId)) {
      const webSessionResult = await sql<ChatSessionRow[]>`
        SELECT id, channel, telegram_chat_id, status, flow, step, fields
        FROM goodhive.chat_sessions
        WHERE id = ${webSessionId}
        LIMIT 1;
      `;
      const webSessionRow = webSessionResult[0];

      if (webSessionRow && !webSessionRow.telegram_chat_id) {
        // Release the unique telegram_chat_id from the temporary telegram session first.
        // This avoids unique-constraint collisions when attaching the chat id to the web session.
        if (session.id !== webSessionRow.id) {
          await sql`
            UPDATE goodhive.chat_sessions
            SET telegram_chat_id = NULL, updated_at = NOW()
            WHERE id = ${session.id};
          `;
        }

        // Upgrade the web session to be the active Telegram session.
        await sql`
          UPDATE goodhive.chat_sessions
          SET telegram_chat_id = ${session.telegramChatId}, channel = 'telegram', step = 'chat', updated_at = NOW()
          WHERE id = ${webSessionId};
        `;

        // Rebind the in-memory session so downstream message logging writes into the merged session.
        session.id = webSessionRow.id;
        session.channel = "telegram";
        session.telegramChatId = session.telegramChatId ?? null;
        session.step = "chat";
        session.fields = parseFields(webSessionRow.fields);

        // Record consent for the Telegram handoff explicitly.
        await sql`
          INSERT INTO goodhive.consents (session_id, channel, type, metadata)
          VALUES (
            ${session.id},
            'telegram',
            'telegram_start',
            ${JSON.stringify({
              payload,
              handoff: "web_to_telegram",
              ...(meta ?? {}),
            })}
          );
        `;

        await upsertTelegramLead(session, meta, "web_to_telegram_handoff");

        const backToWebUrl = resolveReturnUrlFromSession(session) ?? BASE_URL;
        await send({
          text: "✨ **Connected!** Your web chat history is now available here on Telegram.",
          actions: [{ label: "Back to GoodHive Chat", url: backToWebUrl }, ...buildProfileActions()],
        });
        return;
      }
    }
  }
  const payloadId = payload && UUID_PATTERN.test(payload) ? payload : null;

  const contentItem = payloadId
    ? await sql`
        SELECT id, title, body, cta_label, cta_url
        FROM goodhive.content_items
        WHERE id = ${payloadId} AND status = 'active'
        LIMIT 1;
      `
    : null;

  const resolvedContent = contentItem && contentItem[0] ? contentItem[0] : null;

  await sql`
    INSERT INTO goodhive.consents (session_id, channel, type, metadata)
    VALUES (
      ${session.id},
      ${session.channel},
      ${session.channel === "web" ? "web_start" : "telegram_start"},
      ${JSON.stringify({
        payload: payload || null,
        contentItemId: resolvedContent?.id ?? null,
        ...(meta ?? {}),
      })}
    );
  `;

  if (session.channel === "telegram") {
    await upsertTelegramLead(session, meta, "telegram_start");
  }

  await sql`
    UPDATE goodhive.chat_sessions
    SET step = 'chat', flow = NULL, updated_at = NOW()
    WHERE id = ${session.id};
  `;

  if (resolvedContent) {
    const contentText = `${resolvedContent.title}\n\n${resolvedContent.body}`;
    await send({
      text: contentText,
      actions: [
        { label: resolvedContent.cta_label, url: resolvedContent.cta_url },
      ],
    });

    await logSuperbotEvent({
      sessionId: session.id,
      type: "cta_sent",
      metadata: {
        flow: "content_item",
        ctaLabel: resolvedContent.cta_label,
        ctaUrl: resolvedContent.cta_url,
        contentItemId: resolvedContent.id,
      },
    });

    await send({
      text: "Want to join GoodHive?",
      actions: buildProfileActions(),
    });
    return;
  }

  await send({
    text: WELCOME_MESSAGE,
    actions: buildProfileActions(),
  });

  await logSuperbotEvent({
    sessionId: session.id,
    type: "welcome_sent",
    metadata: { flow: "start" },
  });
}

async function getConversationHistory(sessionId: string, limit = 10) {
  const messages = await sql`
    SELECT role, text
    FROM goodhive.chat_messages
    WHERE session_id = ${sessionId}
    ORDER BY created_at DESC
    LIMIT ${limit};
  `;
  return [...messages].reverse();
}

async function handleChat(params: {
  session: ChatSession;
  text: string;
  send: (message: EngineMessage) => Promise<void>;
}) {
  const { session, text, send } = params;

  const history = await getConversationHistory(session.id);
  const historyContext = history
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n");

  const response = await generateChatResponse(
    text,
    historyContext,
    session.channel as "telegram" | "web",
  );

  if (response.showProfileCta) {
    const ctaType = response.ctaType ?? "both";
    let actions: Action[] = [];

    if (ctaType === "talent") {
      actions = [{ label: "Create Talent Profile", url: TALENT_PROFILE_URL }];
    } else if (ctaType === "company") {
      actions = [{ label: "Create Company Profile", url: COMPANY_PROFILE_URL }];
    } else {
      actions = buildProfileActions();
    }

    await send({ text: response.reply, actions });

    await logSuperbotEvent({
      sessionId: session.id,
      type: "cta_sent",
      metadata: { trigger: "ai_detected", ctaType },
    });
  } else {
    await send({ text: response.reply });
  }
}

export async function handleIncomingMessage(params: {
  channel: Channel;
  session: ChatSession;
  text?: string | null;
  callbackData?: string | null;
  payload?: string | null;
  userMeta?: UserMeta;
  send: (message: EngineMessage) => Promise<void>;
}) {
  const { channel, session, text, callbackData, payload, userMeta, send } = params;
  const trimmedText = text?.trim() ?? "";

  if (channel === "web") {
    await updateWebSessionContext(session, userMeta);
  }

  if (callbackData) {
    if (callbackData === "create_talent" || callbackData === "create_company") {
      await logSuperbotEvent({
        sessionId: session.id,
        type: "profile_cta_clicked",
        metadata: { type: callbackData },
      });
    }
    return;
  }

  const startPayload = payload !== undefined ? payload : parseStartPayload(trimmedText);
  const isStart = payload !== undefined || startPayload !== null;

  if (isStart) {
    if (trimmedText) {
      await logChatMessage(session.id, "user", trimmedText, userMeta ?? undefined);
    }
    await handleStart({
      session,
      payload: startPayload || null,
      meta: userMeta,
      send,
    });
    return;
  }

  if (trimmedText) {
    const guardrail = evaluateGuardrails(trimmedText);
    const messageToLog = guardrail.redactedText ?? trimmedText;
    await logChatMessage(session.id, "user", messageToLog, userMeta ?? undefined);

    if (guardrail.blocked) {
      await send({
        text:
          guardrail.message ??
          "Please avoid sharing sensitive details. I can still help with your questions about GoodHive.",
      });
      return;
    }
  }

  const consentOk = await ensureConsent(session, channel, userMeta);
  if (!consentOk) {
    await send({ text: "Please type /start to begin." });
    return;
  }

  if (!trimmedText) {
    await send({
      text: "Hi! I'm the GoodHive assistant. Ask me anything about GoodHive, our platform, tokenomics, or how to get started!",
      actions: buildProfileActions(),
    });
    return;
  }

  await handleChat({ session, text: trimmedText, send });
}
