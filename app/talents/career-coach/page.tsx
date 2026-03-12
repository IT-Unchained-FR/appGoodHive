"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, Trash2, User, Sparkles, BriefcaseBusiness, CircleCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ContextSummary {
  name: string;
  completeness: number;
  skillCount: number;
  applicationCount: number;
}

const QUICK_PROMPTS = [
  "Review my profile and tell me what to improve",
  "What jobs on GoodHive match my skills?",
  "Help me write a better bio",
  "How do I get my first mission on GoodHive?",
  "What's my application status?",
];

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-slate-200" : "bg-amber-100"}`}>
        {isUser ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-amber-700" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-slate-900 text-white rounded-tr-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
          }`}
        >
          {msg.content}
        </div>
        <span className="text-xs text-slate-400 px-1">{formatTime(msg.created_at)}</span>
      </div>
    </div>
  );
}

export default function CareerCoachPage() {
  const userId = useCurrentUserId();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [context, setContext] = useState<ContextSummary | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    void loadHistory();
    void loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/superbot/coach", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setMessages(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const loadContext = async () => {
    try {
      const res = await fetch("/api/superbot/context", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setContext({
          name: json.data.profile.name,
          completeness: json.data.profile.completeness,
          skillCount: json.data.profile.skills.length,
          applicationCount: json.data.applications.length,
        });
      }
    } catch {
      // silent
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    const messageText = text.trim();
    setInput("");
    setSending(true);

    const optimisticMsg: Message = {
      id: `opt-${Date.now()}`,
      role: "user",
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/superbot/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed");

      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: json.data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear your entire conversation history with Career Coach?")) return;
    try {
      await fetch("/api/superbot/coach", { method: "DELETE" });
      setMessages([]);
      toast.success("Conversation cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-500">Please log in to use Career Coach.</p>
          <button
            type="button"
            onClick={() => { window.location.href = "/login"; }}
            className="mt-4 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="flex-shrink-0 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Career Coach</h1>
              <p className="text-xs text-slate-500">
                {context ? `Hi ${context.name} · ${context.completeness}% profile · ${context.applicationCount} applications` : "Personalized AI career guidance"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {context && context.completeness < 80 && (
              <button
                type="button"
                onClick={() => router.push("/talents/my-profile")}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
              >
                <BriefcaseBusiness className="w-3 h-3" />
                Complete Profile
              </button>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => void handleClearHistory()}
                className="p-2 text-slate-400 hover:text-rose-500 transition rounded-full hover:bg-rose-50"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Hi{context ? ` ${context.name}` : ""}! I&apos;m your GoodHive Career Coach.
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                I know your profile, applications, and the current job market. Ask me anything.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Try asking</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-amber-400 hover:text-amber-700 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {context && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm">
                <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                  <CircleCheck className="w-4 h-4" />
                  Your profile context loaded
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs text-amber-800">
                  <div>
                    <p className="text-2xl font-bold">{context.completeness}%</p>
                    <p>Profile complete</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{context.skillCount}</p>
                    <p>Skills listed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{context.applicationCount}</p>
                    <p>Applications</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}

        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-amber-700" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 py-4 border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your career coach anything..."
            disabled={sending}
            className="flex-1 rounded-full border border-slate-200 px-5 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex-shrink-0 rounded-full bg-amber-500 p-3 text-white transition hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
