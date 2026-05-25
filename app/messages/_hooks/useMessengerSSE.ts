"use client";

import type { MessengerMessage } from "@/interfaces/messenger";
import { useEffect, useRef } from "react";

type SSEConnectionState = "connecting" | "open" | "closed" | "error";

interface UseMessengerSSEOptions {
  threadId: string | null;
  userId: string | undefined;
  onMessage: (msg: MessengerMessage) => void;
  onConnectionChange?: (state: SSEConnectionState) => void;
}

const POLL_INTERVAL_MS = 4_000;

// Polls for new messages every 4 s instead of a long-lived SSE/pg LISTEN
// connection. The SSE approach opened one raw pg.Client per open chat tab,
// exhausting Postgres max_connections in serverless (error 53300).
//
// On mount we seed the set of known message IDs so we don't re-fire
// onMessage for messages already in the UI. After that, every tick we fetch
// the 20 most-recent messages and call onMessage only for new ones sent by
// the other party (our own sends are already optimistically rendered and
// appendSSEMessage deduplicates by ID regardless).
export function useMessengerSSE({
  threadId,
  userId,
  onMessage,
  onConnectionChange,
}: UseMessengerSSEOptions): void {
  const onMessageRef = useRef(onMessage);
  const onConnectionChangeRef = useRef(onConnectionChange);
  onMessageRef.current = onMessage;
  onConnectionChangeRef.current = onConnectionChange;

  useEffect(() => {
    if (!threadId || !userId) return;

    const seenIds = new Set<string>();
    let active = true;

    const fetchRecent = async (): Promise<MessengerMessage[]> => {
      const res = await fetch(
        `/api/messenger/threads/${threadId}/messages?limit=20`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { messages?: MessengerMessage[] };
      return data.messages ?? [];
    };

    // Seed known IDs from the current message list without triggering onMessage
    const seed = async () => {
      try {
        onConnectionChangeRef.current?.("connecting");
        const messages = await fetchRecent();
        for (const msg of messages) seenIds.add(msg.id);
        onConnectionChangeRef.current?.("open");
      } catch {
        onConnectionChangeRef.current?.("error");
      }
    };

    // Poll: call onMessage only for messages we haven't seen yet from the other party
    const poll = async () => {
      try {
        const messages = await fetchRecent();
        onConnectionChangeRef.current?.("open");
        for (const msg of messages) {
          if (!seenIds.has(msg.id)) {
            seenIds.add(msg.id);
            if (msg.sender_user_id !== userId) {
              onMessageRef.current(msg);
            }
          }
        }
      } catch {
        onConnectionChangeRef.current?.("error");
      }
    };

    void seed();
    const interval = setInterval(() => {
      if (active) void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
      onConnectionChangeRef.current?.("closed");
    };
  }, [threadId, userId]);
}
