import { NextRequest } from "next/server";
import { Client } from "pg";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEEPALIVE_INTERVAL_MS = 20_000;

// SSE stream that fires whenever the authenticated user receives a new message
// in any of their threads. Used by the navbar to update the unread badge
// without polling.
export async function GET(_request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.user_id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = sessionUser.user_id;

  const channelName = `messenger_user:${userId}`;

  const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
  const encoder = new TextEncoder();
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await pgClient.connect();

        pgClient.on("notification", (msg) => {
          if (msg.channel !== channelName || !msg.payload) return;
          try {
            controller.enqueue(
              encoder.encode(`event: unread\ndata: ${msg.payload}\n\n`),
            );
          } catch { /* stream closed */ }
        });

        pgClient.on("error", (err) => {
          console.error("[SSE unread] pg client error:", err.message);
          try { controller.close(); } catch { /* ignore */ }
        });

        await pgClient.query(`LISTEN "${channelName}"`);

        controller.enqueue(encoder.encode(": connected\n\n"));

        keepaliveTimer = setInterval(() => {
          try {
            controller.enqueue(encoder.encode("event: keepalive\ndata: {}\n\n"));
          } catch {
            if (keepaliveTimer) clearInterval(keepaliveTimer);
          }
        }, KEEPALIVE_INTERVAL_MS);
      } catch (err) {
        console.error("[SSE unread] Failed to start:", err);
        try { controller.close(); } catch { /* ignore */ }
      }
    },

    async cancel() {
      if (keepaliveTimer) clearInterval(keepaliveTimer);
      try { await pgClient.query(`UNLISTEN "${channelName}"`); } catch { /* ignore */ }
      try { await pgClient.end(); } catch { /* ignore */ }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
