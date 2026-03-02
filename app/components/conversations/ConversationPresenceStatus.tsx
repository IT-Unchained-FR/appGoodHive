"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface ConversationPresenceStatusProps {
  isTyping: boolean;
  lastActiveAt?: string | null;
  subjectLabel: string;
  showLastActive: boolean;
  className?: string;
}

export function ConversationPresenceStatus({
  isTyping,
  lastActiveAt,
  subjectLabel,
  showLastActive,
  className = "",
}: ConversationPresenceStatusProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (isTyping || !showLastActive || !lastActiveAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isTyping, lastActiveAt, showLastActive]);

  if (isTyping) {
    return (
      <div className={`inline-flex items-center gap-2 text-sm text-amber-600 ${className}`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
        </span>
        <span className="font-medium">{subjectLabel} is typing...</span>
      </div>
    );
  }

  if (!showLastActive || !lastActiveAt) {
    return null;
  }

  const lastActiveDate = new Date(lastActiveAt);
  const isActiveNow = Date.now() - lastActiveDate.getTime() < 2 * 60 * 1000;
  const label = isActiveNow
    ? "Active now"
    : `Last active ${formatDistanceToNow(lastActiveDate, { addSuffix: true })}`;

  return (
    <div className={`inline-flex items-center gap-2 text-sm text-slate-500 ${className}`}>
      <span
        className={`h-2.5 w-2.5 rounded-full ${isActiveNow ? "bg-emerald-500" : "bg-slate-300"}`}
      />
      <span>{label}</span>
    </div>
  );
}
