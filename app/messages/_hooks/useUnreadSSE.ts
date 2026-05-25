"use client";

import { useEffect, useRef } from "react";

interface UseUnreadSSEOptions {
  userId: string | undefined;
  onUnreadEvent: () => void;
}

// Polls the unread count every 30 s instead of a long-lived SSE/pg LISTEN
// connection. The SSE approach opened one raw pg.Client per connected user,
// exhausting Postgres max_connections in serverless (error 53300).
export function useUnreadSSE({ userId, onUnreadEvent }: UseUnreadSSEOptions): void {
  const callbackRef = useRef(onUnreadEvent);
  callbackRef.current = onUnreadEvent;

  useEffect(() => {
    if (!userId) return;
    // Fire once immediately so the badge is fresh on mount
    callbackRef.current();
    const interval = setInterval(() => callbackRef.current(), 30_000);
    return () => clearInterval(interval);
  }, [userId]);
}
