import { logSuperbotEvent } from "./events";

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

type NotificationPayload = {
  title: string;
  body: string;
  sessionId?: string;
  leadId?: string;
  metadata?: Record<string, unknown>;
};

type NotifyState = {
  lastSentAt: Record<string, number>;
};

function getState(): NotifyState {
  const globalRef = globalThis as unknown as { __superbotNotifyState?: NotifyState };
  if (!globalRef.__superbotNotifyState) {
    globalRef.__superbotNotifyState = { lastSentAt: {} };
  }
  return globalRef.__superbotNotifyState;
}

function shouldNotify(key: string) {
  const cooldown = Number(process.env.SUPERBOT_NOTIFICATION_COOLDOWN_MS ?? DEFAULT_COOLDOWN_MS);
  const state = getState();
  const now = Date.now();
  const last = state.lastSentAt[key] ?? 0;
  if (now - last < cooldown) return false;
  state.lastSentAt[key] = now;
  return true;
}

async function sendTelegramAlert(payload: NotificationPayload) {
  const chatId = process.env.SUPERBOT_ALERT_TELEGRAM_CHAT_ID;
  const botToken = process.env.SUPERBOT_ALERT_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;

  if (!chatId || !botToken) return false;

  const message = `${payload.title}\n${payload.body}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    return response.ok;
  } catch (error) {
    console.error("Telegram alert failed", error);
    return false;
  }
}

async function sendResendEmail(payload: NotificationPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const toAddress = process.env.SUPERBOT_ALERT_EMAIL_TO;
  const fromAddress = process.env.SUPERBOT_ALERT_EMAIL_FROM ?? "Superbot <alerts@goodhive.io>";

  if (!apiKey || !toAddress) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toAddress,
        subject: payload.title,
        text: payload.body,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Email alert failed", error);
    return false;
  }
}

export async function notifyHandoff(payload: NotificationPayload) {
  const key = payload.leadId ? `handoff:${payload.leadId}` : `handoff:${payload.sessionId ?? "unknown"}`;
  if (!shouldNotify(key)) return;

  const [telegramOk, emailOk] = await Promise.all([
    sendTelegramAlert(payload),
    sendResendEmail(payload),
  ]);

  if (payload.sessionId) {
    await logSuperbotEvent({
      sessionId: payload.sessionId,
      type: "notification_sent",
      metadata: {
        channels: {
          telegram: telegramOk,
          email: emailOk,
        },
        ...payload.metadata,
      },
    });
  }
}
