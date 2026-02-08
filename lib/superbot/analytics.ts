import { DateTime } from "luxon";
import sql from "@/lib/ragDb";

const APP_TIMEZONE = process.env.APP_TIMEZONE ?? "UTC";

export type SuperbotMetrics = {
  sessions: number;
  newSessions: number;
  leads: number;
  handoffs: number;
  messagesInbound: number;
  messagesOutbound: number;
  ctaSent: number;
  ctaClicks: number;
};

function toUtc(date: DateTime) {
  return date.setZone(APP_TIMEZONE).toUTC().toJSDate();
}

export function getDateRange(input?: { from?: string | null; to?: string | null }) {
  const now = DateTime.now().setZone(APP_TIMEZONE);
  const from = input?.from
    ? DateTime.fromISO(input.from, { zone: APP_TIMEZONE })
    : now.minus({ days: 7 });
  const to = input?.to
    ? DateTime.fromISO(input.to, { zone: APP_TIMEZONE })
    : now;

  return {
    from: toUtc(from.startOf("day")),
    to: toUtc(to.endOf("day")),
  };
}

const getCount = async (query: ReturnType<typeof sql>) => {
  const rows = await query;
  const value = rows[0]?.count ?? 0;
  return Number(value);
};

export async function getSuperbotMetrics(range: { from: Date; to: Date }): Promise<SuperbotMetrics> {
  const [sessions, newSessions, leads, handoffs, inbound, outbound, ctaSent, ctaClicks] =
    await Promise.all([
      getCount(sql`SELECT COUNT(*) as count FROM goodhive.chat_sessions`),
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.chat_sessions
        WHERE created_at >= ${range.from} AND created_at <= ${range.to}
      `),
      getCount(sql`SELECT COUNT(*) as count FROM goodhive.superbot_leads`),
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.handoffs
        WHERE created_at >= ${range.from} AND created_at <= ${range.to}
      `),
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.chat_messages
        WHERE role = 'user'
          AND created_at >= ${range.from} AND created_at <= ${range.to}
      `),
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.chat_messages
        WHERE role = 'assistant'
          AND created_at >= ${range.from} AND created_at <= ${range.to}
      `),
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.superbot_events
        WHERE type = 'cta_sent'
          AND created_at >= ${range.from} AND created_at <= ${range.to}
      `),
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.superbot_events
        WHERE type = 'cta_click'
          AND created_at >= ${range.from} AND created_at <= ${range.to}
      `),
    ]);

  return {
    sessions,
    newSessions,
    leads,
    handoffs,
    messagesInbound: inbound,
    messagesOutbound: outbound,
    ctaSent,
    ctaClicks,
  };
}

export async function getSuperbotDailyMetrics(range: { from: Date; to: Date }) {
  const { from, to } = range;
  const days: Array<{ date: string; inbound: number; outbound: number; ctaSent: number; ctaClicks: number }> = [];
  const cursor = DateTime.fromJSDate(from).setZone(APP_TIMEZONE).startOf("day");
  const end = DateTime.fromJSDate(to).setZone(APP_TIMEZONE).endOf("day");

  let current = cursor;
  while (current <= end) {
    const dayStart = toUtc(current.startOf("day"));
    const dayEnd = toUtc(current.endOf("day"));

    const [inbound, outbound, ctaSent, ctaClicks] = await Promise.all([
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.chat_messages
        WHERE role = 'user' AND created_at >= ${dayStart} AND created_at <= ${dayEnd}
      `),
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.chat_messages
        WHERE role = 'assistant' AND created_at >= ${dayStart} AND created_at <= ${dayEnd}
      `),
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.superbot_events
        WHERE type = 'cta_sent' AND created_at >= ${dayStart} AND created_at <= ${dayEnd}
      `),
      getCount(sql`
        SELECT COUNT(*) as count
        FROM goodhive.superbot_events
        WHERE type = 'cta_click' AND created_at >= ${dayStart} AND created_at <= ${dayEnd}
      `),
    ]);

    const date = current.toISODate() ?? current.toFormat("yyyy-MM-dd");
    days.push({
      date,
      inbound,
      outbound,
      ctaSent,
      ctaClicks,
    });

    current = current.plus({ days: 1 });
  }

  return days;
}
