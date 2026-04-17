"use client";

import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";
import type { MessengerThreadListItem } from "@/interfaces/messenger";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import BeeHiveSpinner from "@/app/components/spinners/bee-hive-spinner";
import { MessengerLayout } from "./_components/MessengerLayout";
import { useMessages } from "./_hooks/useMessages";
import { useMessengerSSE } from "./_hooks/useMessengerSSE";
import { useRequests } from "./_hooks/useRequests";
import { useThreads } from "./_hooks/useThreads";

type MobileView = "list" | "chat" | "requests";

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useCurrentUserId();

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    searchParams.get("thread"),
  );
  const [composerText, setComposerText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // ─── Data hooks ──────────────────────────────────────────────────────────
  const {
    threads,
    isLoading: isThreadsLoading,
    totalUnread,
    fetchThreads,
    markThreadRead,
    optimisticallyMarkRead,
  } = useThreads(userId);

  const {
    messages,
    isLoading: isMessagesLoading,
    isSending,
    hasEarlierMessages,
    isLoadingEarlier,
    loadMessages,
    loadEarlierMessages,
    sendMessage,
    appendSSEMessage,
    clearMessages,
    scrollRef,
  } = useMessages();

  const { requests, isLoading: isRequestsLoading, fetchRequests, updateStatus } =
    useRequests(userId);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  const requestCount = useMemo(
    () =>
      requests.filter(
        (r) => r.status === "sent" || r.status === "viewed",
      ).length,
    [requests],
  );

  // ─── SSE — real-time messages ─────────────────────────────────────────────
  useMessengerSSE({
    threadId: selectedThreadId,
    userId,
    onMessage: (msg) => {
      appendSSEMessage(msg);
      // Refresh thread list so last_message_at and unread counts stay current
      void fetchThreads();
    },
  });

  // ─── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    void Promise.all([fetchThreads(), fetchRequests()]).then(() => {
      setInitialLoadDone(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ─── Auto-select thread from URL on first load ────────────────────────────
  useEffect(() => {
    if (!initialLoadDone || threads.length === 0) return;
    const urlThread = searchParams.get("thread");
    if (urlThread && threads.some((t) => t.id === urlThread)) {
      setSelectedThreadId(urlThread);
    } else if (!selectedThreadId) {
      // Auto-select first thread if none selected
      const first = threads[0]?.id ?? null;
      setSelectedThreadId(first);
      if (first) syncThreadIntoQuery(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoadDone, threads.length]);

  // ─── Load messages when selected thread changes ───────────────────────────
  useEffect(() => {
    if (!selectedThreadId) {
      clearMessages();
      return;
    }
    void loadMessages(selectedThreadId);
  }, [selectedThreadId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const syncThreadIntoQuery = useCallback(
    (threadId: string | null) => {
      const query = new URLSearchParams(searchParams.toString());
      if (threadId) {
        query.set("thread", threadId);
      } else {
        query.delete("thread");
      }
      const queryString = query.toString();
      router.replace(
        (queryString ? `/messages?${queryString}` : "/messages") as Route,
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const handleSelectThread = useCallback(
    async (thread: MessengerThreadListItem) => {
      setSelectedThreadId(thread.id);
      syncThreadIntoQuery(thread.id);
      optimisticallyMarkRead(thread.id);

      // Bug 1 fix: always call markThreadRead when a job_request thread is
      // opened by the talent — ensures the request status transitions sent → viewed
      const shouldMark =
        thread.unread_count > 0 ||
        (thread.job_request_id && userId === thread.talent_user_id);
      if (shouldMark) {
        await markThreadRead(thread.id);
      }
    },
    [markThreadRead, optimisticallyMarkRead, syncThreadIntoQuery, userId],
  );

  const handleSendMessage = useCallback(
    async (attachmentUrl?: string) => {
      if (!selectedThreadId || !userId) return;
      const text = composerText.trim();
      if (!text && !attachmentUrl) return;

      setComposerText("");
      try {
        await sendMessage(selectedThreadId, text, userId, attachmentUrl);
        void fetchThreads();
      } catch {
        // sendMessage shows the toast and restores composer internally
        setComposerText(text);
      }
    },
    [composerText, fetchThreads, selectedThreadId, sendMessage, userId],
  );

  const handleLoadEarlier = useCallback(() => {
    if (!selectedThreadId) return;
    void loadEarlierMessages(selectedThreadId);
  }, [loadEarlierMessages, selectedThreadId]);

  // ─── Show full-page spinner until first load ──────────────────────────────
  if (!userId || (!initialLoadDone && isThreadsLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BeeHiveSpinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <MessengerLayout
        // Thread list
        threads={threads}
        isThreadsLoading={isThreadsLoading}
        selectedThread={selectedThread}
        searchText={searchText}
        currentUserId={userId}
        onSearchChange={setSearchText}
        onSelectThread={handleSelectThread}
        totalUnread={totalUnread}

        // Chat
        messages={messages}
        isMessagesLoading={isMessagesLoading}
        isSending={isSending}
        hasEarlierMessages={hasEarlierMessages}
        isLoadingEarlier={isLoadingEarlier}
        composerText={composerText}
        scrollRef={scrollRef}
        onComposerChange={setComposerText}
        onSendMessage={handleSendMessage}
        onLoadEarlier={handleLoadEarlier}

        // Requests
        requests={requests}
        isRequestsLoading={isRequestsLoading}
        onUpdateRequestStatus={updateStatus}

        // Mobile
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
        requestCount={requestCount}
      />
    </div>
  );
}
