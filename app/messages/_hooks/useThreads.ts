"use client";

import type { MessengerThreadListItem } from "@/interfaces/messenger";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

interface UseThreadsReturn {
  threads: MessengerThreadListItem[];
  isLoading: boolean;
  totalUnread: number;
  fetchThreads: () => Promise<void>;
  markThreadRead: (threadId: string) => Promise<void>;
  optimisticallyMarkRead: (threadId: string) => void;
}

// Manages the thread list. Threads are fetched on mount, after sending a
// message, and after an SSE unread event fires. No polling loop.
export function useThreads(userId: string | undefined): UseThreadsReturn {
  const [threads, setThreads] = useState<MessengerThreadListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const failureCountRef = useRef(0);
  const toastShownRef = useRef(false);

  const fetchThreads = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/messenger/threads", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: { threads: MessengerThreadListItem[] };
        threads?: MessengerThreadListItem[];
      };
      // Support both response shapes for backwards compat
      const list = json.data?.threads ?? (json as { threads?: MessengerThreadListItem[] }).threads ?? [];
      setThreads(list);
      failureCountRef.current = 0;
      toastShownRef.current = false;
    } catch {
      failureCountRef.current += 1;
      if (failureCountRef.current >= 3 && !toastShownRef.current) {
        toast.error("Connection issue. Trying to reconnect…");
        toastShownRef.current = true;
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markThreadRead = useCallback(async (threadId: string) => {
    try {
      await fetch(`/api/messenger/threads/${threadId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      /* non-critical — ignore */
    }
  }, []);

  // Optimistically zero the unread count in local state so the badge
  // disappears immediately when the user clicks a thread.
  const optimisticallyMarkRead = useCallback((threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t)),
    );
  }, []);

  const totalUnread = threads.reduce(
    (sum, t) => sum + Number(t.unread_count || 0),
    0,
  );

  return {
    threads,
    isLoading,
    totalUnread,
    fetchThreads,
    markThreadRead,
    optimisticallyMarkRead,
  };
}
