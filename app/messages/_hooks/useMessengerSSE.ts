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

// Replaces the 4-second message polling loop.
// Opens one long-lived EventSource per active thread.
// Reconnects with exponential backoff (1s → 2s → 4s → max 30s) on error.
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

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      onConnectionChangeRef.current?.("connecting");

      es = new EventSource(`/api/messenger/threads/${threadId}/stream`);

      es.addEventListener("message", (event) => {
        attempts = 0;
        onConnectionChangeRef.current?.("open");
        try {
          const msg = JSON.parse(event.data) as MessengerMessage;
          onMessageRef.current(msg);
        } catch {
          /* malformed payload — ignore */
        }
      });

      es.addEventListener("keepalive", () => {
        attempts = 0;
        onConnectionChangeRef.current?.("open");
      });

      es.onerror = () => {
        es?.close();
        es = null;
        if (destroyed) return;
        onConnectionChangeRef.current?.("error");
        attempts++;
        const delay = Math.min(1_000 * 2 ** (attempts - 1), 30_000);
        reconnectTimer = setTimeout(connect, delay);
      };

      es.onopen = () => {
        attempts = 0;
        onConnectionChangeRef.current?.("open");
      };
    };

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
      onConnectionChangeRef.current?.("closed");
    };
  }, [threadId, userId]);
}
