import type { MessengerThreadListItem } from "@/interfaces/messenger";
import {
  displayNameFromThread,
  formatRelativeTime,
  stripHtml,
} from "../../_utils/messenger-helpers";
import { UnreadBadge } from "../shared/UnreadBadge";
import { UserAvatar } from "../shared/UserAvatar";

const THREAD_TYPE_LABELS: Record<string, string> = {
  direct: "Direct",
  application: "Application",
  request: "Request",
  job: "Job",
};

interface ThreadListItemProps {
  thread: MessengerThreadListItem;
  isSelected: boolean;
  currentUserId: string;
  onClick: () => void;
}

export function ThreadListItem({
  thread,
  isSelected,
  currentUserId,
  onClick,
}: ThreadListItemProps) {
  const name = displayNameFromThread(thread);
  const unread = Number(thread.unread_count || 0);
  const hasUnread = unread > 0;
  const preview = thread.last_message_text
    ? stripHtml(thread.last_message_text)
    : "No messages yet";
  const isOwnLastMessage =
    thread.last_message_sender_user_id === currentUserId;
  const previewText = isOwnLastMessage ? `You: ${preview}` : preview;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
        isSelected
          ? "bg-slate-100 border-amber-400"
          : hasUnread
            ? "bg-amber-50/60 border-amber-200 hover:bg-amber-50"
            : "border-transparent hover:bg-slate-50"
      }`}
    >
      {/* Avatar with unread dot */}
      <div className="relative flex-shrink-0">
        <UserAvatar src={thread.other_user_avatar} name={name} size="md" />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-sm ${
              hasUnread ? "font-semibold text-slate-900" : "font-medium text-slate-800"
            }`}
          >
            {name}
          </span>
          <span className="flex-shrink-0 text-[11px] text-slate-400">
            {formatRelativeTime(
              thread.last_message_at ?? thread.updated_at,
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span
            className={`truncate text-xs ${
              hasUnread ? "font-medium text-slate-700" : "text-slate-500"
            }`}
          >
            {previewText}
          </span>
          <div className="flex-shrink-0 flex items-center gap-1">
            {hasUnread && <UnreadBadge count={unread} />}
            {!hasUnread && thread.thread_type !== "direct" && (
              <span className="rounded-full border border-slate-200 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-slate-400">
                {THREAD_TYPE_LABELS[thread.thread_type] ?? thread.thread_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
