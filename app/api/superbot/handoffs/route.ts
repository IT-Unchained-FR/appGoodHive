import sql from "@/lib/ragDb";
import { logSuperbotEvent } from "@/lib/superbot/events";
import { notifyHandoff } from "@/lib/superbot/notifications";

export const dynamic = "force-dynamic";

type CreateHandoffRequest = {
  leadId: string;
  assignedTo?: string;
  note?: string;
};

const parseJson = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return value as Record<string, unknown>;
};

export async function GET() {
  const rows = await sql`
    SELECT
      h.id as handoff_id,
      h.lead_id as handoff_lead_id,
      h.assigned_to,
      h.note,
      h.created_at as handoff_created_at,
      l.id as lead_id,
      l.session_id as lead_session_id,
      l.type as lead_type,
      l.status as lead_status,
      l.score as lead_score,
      l.fields as lead_fields,
      l.created_at as lead_created_at,
      l.updated_at as lead_updated_at,
      s.id as session_id,
      s.channel as session_channel,
      s.telegram_chat_id as session_telegram_chat_id,
      s.status as session_status,
      s.flow as session_flow,
      s.step as session_step,
      s.fields as session_fields,
      s.created_at as session_created_at,
      s.updated_at as session_updated_at
    FROM goodhive.handoffs h
    JOIN goodhive.superbot_leads l ON l.id = h.lead_id
    JOIN goodhive.chat_sessions s ON s.id = l.session_id
    ORDER BY h.created_at DESC;
  `;

  const handoffs = rows.map((row) => ({
    id: row.handoff_id,
    leadId: row.handoff_lead_id,
    assignedTo: row.assigned_to,
    note: row.note,
    createdAt: row.handoff_created_at,
    lead: {
      id: row.lead_id,
      sessionId: row.lead_session_id,
      type: row.lead_type,
      status: row.lead_status,
      score: Number(row.lead_score ?? 0),
      fields: parseJson(row.lead_fields),
      createdAt: row.lead_created_at,
      updatedAt: row.lead_updated_at,
      session: {
        id: row.session_id,
        channel: row.session_channel,
        telegramChatId: row.session_telegram_chat_id,
        status: row.session_status,
        flow: row.session_flow,
        step: row.session_step,
        fields: parseJson(row.session_fields),
        createdAt: row.session_created_at,
        updatedAt: row.session_updated_at,
      },
    },
  }));

  return Response.json({ handoffs });
}

export async function POST(req: Request) {
  let body: CreateHandoffRequest;

  try {
    body = (await req.json()) as CreateHandoffRequest;
  } catch (error) {
    console.error("Invalid handoff payload", error);
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!body.leadId) {
    return Response.json({ error: "leadId is required" }, { status: 400 });
  }

  const leadRows = await sql`
    SELECT id, session_id
    FROM goodhive.superbot_leads
    WHERE id = ${body.leadId}
    LIMIT 1;
  `;

  const lead = leadRows[0];
  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  const handoffRows = await sql`
    INSERT INTO goodhive.handoffs (lead_id, assigned_to, note)
    VALUES (${body.leadId}, ${body.assignedTo ?? null}, ${body.note ?? "Manual handoff"})
    RETURNING id, lead_id, assigned_to, note, created_at;
  `;

  const handoff = handoffRows[0];

  await sql`
    UPDATE goodhive.superbot_leads
    SET status = 'handoff', updated_at = NOW()
    WHERE id = ${body.leadId};
  `;

  await logSuperbotEvent({
    sessionId: lead.session_id,
    type: "handoff_created",
    metadata: {
      leadId: body.leadId,
      source: "manual",
      handoffId: handoff.id,
    },
  });

  await notifyHandoff({
    title: "Superbot handoff created",
    body: `Lead ${body.leadId} marked for handoff${body.assignedTo ? ` (assigned to ${body.assignedTo})` : ""}.`,
    sessionId: lead.session_id,
    leadId: body.leadId,
    metadata: {
      source: "manual",
      handoffId: handoff.id,
    },
  });

  return Response.json({ handoff });
}
