"use client";

import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";
import type {
  JobRequest,
  JobRequestStatus,
  MessengerMessage,
  MessengerThreadListItem,
} from "@/interfaces/messenger";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  Circle,
  Filter,
  ListFilter,
  MessageSquare,
  Search,
  SendHorizonal,
  X,
} from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const THREADS_POLL_INTERVAL_MS = 9000;
const MESSAGES_POLL_INTERVAL_MS = 4000;
const REQUESTS_POLL_INTERVAL_MS = 12000;
const MAX_MESSAGE_LENGTH = 5000;

const REQUEST_STATUS_LABELS: Record<JobRequestStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

const REQUEST_STATUS_STYLES: Record<JobRequestStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-amber-100 text-amber-800 border-amber-200",
  viewed: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  declined: "bg-rose-100 text-rose-800 border-rose-200",
  withdrawn: "bg-orange-100 text-orange-800 border-orange-200",
  archived: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const REQUEST_FILTER_OPTIONS: Array<{ key: "all" | JobRequestStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
  { key: "withdrawn", label: "Withdrawn" },
];

function formatRelativeTime(value?: string | null) {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffMs = timestamp - Date.now();
  const absMs = Math.abs(diffMs);

  if (absMs < 60_000) {
    return "now";
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }

  const hours = Math.round(diffMs / 3_600_000);
  if (Math.abs(hours) < 24) {
    return rtf.format(hours, "hour");
  }

  const days = Math.round(diffMs / 86_400_000);
  return rtf.format(days, "day");
}

function displayNameFromThread(thread: MessengerThreadListItem) {
  if (thread.other_user_name?.trim()) return thread.other_user_name;
  return `User ${thread.other_user_id.slice(0, 8)}`;
}

