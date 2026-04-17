"use client";

import type { MessengerMessage } from "@/interfaces/messenger";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  type UiMessengerMessage,
  mergeServerAndPendingMessages,
} from "../_utils/messenger-helpers";

const PAGE_SIZE = 50;

interface UseMessagesReturn {
  messages: UiMessengerMessage[];
  isLoading: boolean;
  isSending: boolean;
  hasEarlierMessages: boolean;
  isLoadingEarlier: boolean;
  loadMessages: (threadId: string) => Promise<void>;
  loadEarlierMessages: (threadId: string) => Promise<void>;
  sendMessage: (
    threadId: string,
    text: string,
    senderId: string,
    attachmentUrl?: string,
  ) => Promise<void>;
  appendSSEMessage: (msg: MessengerMessage) => void;
  clearMessages: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

// Manages the message list for the currently open thread.
// loadMessages / loadEarlierMessages use the existing REST API.
// appendSSEMessage is called by useMessengerSSE when a new message arrives.
export function useMessages(): UseMessagesReturn {
  const [messages, setMessages] = useState<UiMessengerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasEarlierMessages, setHasEarlierMessages] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const earliestCreatedAtRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    setIsLoading(true);
    setMessages([]);
    setHasEarlierMessages(false);
    earliestCreatedAtRef.current = null;

    try {
      const res = await fetch(
        `/api/messenger/threads/${threadId}/messages?limit=${PAGE_SIZE}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: { messages: MessengerMessage[] };
        messages?: MessengerMessage[];
      };
      const list: MessengerMessage[] =
        json.data?.messages ?? (json as { messages?: MessengerMessage[] }).messages ?? [];

      setMessages(list);
      setHasEarlierMessages(list.length >= PAGE_SIZE);
      if (list.length > 0) {
        earliestCreatedAtRef.current = list[0].created_at;
      }
      scrollToBottom();
    } catch {
      toast.error("Failed to load messages.");
    } finally {
      setIsLoading(false);
    }
  }, [scrollToBottom]);

  const loadEarlierMessages = useCallback(async (threadId: string) => {
    if (!earliestCreatedAtRef.current || isLoadingEarlier) return;
    setIsLoadingEarlier(true);

    const savedScrollHeight = scrollRef.current?.scrollHeight ?? 0;

    try {
      const res = await fetch(
        `/api/messenger/threads/${threadId}/messages?limit=${PAGE_SIZE}&before=${encodeURIComponent(earliestCreatedAtRef.current)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: { messages: MessengerMessage[] };
        messages?: MessengerMessage[];
      };
      const earlier: MessengerMessage[] =
        json.data?.messages ?? (json as { messages?: MessengerMessage[] }).messages ?? [];

      if (earlier.length === 0) {
        setHasEarlierMessages(false);
        return;
      }

      setMessages((prev) => [...earlier, ...prev]);
      setHasEarlierMessages(earlier.length >= PAGE_SIZE);
      if (earlier.length > 0) {
        earliestCreatedAtRef.current = earlier[0].created_at;
      }

      // Restore scroll position so the view doesn't jump
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const delta = scrollRef.current.scrollHeight - savedScrollHeight;
          scrollRef.current.scrollTop += delta;
        }
      });
    } catch {
      toast.error("Failed to load earlier messages.");
    } finally {
      setIsLoadingEarlier(false);
    }
  }, [isLoadingEarlier]);

  const sendMessage = useCallback(
    async (
      threadId: string,
      text: string,
      senderId: string,
      attachmentUrl?: string,
    ) => {
      if (!text.trim() && !attachmentUrl) return;
      setIsSending(true);

      // Optimistic message — appears immediately in the UI
      const tempId = `pending-${Date.now()}`;
      const optimistic: UiMessengerMessage = {
        id: tempId,
        thread_id: threadId,
        sender_user_id: senderId,
        message_type: "text",
        message_text: text,
        attachment_url: attachmentUrl ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pending: true,
      };

      setMessages((prev) => [...prev, optimistic]);
      scrollToBottom();

      try {
        const res = await fetch(`/api/messenger/threads/${threadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageText: text,
            messageType: "text",
            attachmentUrl: attachmentUrl ?? undefined,
          }),
        });

        if (res.status === 429) {
          throw new Error("Sending too fast. Please wait a moment.");
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as {
          success: boolean;
          data?: { message: MessengerMessage };
          message?: MessengerMessage;
        };
        const saved: MessengerMessage | undefined =
          json.data?.message ?? (json as { message?: MessengerMessage }).message;

        if (saved) {
          setMessages((prev) =>
            mergeServerAndPendingMessages(
              [...prev.filter((m) => !m.pending), saved],
              prev,
            ),
          );
        }
      } catch (err) {
        // Revert optimistic message and restore text
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const msg = err instanceof Error ? err.message : "Failed to send message.";
        toast.error(msg);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [scrollToBottom],
  );

  // Called by useMessengerSSE when a new message arrives via the SSE stream.
  // Deduplicates against existing messages to avoid double-render.
  const appendSSEMessage = useCallback((msg: MessengerMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      const merged = mergeServerAndPendingMessages([...prev.filter((m) => !m.pending || m.id !== msg.id), msg], prev);
      return merged;
    });
    scrollToBottom();
  }, [scrollToBottom]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setHasEarlierMessages(false);
    earliestCreatedAtRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    isSending,
    hasEarlierMessages,
    isLoadingEarlier,
    loadMessages,
    loadEarlierMessages,
    sendMessage,
    appendSSEMessage,
    clearMessages,
    scrollRef,
  };
}
