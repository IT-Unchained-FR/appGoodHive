"use client";

import { useEffect, useRef } from "react";

interface UseUnreadSSEOptions {
  userId: string | undefined;
  onUnreadEvent: () => void;
}

// Opens a per-user SSE connection for unread badge updates.
// Replaces the 30-second navbar polling interval.
// Any new message to any of the user's threads fires the callback.
export function useUnreadSSE({ userId, onUnreadEvent }: UseUnreadSSEOptions): void {
  const callbackRef = useRef(onUnreadEvent);
  callbackRef.current = onUnreadEvent;

  useEffect(() => {
    if (!userId) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      es = new EventSource("/api/messenger/unread-stream");

      es.addEventListener("unread", () => {
        attempts = 0;
        callbackRef.current();
      });

      es.addEventListener("keepalive", () => {
        attempts = 0;
      });

      es.onerror = () => {
        es?.close();
        es = null;
        if (destroyed) return;
        attempts++;
        const delay = Math.min(1_000 * 2 ** (attempts - 1), 30_000);
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [userId]);
}
