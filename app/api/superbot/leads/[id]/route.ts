import sql from "@/lib/ragDb";
import { logSuperbotEvent } from "@/lib/superbot/events";
import { notifyHandoff } from "@/lib/superbot/notifications";

export const dynamic = "force-dynamic";

type LeadUpdateRequest = {
  status?: string;
  assignedTo?: string;
  note?: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id: leadId } = await params;
  let body: LeadUpdateRequest;

  try {
    body = (await req.json()) as LeadUpdateRequest;
  } catch (error) {
    console.error("Invalid lead update", error);
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const leadRows = await sql`
    SELECT id, session_id, status
    FROM goodhive.superbot_leads
    WHERE id = ${leadId}
    LIMIT 1;
  `;

  const lead = leadRows[0];
  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  const status = body.status ?? lead.status;

  const updatedRows = await sql`
    UPDATE goodhive.superbot_leads
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${leadId}
    RETURNING id, session_id, type, status, score, fields, created_at, updated_at;
  `;

  if (body.status === "handoff") {
    const existing = await sql`
      SELECT id FROM goodhive.handoffs WHERE lead_id = ${leadId} LIMIT 1;
    `;

    if (!existing[0]) {
      const handoffRows = await sql`
        INSERT INTO goodhive.handoffs (lead_id, assigned_to, note)
        VALUES (${leadId}, ${body.assignedTo ?? null}, ${body.note ?? "Manual handoff"})
        RETURNING id;
      `;

      const handoff = handoffRows[0];

      await logSuperbotEvent({
        sessionId: lead.session_id,
        type: "handoff_created",
        metadata: {
          leadId,
          source: "manual",
        },
      });

      await notifyHandoff({
        title: "Superbot handoff created",
        body: `Lead ${leadId} marked for handoff${body.assignedTo ? ` (assigned to ${body.assignedTo})` : ""}.`,
        sessionId: lead.session_id,
        leadId,
        metadata: {
          source: "manual",
          handoffId: handoff?.id,
        },
      });
    }
  }

  return Response.json({ lead: updatedRows[0] });
}
