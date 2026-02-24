import sql from "@/lib/ragDb";

export type SuperbotEventType =
  | "experiment_assigned"
  | "cta_sent"
  | "cta_click"
  | "handoff_created"
  | "notification_sent"
  | "welcome_sent"
  | "profile_cta_clicked";

export async function logSuperbotEvent(input: {
  sessionId: string;
  type: SuperbotEventType;
  metadata?: Record<string, unknown>;
}) {
  try {
    const rows = await sql`
      INSERT INTO goodhive.superbot_events (session_id, type, metadata)
      VALUES (${input.sessionId}, ${input.type}, ${input.metadata ?? null})
      RETURNING id;
    `;
    return rows[0] ?? null;
  } catch (error) {
    console.error("Failed to log superbot event", error);
    return null;
  }
}
