"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Loader2,
  MessageSquare,
  Search,
  SendHorizontal,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  IConversationMessage,
  IConversationSummary,
  IConversationThreadDetail,
} from "@/interfaces/conversation";
import { ApplicationStatusBadge } from "@/app/components/applications/ApplicationStatusBadge";
import { ConversationPresenceStatus } from "@/app/components/conversations/ConversationPresenceStatus";

interface ConversationThreadResponse {
  thread: IConversationThreadDetail;
  messages: IConversationMessage[];
  viewerUserId: string;
}

type ConversationFilter = "all" | "unread" | "awaiting_talent";

export default function TalentApplicationsPage() {
  const searchParams = useSearchParams();
  const requestedThreadId = searchParams.get("thread");
  const [threads, setThreads] = useState<IConversationSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] =
    useState<ConversationThreadResponse | null>(null);
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(
    async (
      {
        showLoader = true,
        notifyOnError = true,
      }: {
        showLoader?: boolean;
        notifyOnError?: boolean;
      } = {},
    ) => {
    try {
      if (showLoader) {
        setIsLoadingThreads(true);
      }
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (searchTerm.trim()) params.set("q", searchTerm.trim());

      const response = await fetch(`/api/conversations/talent?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      const nextThreads: IConversationSummary[] = data.threads || [];
      setThreads(nextThreads);

      if (!nextThreads.length) {
        setSelectedThreadId(null);
        setThreadDetail(null);
        return;
      }

      const requestedThreadExists = requestedThreadId
        ? nextThreads.some((thread) => thread.id === requestedThreadId)
        : false;
      const stillExists = nextThreads.some((thread) => thread.id === selectedThreadId);

      if (requestedThreadExists) {
        setSelectedThreadId(requestedThreadId);
      } else if (!selectedThreadId || !stillExists) {
        setSelectedThreadId(nextThreads[0].id);
      }
    } catch (error) {
      console.error("Error loading application conversations:", error);
      if (notifyOnError) {
        toast.error("Failed to load your application conversations");
      }
    } finally {
      if (showLoader) {
        setIsLoadingThreads(false);
      }
    }
    },
    [filter, requestedThreadId, searchTerm, selectedThreadId],
  );

  const markThreadRead = useCallback(async (threadId: string, messageId?: string) => {
    try {
      await fetch(`/api/conversations/${threadId}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lastReadMessageId: messageId }),
      });

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId ? { ...thread, unread_count: 0 } : thread,
        ),
      );
    } catch (error) {
      console.error("Error marking thread as read:", error);
    }
  }, []);

  const loadThreadDetail = useCallback(
    async (
      threadId: string,
      {
        showLoader = true,
        notifyOnError = true,
      }: {
        showLoader?: boolean;
        notifyOnError?: boolean;
      } = {},
    ) => {
      try {
        if (showLoader) {
          setIsLoadingThread(true);
        }
        const response = await fetch(`/api/conversations/${threadId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch conversation");
        }

        const data: ConversationThreadResponse = await response.json();
        setThreadDetail(data);

        const latestMessage = data.messages[data.messages.length - 1];
        if (latestMessage) {
          void markThreadRead(threadId, latestMessage.id);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
        if (notifyOnError) {
          toast.error("Failed to load conversation");
        }
      } finally {
        if (showLoader) {
          setIsLoadingThread(false);
        }
      }
    },
    [markThreadRead],
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }

      void loadThreads({ showLoader: false, notifyOnError: false });
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadThreads]);

  useEffect(() => {
    if (selectedThreadId) {
      void loadThreadDetail(selectedThreadId);
    }
  }, [loadThreadDetail, selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }

      void loadThreadDetail(selectedThreadId, {
        showLoader: false,
        notifyOnError: false,
      });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadThreadDetail, selectedThreadId]);

  const updatePresence = useCallback(
    async (threadId: string, isTyping?: boolean) => {
      try {
        await fetch(`/api/conversations/${threadId}/presence`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isTyping === undefined ? {} : { isTyping },
          ),
        });
      } catch (error) {
        console.error("Error updating conversation presence:", error);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedThreadId || !threadDetail?.thread.can_reply) {
      return;
    }

    void updatePresence(selectedThreadId);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }

      void updatePresence(selectedThreadId);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedThreadId, threadDetail?.thread.can_reply, updatePresence]);

  const isTyping = Boolean(
    selectedThreadId &&
      threadDetail?.thread.can_reply &&
      composerValue.trim().length > 0,
  );

  useEffect(() => {
    if (!selectedThreadId || !threadDetail?.thread.can_reply) {
      return;
    }

    if (!isTyping) {
      void updatePresence(selectedThreadId, false);
      return;
    }

    void updatePresence(selectedThreadId, true);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }

      void updatePresence(selectedThreadId, true);
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
      void updatePresence(selectedThreadId, false);
    };
  }, [isTyping, selectedThreadId, threadDetail?.thread.can_reply, updatePresence]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileDetailOpen(true);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThreadId || !composerValue.trim()) {
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch(
        `/api/conversations/${selectedThreadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body: composerValue }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send message");
      }

      const data = await response.json();
      const createdMessage: IConversationMessage = data.message;
      setComposerValue("");

      setThreadDetail((prev) =>
        prev
          ? {
              ...prev,
              thread: {
                ...prev.thread,
                status: data.threadStatus,
                last_message_at: createdMessage.created_at,
                last_message_preview: createdMessage.body_plaintext,
              },
              messages: [...prev.messages, createdMessage],
            }
          : prev,
      );

      setThreads((prev) => {
        const updated = prev.map((thread) =>
          thread.id === selectedThreadId
            ? {
                ...thread,
                status: data.threadStatus,
                last_message_at: createdMessage.created_at,
                last_message_preview: createdMessage.body_plaintext,
                unread_count: 0,
              }
            : thread,
        );

        return [...updated].sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() -
            new Date(a.last_message_at).getTime(),
        );
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const container = messagesViewportRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [selectedThreadId, threadDetail?.messages.length]);

  const totalUnread = useMemo(
    () => threads.reduce((sum, thread) => sum + (thread.unread_count || 0), 0),
    [threads],
  );

  const showListPane = !isMobileDetailOpen;
  const showDetailPane = !selectedThreadId || isMobileDetailOpen;
  const companySummary = buildConversationSummary(
    threadDetail?.thread.company_headline,
    "Company profile summary will appear here once the team adds more detail.",
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_24%),linear-gradient(180deg,_#fffdf7_0%,_#f8fafc_28%,_#f8fafc_100%)] px-4 pb-10 pt-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-6">
        <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,_rgba(255,251,235,0.95)_0%,_rgba(255,255,255,0.96)_55%,_rgba(248,250,252,1)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-8 px-6 py-7 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b55b14] shadow-sm">
                  Application Conversations
                </span>
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  Real-time replies
                </span>
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Manage every application thread without losing the hiring context
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Read company updates, watch presence and typing, and keep each reply tied to the
                exact role you applied for.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <TalentMetricCard label="Applications" value={threads.length} accent="amber" />
              <TalentMetricCard label="Unread" value={totalUnread} accent="sky" />
              <TalentMetricCard
                label="Mode"
                value={selectedThreadId ? "Live" : "Quiet"}
                accent="emerald"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,251,235,0.86)_0%,_rgba(255,255,255,0.98)_78%)] px-5 py-5 sm:px-7 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  My Inbox
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Company conversations
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review the latest recruiter replies, watch unread movement, and keep your
                  updates concise and role-specific.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:min-w-[430px] lg:max-w-[520px] lg:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by company, job, or message"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "All", value: "all" },
                    { label: "Unread", value: "unread" },
                    { label: "Awaiting you", value: "awaiting_talent" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value as ConversationFilter)}
                      className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                        filter === option.value
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-h-[740px] grid-cols-1 lg:grid-cols-[390px_minmax(0,1fr)]">
            <aside
              className={`border-r border-slate-200 bg-slate-50/70 ${
                showListPane ? "block" : "hidden lg:block"
              }`}
            >
              <div className="border-b border-slate-200/80 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Active threads
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {threads.length} application conversations
                    </p>
                  </div>
                  <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                    {totalUnread}
                  </span>
                </div>
              </div>

              <div className="h-full overflow-y-auto p-3 sm:p-4">
                {isLoadingThreads ? (
                  <div className="flex h-64 items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white text-slate-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading conversations...
                  </div>
                ) : threads.length === 0 ? (
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white px-6 text-center shadow-sm">
                    <MessageSquare className="mb-4 h-11 w-11 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      No application conversations yet
                    </h3>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
                      Apply to a role and the company replies will appear here in a private
                      thread.
                    </p>
                    <Link
                      href="/talents/job-search"
                      className="mt-5 inline-flex rounded-2xl bg-[linear-gradient(135deg,_#fbbf24_0%,_#f97316_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                    >
                      Browse jobs
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {threads.map((thread) => {
                      const isSelected = thread.id === selectedThreadId;
                      return (
                        <button
                          key={thread.id}
                          onClick={() => handleSelectThread(thread.id)}
                          className={`group relative w-full overflow-hidden rounded-[24px] border p-4 text-left transition ${
                            isSelected
                              ? "border-amber-200 bg-[linear-gradient(135deg,_#fff7ed_0%,_#fffbeb_100%)] shadow-[0_12px_35px_rgba(245,158,11,0.16)]"
                              : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                          }`}
                        >
                          <div
                            className={`absolute inset-y-0 left-0 w-1 rounded-r-full ${
                              isSelected ? "bg-gradient-to-b from-amber-400 to-orange-500" : "bg-transparent"
                            }`}
                          />
                          <div className="flex items-start gap-3">
                            <Avatar
                              name={thread.company_name || "Company"}
                              imageUrl={thread.company_image_url}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {thread.company_name || "Company"}
                                    </p>
                                    {thread.unread_count > 0 ? (
                                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    ) : null}
                                  </div>
                                  <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    {thread.job_title}
                                  </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                  <p className="whitespace-nowrap text-xs text-slate-400">
                                    {formatRelative(thread.last_message_at)}
                                  </p>
                                  {thread.unread_count > 0 ? (
                                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                                      {thread.unread_count}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                                {thread.last_message_preview || "No messages yet"}
                              </p>
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <ApplicationStatusBadge
                                  status={thread.application_status}
                                  size="sm"
                                />
                                <ThreadStatusBadge status={thread.status} />
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            <section className={`bg-white ${showDetailPane ? "block" : "hidden lg:block"}`}>
              {!selectedThreadId || (!threadDetail && isLoadingThread) ? (
                <div className="flex h-full min-h-[740px] items-center justify-center text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading conversation...
                </div>
              ) : !threadDetail ? (
                <div className="flex h-full min-h-[740px] flex-col items-center justify-center px-6 text-center">
                  <MessageSquare className="mb-4 h-11 w-11 text-slate-400" />
                  <h3 className="text-xl font-semibold text-slate-900">
                    Select an application thread
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                    Pick any company thread to review their response and continue the discussion.
                  </p>
                </div>
              ) : (
                <div className="flex h-full min-h-[740px] flex-col">
                  <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_rgba(255,251,235,0.65)_0%,_#ffffff_80%)] px-4 py-5 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <button
                          onClick={() => setIsMobileDetailOpen(false)}
                          className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 lg:hidden"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <Avatar
                          name={threadDetail.thread.company_name || "Company"}
                          imageUrl={threadDetail.thread.company_image_url}
                          large
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-xl font-semibold text-slate-950">
                              {threadDetail.thread.company_name || "Company"}
                            </h3>
                            <ApplicationStatusBadge
                              status={threadDetail.thread.application_status}
                              size="sm"
                            />
                            <ThreadStatusBadge status={threadDetail.thread.status} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <Briefcase className="h-4 w-4" />
                              {threadDetail.thread.job_title}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 className="h-4 w-4" />
                              Company conversation
                            </span>
                          </div>
                          <ConversationPresenceStatus
                            className="mt-3"
                            isTyping={threadDetail.thread.counterpart_is_typing}
                            lastActiveAt={threadDetail.thread.counterpart_last_active_at}
                            showLastActive={threadDetail.thread.has_two_way_exchange}
                            subjectLabel="Company"
                          />
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                            {companySummary}
                          </p>
                        </div>
                      </div>

                      {threadDetail.thread.company_user_id ? (
                        <Link
                          href={`/companies/${threadDetail.thread.company_user_id}`}
                          target="_blank"
                          className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
                        >
                          View company
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div
                    ref={messagesViewportRef}
                    className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.08),_transparent_18%),linear-gradient(180deg,_#fffdf7_0%,_#f8fafc_42%,_#f8fafc_100%)] px-4 py-6 sm:px-6"
                  >
                    <div className="mx-auto flex max-w-3xl flex-col gap-4">
                      {threadDetail.messages.map((message) => {
                        const isOwn =
                          message.sender_user_id === threadDetail.viewerUserId;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[88%] rounded-[28px] px-4 py-3 shadow-sm sm:max-w-[78%] ${
                                isOwn
                                  ? "rounded-br-md bg-[linear-gradient(135deg,_#fbbf24_0%,_#f97316_100%)] text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)]"
                                  : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                              }`}
                            >
                              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                                <span>
                                  {message.message_type === "application_intro"
                                    ? "Application message"
                                    : message.sender_role}
                                </span>
                                <span className="normal-case tracking-normal opacity-70">
                                  {formatRelative(message.created_at)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-7">
                                {message.body}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {threadDetail.thread.counterpart_is_typing ? (
                        <div className="flex justify-start">
                          <div className="inline-flex max-w-[86%] items-center gap-2 rounded-[24px] rounded-bl-md border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-sm">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                            </span>
                            Company is typing...
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6">
                    <div className="mx-auto max-w-3xl">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <label className="text-sm font-semibold text-slate-800">
                          Reply to company
                        </label>
                        <span className="text-xs font-medium text-slate-400">
                          {composerValue.trim().length}/5000
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] shadow-sm">
                        <textarea
                          value={composerValue}
                          onChange={(e) => setComposerValue(e.target.value)}
                          placeholder={
                            threadDetail.thread.can_reply
                              ? "Send an update or ask a question..."
                              : "This conversation is currently closed."
                          }
                          disabled={!threadDetail.thread.can_reply || isSending}
                          rows={4}
                          className="w-full resize-none bg-transparent px-5 py-4 text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                        />
                        <div className="flex flex-col gap-3 border-t border-slate-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                          <p className="max-w-xl text-xs leading-5 text-slate-500">
                            Keep replies focused on availability, fit, and next steps so the
                            company can evaluate quickly.
                          </p>
                          <button
                            onClick={handleSendMessage}
                            disabled={
                              isSending ||
                              !threadDetail.thread.can_reply ||
                              !composerValue.trim()
                            }
                            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#fbbf24_0%,_#f97316_100%)] px-5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(249,115,22,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <SendHorizontal className="mr-2 h-4 w-4" />
                                Send reply
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function TalentMetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "amber" | "sky" | "emerald";
}) {
  const accentStyles = {
    amber: "border-amber-200 bg-amber-50/80 text-amber-900",
    sky: "border-sky-200 bg-sky-50/80 text-sky-900",
    emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  };

  return (
    <div className={`rounded-[24px] border p-5 shadow-sm ${accentStyles[accent]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function buildConversationSummary(
  value: string | null | undefined,
  fallback: string,
) {
  const plainText = (value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) {
    return fallback;
  }

  const sentences = plainText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const summary = sentences.slice(0, 2).join(" ");
  if (!summary) {
    return fallback;
  }

  if (summary.length <= 180) {
    return summary;
  }

  return `${summary.slice(0, 177).trimEnd()}...`;
}

function Avatar({
  name,
  imageUrl,
  large = false,
}: {
  name: string;
  imageUrl?: string | null;
  large?: boolean;
}) {
  const sizeClass = large ? "h-14 w-14" : "h-12 w-12";
  const iconClass = large ? "h-6 w-6" : "h-5 w-5";

  if (imageUrl) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-2xl ${sizeClass}`}>
        <Image src={imageUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-700 ${sizeClass}`}
    >
      <UserRound className={iconClass} />
    </div>
  );
}

function ThreadStatusBadge({
  status,
}: {
  status: IConversationSummary["status"] | IConversationThreadDetail["status"];
}) {
  const labelMap: Record<string, string> = {
    open: "Open",
    awaiting_company: "Awaiting company",
    awaiting_talent: "Awaiting you",
    archived: "Archived",
    closed: "Closed",
    job_closed: "Job closed",
    blocked: "Blocked",
  };

  const colorMap: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-800",
    awaiting_company: "bg-sky-100 text-sky-800",
    awaiting_talent: "bg-amber-100 text-amber-800",
    archived: "bg-slate-100 text-slate-700",
    closed: "bg-slate-200 text-slate-700",
    job_closed: "bg-rose-100 text-rose-700",
    blocked: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[status] || colorMap.open}`}
    >
      {labelMap[status] || status}
    </span>
  );
}

function formatRelative(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
