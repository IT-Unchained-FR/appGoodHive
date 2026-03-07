"use client";

import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";
import { ArrowRight, SendHorizonal } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface QuickRequestComposerProps {
  targetTalentUserId: string;
  talentName: string;
}

export function QuickRequestComposer({
  targetTalentUserId,
  talentName,
}: QuickRequestComposerProps) {
  const router = useRouter();
  const currentUserId = useCurrentUserId();
  const { checkAuthAndShowConnectPrompt } = useAuthCheck();

  const [title, setTitle] = useState(`Opportunity for ${talentName}`);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = currentUserId === targetTalentUserId;

  const handleSubmit = async () => {
    if (!checkAuthAndShowConnectPrompt("send a request", "service-action", { serviceType: "request-send" })) {
      return;
    }

    if (!currentUserId) {
      toast.error("Please connect your account first.");
      return;
    }

    if (isOwner) {
      toast.error("You cannot send a request to your own profile.");
      return;
    }

    const normalizedTitle = title.trim();
    const normalizedMessage = message.trim();

    if (!normalizedTitle) {
      toast.error("Please add a request title.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/job-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId,
        },
        body: JSON.stringify({
          companyUserId: currentUserId,
          talentUserId: targetTalentUserId,
          title: normalizedTitle,
          requestMessage: normalizedMessage || undefined,
          actorUserId: currentUserId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send request");
      }

      const data = await response.json();
      toast.success("Request sent. Conversation started.");

      const threadId = data.thread?.id as string | undefined;
      if (threadId) {
        router.push(`/messages?thread=${threadId}` as Route);
        return;
      }

      router.push("/messages" as Route);
    } catch (error) {
      console.error(error);
      toast.error("Could not send request right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">
        Send Request
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Start a direct proposal conversation with {talentName}.
      </p>

      <div className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Request title"
          className="h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          disabled={isOwner || isSubmitting}
        />

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Share project scope, expected timeline, and next steps..."
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          disabled={isOwner || isSubmitting}
        />

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isOwner || isSubmitting || !title.trim()}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending...
            </>
          ) : isOwner ? (
            <>
              This Is Your Profile
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <SendHorizonal className="h-4 w-4" />
              Send Request
            </>
          )}
        </button>
      </div>
    </section>
  );
}
