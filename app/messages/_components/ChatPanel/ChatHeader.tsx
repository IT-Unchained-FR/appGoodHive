import type { MessengerThreadListItem } from "@/interfaces/messenger";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { displayNameFromThread } from "../../_utils/messenger-helpers";
import { UserAvatar } from "../shared/UserAvatar";

const THREAD_TYPE_LABELS: Record<string, string> = {
  direct: "Direct",
  application: "Application",
  request: "Request",
  job: "Job",
};

interface ChatHeaderProps {
  thread: MessengerThreadListItem;
  onBack: () => void;
  showBackButton: boolean;
}

export function ChatHeader({ thread, onBack, showBackButton }: ChatHeaderProps) {
  const name = displayNameFromThread(thread);
  const profilePath =
    thread.other_user_role === "talent"
      ? `/talents/${thread.other_user_id}`
      : `/companies/${thread.other_user_id}`;

  return (
    <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      {/* Back button — mobile only */}
      {showBackButton && (
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      <UserAvatar src={thread.other_user_avatar} name={name} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">{name}</span>
          {thread.thread_type !== "direct" && (
            <span className="flex-shrink-0 rounded-full border border-slate-200 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-slate-500">
              {THREAD_TYPE_LABELS[thread.thread_type] ?? thread.thread_type}
            </span>
          )}
        </div>
        {thread.other_user_headline && (
          <p className="truncate text-xs text-slate-500">{thread.other_user_headline}</p>
        )}
      </div>

      {/* View profile link */}
      <Link
        href={profilePath as Parameters<typeof Link>[0]["href"]}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:border-amber-300 hover:text-amber-700 transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        <span className="hidden sm:inline">Profile</span>
      </Link>
    </div>
  );
}
