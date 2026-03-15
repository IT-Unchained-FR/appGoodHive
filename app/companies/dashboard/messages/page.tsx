"use client";

import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";
import type { MessengerMessage, MessengerThreadListItem } from "@/interfaces/messenger";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Circle,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  SendHorizonal,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const THREADS_POLL_INTERVAL_MS = 9000;
const MESSAGES_POLL_INTERVAL_MS = 4000;

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatRelativeTime(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TalentInfoPanel({ thread }: { thread: MessengerThreadListItem }) {
  const name = thread.other_user_name || "Talent";
  const skills = thread.other_user_skills
    ? thread.other_user_skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : [];

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-lg font-bold text-amber-700">
          {thread.other_user_avatar ? (
            <img src={thread.other_user_avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            initialsFromName(name)
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          {thread.other_user_headline && (
            <p className="mt-0.5 text-xs text-slate-500">{thread.other_user_headline}</p>
          )}
          {thread.other_user_location && (
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3 w-3" />
              {thread.other_user_location}
            </p>
          )}
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {thread.other_user_bio && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">About</p>
          <p className="line-clamp-4 text-xs leading-relaxed text-slate-600">{thread.other_user_bio}</p>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4">
        <Link
          href={`/talents/${thread.other_user_id}` as any}
          target="_blank"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Full Profile
        </Link>
      </div>
    </div>
  );
}

export default function CompanyMessagesPage() {
  const userId = useCurrentUserId();
  const [threads, setThreads] = useState<MessengerThreadListItem[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessengerThreadListItem | null>(null);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [composerText, setComposerText] = useState("");
  const [isThreadsLoading, setIsThreadsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const threadsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/messenger/threads", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.threads ?? []);
    } catch {
      // silent
    } finally {
      setIsThreadsLoading(false);
    }
  }, [userId]);

  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/messenger/threads/${threadId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
      setTimeout(() => {
        messagesScrollRef.current?.scrollTo({ top: messagesScrollRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch {
      // silent
    }
  }, []);

  const markThreadRead = useCallback(async (threadId: string) => {
    try {
      await fetch(`/api/messenger/threads/${threadId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // silent
    }
  }, []);

  const openThread = useCallback(
    async (thread: MessengerThreadListItem) => {
      setSelectedThread(thread);
      setIsMessagesLoading(true);
      setMobileView("chat");
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, unread_count: 0 } : t)));
      await fetchMessages(thread.id);
      setIsMessagesLoading(false);
      void markThreadRead(thread.id);
    },
    [fetchMessages, markThreadRead],
  );

  const sendMessage = useCallback(async () => {
    const text = composerText.trim();
    if (!text || !selectedThread || isSending) return;
    setComposerText("");
    setIsSending(true);
    const optimisticId = `pending-${Date.now()}`;
    const optimistic: MessengerMessage & { pending?: boolean } = {
      id: optimisticId,
      thread_id: selectedThread.id,
      sender_user_id: userId ?? "",
      message_type: "text",
      message_text: text,
      attachment_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => {
      messagesScrollRef.current?.scrollTo({ top: messagesScrollRef.current.scrollHeight, behavior: "smooth" });
    }, 30);
    try {
      const res = await fetch(`/api/messenger/threads/${selectedThread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: text, messageType: "text" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data.message : m)));
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setComposerText(text);
    } finally {
      setIsSending(false);
    }
  }, [composerText, selectedThread, isSending, userId]);

  useEffect(() => {
    if (!userId) return;
    void fetchThreads();
    threadsIntervalRef.current = setInterval(() => void fetchThreads(), THREADS_POLL_INTERVAL_MS);
    return () => {
      if (threadsIntervalRef.current) clearInterval(threadsIntervalRef.current);
    };
  }, [userId, fetchThreads]);

  useEffect(() => {
    if (!selectedThread) return;
    if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
    messagesIntervalRef.current = setInterval(() => void fetchMessages(selectedThread.id), MESSAGES_POLL_INTERVAL_MS);
    return () => {
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
    };
  }, [selectedThread, fetchMessages]);

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Left: Thread list */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-slate-200 lg:w-72 lg:flex-shrink-0",
          mobileView === "chat" ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">Conversations</p>
          <p className="text-xs text-slate-400">{threads.length} thread{threads.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isThreadsLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex animate-pulse gap-3 rounded-xl p-2">
                  <div className="h-10 w-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-3/4 rounded bg-slate-200" />
                    <div className="h-2.5 w-1/2 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">No conversations yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Visit a talent&apos;s profile and click Contact to start a conversation.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-0.5 p-2">
              {threads.map((thread) => {
                const isSelected = thread.id === selectedThread?.id;
                const hasUnread = thread.unread_count > 0;
                const name = thread.other_user_name || "Talent";
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => void openThread(thread)}
                      className={cn(
                        "w-full rounded-xl px-3 py-2.5 text-left transition",
                        isSelected ? "bg-amber-50 border border-amber-100" : "hover:bg-slate-50 border border-transparent",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                          {thread.other_user_avatar ? (
                            <img src={thread.other_user_avatar} alt={name} className="h-full w-full object-cover" />
                          ) : (
                            initialsFromName(name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className={cn("truncate text-sm font-medium", hasUnread ? "font-semibold text-slate-900" : "text-slate-700")}>
                              {name}
                            </p>
                            {hasUnread && (
                              <span className="flex-shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {thread.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-slate-400">
                            {thread.other_user_headline || thread.last_message_text || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Middle: Chat */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          mobileView === "list" ? "hidden lg:flex" : "flex",
        )}
      >
        {!selectedThread ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <User className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Select a conversation</p>
              <p className="mt-1 text-xs text-slate-400">Choose a thread to view messages and talent details.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                {selectedThread.other_user_avatar ? (
                  <img src={selectedThread.other_user_avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsFromName(selectedThread.other_user_name || "T")
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {selectedThread.other_user_name || "Talent"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {selectedThread.other_user_headline || "Conversation"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesScrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4"
            >
              {isMessagesLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={cn("flex animate-pulse", i % 2 === 0 ? "justify-start" : "justify-end")}>
                      <div className="h-10 w-48 rounded-2xl bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Circle className="mx-auto h-6 w-6 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-600">No messages yet</p>
                    <p className="mt-1 text-xs text-slate-400">Send the first message below.</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_user_id === userId;
                  const isPending = Boolean((message as any).pending);
                  return (
                    <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl border px-4 py-2.5 text-sm shadow-sm",
                          isMine && isPending
                            ? "border-slate-200 bg-slate-100 text-slate-600 opacity-75"
                            : isMine
                            ? "border-amber-200 bg-amber-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-800",
                        )}
                      >
                        <p className="whitespace-pre-wrap leading-6">{message.message_text}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-400">
                          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                          <span>{formatRelativeTime(message.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-slate-200 bg-white p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Write a message..."
                  className="min-h-[44px] max-h-36 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!composerText.trim() || isSending}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-right text-[11px] text-slate-400">{composerText.length} / 5000</p>
            </div>
          </>
        )}
      </div>

      {/* Right: Talent info panel */}
      {selectedThread && (
        <div className="hidden w-72 flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-white lg:block">
          <TalentInfoPanel thread={selectedThread} />
        </div>
      )}
    </div>
  );
}