function initialsFromName(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 0) return "GH";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function requestCounterByStatus(requests: JobRequest[]) {
  return requests.reduce(
    (acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    },
    {} as Record<JobRequestStatus, number>,
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useCurrentUserId();

  const threadFromUrl = searchParams.get("thread");

  const [threads, setThreads] = useState<MessengerThreadListItem[]>([]);
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [requestFilter, setRequestFilter] = useState<"all" | JobRequestStatus>("all");

  const [isThreadsLoading, setIsThreadsLoading] = useState(true);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat" | "requests">("list");
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const threadsFailureCountRef = useRef(0);
  const messagesFailureCountRef = useRef(0);
  const threadsFailureToastShownRef = useRef(false);
  const messagesFailureToastShownRef = useRef(false);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  );
  const composerLength = composerText.length;
  const isComposerNearLimit = composerLength >= 4500;
  const isComposerOverLimit = composerLength > MAX_MESSAGE_LENGTH;

  const threadByRequestId = useMemo(() => {
    const mapping = new Map<string, MessengerThreadListItem>();
    for (const thread of threads) {
      if (thread.job_request_id) {
        mapping.set(thread.job_request_id, thread);
      }
    }
    return mapping;
  }, [threads]);

  const requestCounts = useMemo(() => requestCounterByStatus(requests), [requests]);
  const totalUnread = useMemo(
    () => threads.reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0),
    [threads],
  );

  const filteredThreads = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return threads;

    return threads.filter((thread) => {
      const name = displayNameFromThread(thread).toLowerCase();
      const preview = (thread.last_message_text || "").toLowerCase();
      return name.includes(normalized) || preview.includes(normalized);
    });
  }, [searchText, threads]);

  const filteredRequests = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();

    return requests.filter((request) => {
      const statusMatches = requestFilter === "all" || request.status === requestFilter;
      if (!statusMatches) return false;

      if (!normalized) return true;

      const title = request.title.toLowerCase();
      const company = (request.company_name || "").toLowerCase();
      const talent = (request.talent_name || "").toLowerCase();
      return (
        title.includes(normalized) ||
        company.includes(normalized) ||
        talent.includes(normalized)
      );
    });
  }, [requestFilter, requests, searchText]);

  const clearPollingErrorIfRecovered = useCallback(() => {
    if (
      threadsFailureCountRef.current < 3 &&
      messagesFailureCountRef.current < 3
    ) {
      setErrorText(null);
    }
  }, []);

  const registerPollingSuccess = useCallback(
    (target: "threads" | "messages") => {
      if (target === "threads") {
        threadsFailureCountRef.current = 0;
        threadsFailureToastShownRef.current = false;
      } else {
        messagesFailureCountRef.current = 0;
        messagesFailureToastShownRef.current = false;
      }
      clearPollingErrorIfRecovered();
    },
    [clearPollingErrorIfRecovered],
  );

  const registerPollingFailure = useCallback(
    (target: "threads" | "messages", message: string) => {
      const failureRef =
        target === "threads" ? threadsFailureCountRef : messagesFailureCountRef;
      const toastRef =
        target === "threads"
          ? threadsFailureToastShownRef
          : messagesFailureToastShownRef;

      failureRef.current += 1;

      if (failureRef.current >= 3) {
        setErrorText(message);
        if (!toastRef.current) {
          toast.error(message);
          toastRef.current = true;
        }
      }
    },
    [],
  );

  const syncThreadIntoQuery = useCallback(
    (threadId: string | null) => {
      const query = new URLSearchParams(searchParams.toString());
      if (threadId) {
        query.set("thread", threadId);
      } else {
        query.delete("thread");
      }
      const queryValue = query.toString();
      router.replace((queryValue ? `/messages?${queryValue}` : "/messages") as Route, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const markThreadRead = useCallback(
    async (threadId: string) => {
      if (!userId) return;

      try {
        await fetch(`/api/messenger/threads/${threadId}/read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({ userId }),
        });
      } catch (error) {
        console.error("Failed to mark thread as read:", error);
      }
    },
    [userId],
  );

  const fetchThreads = useCallback(
    async (options?: { keepSelection?: boolean; silent?: boolean }) => {
      if (!userId) return;

      const keepSelection = options?.keepSelection ?? true;
      const silent = options?.silent ?? false;

      if (!silent) {
        setIsThreadsLoading(true);
      }

      try {
        const response = await fetch(`/api/messenger/threads?userId=${userId}`, {
          cache: "no-store",
          headers: {
            "x-user-id": userId,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load threads");
        }

        const data = await response.json();
        const incomingThreads = (data.threads || []) as MessengerThreadListItem[];
        setThreads(incomingThreads);
        registerPollingSuccess("threads");

        const availableThreadIds = new Set(incomingThreads.map((thread) => thread.id));
        const urlSelection = threadFromUrl && availableThreadIds.has(threadFromUrl) ? threadFromUrl : null;

        if (keepSelection && selectedThreadId && availableThreadIds.has(selectedThreadId)) {
          return;
        }

        const fallbackSelection = urlSelection ?? incomingThreads[0]?.id ?? null;
        setSelectedThreadId(fallbackSelection);
        syncThreadIntoQuery(fallbackSelection);
      } catch (error) {
        console.error(error);
        registerPollingFailure("threads", "Unable to load your conversations right now.");
      } finally {
        if (!silent) {
          setIsThreadsLoading(false);
        }
      }
    },
    [
      registerPollingFailure,
      registerPollingSuccess,
      selectedThreadId,
      syncThreadIntoQuery,
      threadFromUrl,
      userId,
    ],
  );

  const fetchRequests = useCallback(
    async (silent = false) => {
      if (!userId) return;
      if (!silent) {
        setIsRequestsLoading(true);
      }

      try {
        const response = await fetch(`/api/job-requests?userId=${userId}&role=both`, {
          cache: "no-store",
          headers: {
            "x-user-id": userId,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load requests");
        }

        const data = await response.json();
        setRequests((data.requests || []) as JobRequest[]);
      } catch (error) {
        console.error(error);
        setErrorText("Unable to load your requests right now.");
      } finally {
        if (!silent) {
          setIsRequestsLoading(false);
        }
      }
    },
    [userId],
  );

  const fetchMessages = useCallback(
    async (threadId: string, silent = false) => {
      if (!userId) return;
      if (!silent) {
        setIsMessagesLoading(true);
      }

      try {
        const response = await fetch(
          `/api/messenger/threads/${threadId}/messages?userId=${userId}&limit=100`,
          {
            cache: "no-store",
            headers: {
              "x-user-id": userId,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const data = await response.json();
        setMessages((data.messages || []) as MessengerMessage[]);
        registerPollingSuccess("messages");
      } catch (error) {
        console.error(error);
        registerPollingFailure(
          "messages",
          "Unable to load messages for this conversation.",
        );
      } finally {
        if (!silent) {
          setIsMessagesLoading(false);
        }
      }
    },
    [registerPollingFailure, registerPollingSuccess, userId],
  );

  const openThread = useCallback(
    async (thread: MessengerThreadListItem) => {
      setSelectedThreadId(thread.id);
      setMobileView("chat");
      syncThreadIntoQuery(thread.id);
      await fetchMessages(thread.id);

      if (thread.unread_count > 0) {
        await markThreadRead(thread.id);
        await fetchThreads({ silent: true });
      }
    },
    [fetchMessages, fetchThreads, markThreadRead, syncThreadIntoQuery],
  );

  const sendMessage = useCallback(async () => {
    if (!userId || !selectedThreadId) return;

    const text = composerText.trim();
    if (!text) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`/api/messenger/threads/${selectedThreadId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          senderUserId: userId,
          messageText: text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      const nextMessage = data.message as MessengerMessage;
      setMessages((prev) => [...prev, nextMessage]);
      setComposerText("");

      await fetchThreads({ silent: true });
      await markThreadRead(selectedThreadId);
    } catch (error) {
      console.error(error);
      toast.error("Could not send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [composerText, fetchThreads, markThreadRead, selectedThreadId, userId]);

  const updateRequestStatus = useCallback(
    async (request: JobRequest, status: JobRequestStatus) => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/job-requests/${request.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            userId,
            status,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update request");
        }

        toast.success(`Request marked as ${REQUEST_STATUS_LABELS[status].toLowerCase()}.`);
        await Promise.all([fetchRequests(true), fetchThreads({ silent: true })]);
      } catch (error) {
        console.error(error);
        toast.error("Could not update request right now.");
      }
    },
    [fetchRequests, fetchThreads, userId],
  );

  useEffect(() => {
    if (!userId) return;

    void Promise.all([fetchThreads({ keepSelection: false }), fetchRequests()]);
  }, [fetchRequests, fetchThreads, userId]);

  useEffect(() => {
    if (!selectedThreadId || !userId) {
      setMessages([]);
      return;
    }

    void fetchMessages(selectedThreadId);
  }, [fetchMessages, selectedThreadId, userId]);

  useEffect(() => {
    if (!selectedThreadId || !userId) return;

    const activeThread = threads.find((thread) => thread.id === selectedThreadId);
    if (!activeThread || activeThread.unread_count <= 0) return;

    void (async () => {
      await markThreadRead(selectedThreadId);
      await fetchThreads({ silent: true });
    })();
  }, [fetchThreads, markThreadRead, selectedThreadId, threads, userId]);

  useEffect(() => {
    if (!messages.length) return;
    const container = messagesScrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, selectedThreadId]);

  useEffect(() => {
    if (!userId) return;

    const threadsPoll = window.setInterval(() => {
      void fetchThreads({ silent: true });
    }, THREADS_POLL_INTERVAL_MS);

    const requestsPoll = window.setInterval(() => {
      void fetchRequests(true);
    }, REQUESTS_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(threadsPoll);
      window.clearInterval(requestsPoll);
    };
  }, [fetchRequests, fetchThreads, userId]);

  useEffect(() => {
    if (!selectedThreadId || !userId) return;

    const messagesPoll = window.setInterval(() => {
      void fetchMessages(selectedThreadId, true);
    }, MESSAGES_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(messagesPoll);
    };
  }, [fetchMessages, selectedThreadId, userId]);

  useEffect(() => {
    if (!threadFromUrl) return;
    if (!threads.length) return;

    const thread = threads.find((item) => item.id === threadFromUrl);
    if (!thread) return;
    if (selectedThreadId === thread.id) return;

    void openThread(thread);
  }, [openThread, selectedThreadId, threadFromUrl, threads]);

  if (!userId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            Sign in to open your inbox
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your message threads and requests appear here after authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f3f4f6_42%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Messages
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage conversations and request lifecycle in one place.
              </p>
            </div>

            <div className="flex w-full gap-2 md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search messages or requests..."
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition",
              mobileView === "list"
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-700",
            )}
          >
            <ListFilter className="h-4 w-4" />
            Threads
            {totalUnread > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileView("chat")}
            disabled={!selectedThread}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition",
              mobileView === "chat"
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-700",
              !selectedThread && "cursor-not-allowed opacity-50",
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => setMobileView("requests")}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition",
              mobileView === "requests"
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-700",
            )}
          >
            <Filter className="h-4 w-4" />
            Requests
          </button>
        </div>

        {errorText && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorText}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <section
            className={cn(
              "flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm",
              mobileView === "list" ? "block" : "hidden lg:block",
            )}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">
                Threads
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {threads.length}
              </span>
            </div>

            <div className="max-h-[64vh] overflow-y-auto lg:h-[calc(100vh-320px)] lg:max-h-none">
              {isThreadsLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : threads.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm font-medium text-slate-700">No conversations yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Start by contacting a talent from their profile.
                  </p>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm font-medium text-slate-700">No matching conversations</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try a different search term.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1 p-2">
                  {filteredThreads.map((thread) => {
                    const isSelected = thread.id === selectedThreadId;
                    const hasUnread = thread.unread_count > 0;
                    const name = displayNameFromThread(thread);

                    return (
                      <li key={thread.id}>
                        <button
                          type="button"
                          onClick={() => void openThread(thread)}
                          className={cn(
                            "w-full rounded-2xl border px-3 py-3 text-left transition",
                            isSelected
                              ? "border-slate-300 bg-slate-100/80"
                              : "border-transparent hover:border-slate-200 hover:bg-slate-50",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                              {thread.other_user_avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thread.other_user_avatar}
                                  alt={name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                initialsFromName(name)
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {name}
                                </p>
                                <span className="whitespace-nowrap text-[11px] text-slate-500">
                                  {formatRelativeTime(thread.last_message_at || thread.updated_at)}
                                </span>
                              </div>

                              <p className="mt-0.5 truncate text-xs text-slate-600">
                                {thread.last_message_text || "No messages yet"}
                              </p>

                              <div className="mt-2 flex items-center justify-between">
                                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
                                  {thread.thread_type}
                                </span>
                                {hasUnread && (
                                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                                    {thread.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section
            className={cn(
              "flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm",
              mobileView === "chat" ? "block" : "hidden lg:block",
            )}
          >
            {!selectedThread ? (
              <div className="flex min-h-[68vh] items-center justify-center p-8 text-center">
                <div>
                  <ArrowLeft className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Select a conversation to start messaging
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[64vh] flex-1 flex-col lg:min-h-0">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 lg:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {displayNameFromThread(selectedThread)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {selectedThread.other_user_headline || "Conversation"}
                    </p>
                  </div>
                </div>

                <div
                  ref={messagesScrollRef}
                  className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4 lg:h-[calc(100vh-390px)]"
                >
                  {isMessagesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-200/70" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <Circle className="mx-auto h-7 w-7 text-slate-400" />
                        <p className="mt-2 text-sm font-medium text-slate-700">
                          No messages yet
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Send the first message to start this conversation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_user_id === userId;
                      return (
                        <div
                          key={message.id}
                          className={cn("flex", isMine ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[92%] rounded-2xl border px-4 py-2.5 text-sm shadow-sm sm:max-w-[75%]",
                              isMine
                                ? "border-amber-200 bg-amber-50 text-slate-900"
                                : "border-slate-200 bg-white text-slate-800",
                            )}
                          >
                            <p className="whitespace-pre-wrap leading-6">{message.message_text}</p>
                            <p className="mt-1 text-right text-[11px] text-slate-500">
                              {formatRelativeTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-200 bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={composerText}
                      onChange={(event) => setComposerText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void sendMessage();
                        }
                      }}
                      rows={1}
                      placeholder="Write a message..."
                      className={cn(
                        "min-h-[44px] max-h-36 flex-1 resize-none rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500",
                        isComposerOverLimit ? "border-rose-400" : "border-slate-300",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={!composerText.trim() || isSending || isComposerOverLimit}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <SendHorizonal className="h-4 w-4" />
                    </button>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-right text-[11px]",
                      isComposerNearLimit ? "text-rose-600" : "text-slate-500",
                    )}
                  >
                    {composerLength} / {MAX_MESSAGE_LENGTH}
                  </p>
                </div>
              </div>
            )}
          </section>

          <aside
            className={cn(
              "flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm",
              mobileView === "requests" ? "block" : "hidden lg:block",
            )}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">
                  Requests
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {requests.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-slate-200 px-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                {REQUEST_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setRequestFilter(option.key)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                      requestFilter === option.key
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                    )}
                  >
                    {option.label}
                    {option.key !== "all" && requestCounts[option.key] ? ` (${requestCounts[option.key]})` : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[63vh] space-y-2 overflow-y-auto p-3 lg:h-[calc(100vh-352px)] lg:max-h-none">
              {isRequestsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm font-medium text-slate-700">No requests found</p>
                  <p className="mt-1 text-xs text-slate-500">
                    New proposals will appear here.
                  </p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const linkedThread = threadByRequestId.get(request.id);
                  const isCompany = request.company_user_id === userId;
                  const isTalent = request.talent_user_id === userId;
                  const canAcceptOrDecline =
                    isTalent && (request.status === "sent" || request.status === "viewed");
                  const canWithdraw = isCompany && (request.status === "sent" || request.status === "viewed");
                  const canArchive =
                    request.status !== "archived" &&
                    ["accepted", "declined", "withdrawn"].includes(request.status);

                  const otherName = isCompany
                    ? request.talent_name || "Talent"
                    : request.company_name || "Company";

                  return (
                    <div key={request.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <button
                        type="button"
                        onClick={() => linkedThread && void openThread(linkedThread)}
                        className={cn(
                          "w-full text-left",
                          linkedThread ? "cursor-pointer" : "cursor-default",
                        )}
                      >
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {request.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          With {otherName}
                        </p>
                      </button>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            REQUEST_STATUS_STYLES[request.status],
                          )}
                        >
                          {REQUEST_STATUS_LABELS[request.status]}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatRelativeTime(request.updated_at)}
                        </span>
                      </div>

                      {(canAcceptOrDecline || canWithdraw || canArchive) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {canAcceptOrDecline && (
                            <>
                              <button
                                type="button"
                                onClick={() => void updateRequestStatus(request, "accepted")}
                                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => void updateRequestStatus(request, "declined")}
                                className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 transition hover:bg-rose-100"
                              >
                                <X className="h-3.5 w-3.5" />
                                Decline
                              </button>
                            </>
                          )}

                          {canWithdraw && (
                            <button
                              type="button"
                              onClick={() => void updateRequestStatus(request, "withdrawn")}
                              className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 transition hover:bg-orange-100"
                            >
                              <X className="h-3.5 w-3.5" />
                              Withdraw
                            </button>
                          )}

                          {canArchive && (
                            <button
                              type="button"
                              onClick={() => void updateRequestStatus(request, "archived")}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
