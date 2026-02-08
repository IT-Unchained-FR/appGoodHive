import { logSuperbotEvent } from "@/lib/superbot/events";

export const dynamic = "force-dynamic";

type EventRequest = {
  sessionId?: string;
  type?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(req: Request) {
  let body: EventRequest;

  try {
    body = (await req.json()) as EventRequest;
  } catch (error) {
    console.error("Invalid event payload", error);
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!body.sessionId || !body.type) {
    return Response.json({ error: "sessionId and type are required" }, { status: 400 });
  }

  await logSuperbotEvent({
    sessionId: body.sessionId,
    type: body.type as never,
    metadata: body.metadata ?? undefined,
  });

  return Response.json({ ok: true });
}
