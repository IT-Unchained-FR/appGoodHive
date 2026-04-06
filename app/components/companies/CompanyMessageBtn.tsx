"use client";

import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";
import { MessageCircle, Loader2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface CompanyMessageBtnProps {
  companyUserId: string;
  companyName: string;
}

export function CompanyMessageBtn({ companyUserId, companyName }: CompanyMessageBtnProps) {
  const router = useRouter();
  const talentUserId = useCurrentUserId();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!talentUserId) {
      toast.error("Please sign in to send a message.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/messenger/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyUserId,
          talentUserId,
          threadType: "direct",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Could not start conversation.");
        return;
      }

      const data = await res.json();
      const threadId = data.thread?.id as string | undefined;
      router.push((threadId ? `/messages?thread=${threadId}` : "/messages") as Route);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isLoading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFC905] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#f0bb00] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4" />
      )}
      {isLoading ? "Starting conversation…" : `Message ${companyName}`}
    </button>
  );
}
