import {
  getOrCreateSession,
  handleIncomingMessage,
  logChatMessage,
  type Action,
  type EngineMessage,
} from "@/lib/superbot/engine";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

type TelegramUpdate = {
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number };
    from?: { username?: string; first_name?: string; last_name?: string };
  };
  callback_query?: {
    id: string;
    data: string;
    message?: { chat: { id: number } };
    from: { username?: string; first_name?: string; last_name?: string };
  };
};

async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: object) {
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not set, skipping message send.");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Telegram send failed: ${response.status} ${body}`);
    }
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
  }
}

function chunkActions(actions: Action[], size: number) {
  const rows: Action[][] = [];
  for (let index = 0; index < actions.length; index += size) {
    rows.push(actions.slice(index, index + size));
  }
  return rows;
}

function buildReplyMarkup(actions?: Action[]) {
  if (!actions || actions.length === 0) return undefined;

  const inlineActions = actions.filter((action) => action.url || action.callbackData);
  if (inlineActions.length > 0) {
    return {
      inline_keyboard: chunkActions(inlineActions, 2).map((row) =>
        row.map((action) =>
          action.url
            ? { text: action.label, url: action.url }
            : { text: action.label, callback_data: action.callbackData ?? action.value ?? action.label },
        ),
      ),
    };
  }

  const replyActions = actions.filter((action) => action.value || action.label);
  if (replyActions.length > 0) {
    return {
      keyboard: [replyActions.map((action) => ({ text: action.label }))],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }

  return undefined;
}

export async function POST(req: Request) {
  let update: TelegramUpdate;

  try {
    update = (await req.json()) as TelegramUpdate;
  } catch (error) {
    console.error("Error parsing Telegram update:", error);
    return Response.json({ ok: false });
  }

  const chatId = update.message?.chat.id
    ? String(update.message.chat.id)
    : update.callback_query?.message?.chat.id
      ? String(update.callback_query.message.chat.id)
      : null;

  if (!chatId) {
    return Response.json({ ok: true });
  }

  const session = await getOrCreateSession({ channel: "telegram", telegramChatId: chatId });

  const text = update.message?.text ?? "";
  const callbackData = update.callback_query?.data ?? null;
  const userMeta = {
    username: update.message?.from?.username ?? update.callback_query?.from?.username,
    firstName: update.message?.from?.first_name ?? update.callback_query?.from?.first_name,
    lastName: update.message?.from?.last_name ?? update.callback_query?.from?.last_name,
  };

  const send = async (message: EngineMessage) => {
    const replyMarkup = buildReplyMarkup(message.actions);
    await sendTelegramMessage(chatId, message.text, replyMarkup);
    await logChatMessage(session.id, "assistant", message.text, {
      actions: message.actions,
    });
  };

  await handleIncomingMessage({
    channel: "telegram",
    session,
    text,
    callbackData,
    userMeta,
    send,
  });

  return Response.json({ ok: true });
}
