import { NextRequest } from "next/server";
import { Client } from "pg";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEEPALIVE_INTERVAL_MS = 20_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;

  const sessionUser = await getSessionUser();
  if (!sessionUser?.user_id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = sessionUser.user_id;

  // Verify the user is a participant — uses shared postgres.js pool (released immediately)
  const rows = await sql<{ id: string }[]>`
    SELECT id FROM goodhive.messenger_threads
    WHERE id = ${threadId}::uuid
      AND (
        company_user_id = ${userId}::uuid
        OR talent_user_id = ${userId}::uuid
      )
    LIMIT 1
  `;

  if (rows.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  const channelName = `messenger_thread:${threadId}`;

  // Dedicated pg.Client for LISTEN — never use the shared pool for long-lived LISTEN connections
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
              encoder.encode(`event: message\ndata: ${msg.payload}\n\n`),
            );
          } catch {
            // Stream already closed — ignore
          }
        });

        pgClient.on("error", (err) => {
          console.error("[SSE thread] pg client error:", err.message);
          try { controller.close(); } catch { /* ignore */ }
        });

        await pgClient.query(`LISTEN "${channelName}"`);

        // Confirm connection is live to the client
        controller.enqueue(encoder.encode(": connected\n\n"));

        // Keepalive pings to prevent proxy / Vercel timeout at 30s
        keepaliveTimer = setInterval(() => {
          try {
            controller.enqueue(encoder.encode("event: keepalive\ndata: {}\n\n"));
          } catch {
            if (keepaliveTimer) clearInterval(keepaliveTimer);
          }
        }, KEEPALIVE_INTERVAL_MS);
      } catch (err) {
        console.error("[SSE thread] Failed to start:", err);
        try { controller.close(); } catch { /* ignore */ }
      }
    },

    async cancel() {
      if (keepaliveTimer) clearInterval(keepaliveTimer);
      try {
        await pgClient.query(`UNLISTEN "${channelName}"`);
      } catch { /* ignore */ }
      try {
        await pgClient.end();
      } catch { /* ignore */ }
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
