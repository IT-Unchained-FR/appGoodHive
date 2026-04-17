import type { MessengerThreadListItem } from "@/interfaces/messenger";
import { ChevronUp, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import type { UiMessengerMessage } from "../../_utils/messenger-helpers";
import {
  formatDateSeparator,
  isSameDay,
} from "../../_utils/messenger-helpers";
import { MessageBubble } from "./MessageBubble";
import { MessageListSkeleton } from "./MessageListSkeleton";

interface MessageListProps {
  messages: UiMessengerMessage[];
  isLoading: boolean;
  hasEarlierMessages: boolean;
  isLoadingEarlier: boolean;
  currentUserId: string;
  thread: MessengerThreadListItem;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onLoadEarlier: () => void;
  onImageClick: (url: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  hasEarlierMessages,
  isLoadingEarlier,
  currentUserId,
  thread,
  scrollRef,
  onLoadEarlier,
  onImageClick,
}: MessageListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden">
        <MessageListSkeleton />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
          <Sparkles className="h-5 w-5 text-amber-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">Start the conversation</p>
          <p className="mt-0.5 text-xs text-slate-400">Be the first to say hello</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef as React.RefObject<HTMLDivElement>}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
    >
      {/* Load earlier button */}
      {hasEarlierMessages && (
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={onLoadEarlier}
            disabled={isLoadingEarlier}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500 shadow-sm hover:border-amber-300 hover:text-amber-700 transition-colors disabled:opacity-50"
          >
            {isLoadingEarlier ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
            Load earlier messages
          </button>
        </div>
      )}

      {/* Messages with date separators */}
      {messages.map((msg, idx) => {
        const prevMsg = messages[idx - 1];
        const showDateSep =
          !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);
        const prevSender = prevMsg?.sender_user_id;
        const showAvatar = msg.sender_user_id !== prevSender;
        const isMine = msg.sender_user_id === currentUserId;
        const senderName = isMine
          ? "You"
          : thread.other_user_name ?? "Unknown";

        return (
          <div key={msg.id}>
            {showDateSep && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatDateSeparator(msg.created_at)}
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>
            )}
            <MessageBubble
              message={msg}
              isMine={isMine}
              showAvatar={showAvatar}
              senderName={senderName}
              senderAvatar={isMine ? undefined : thread.other_user_avatar}
              onImageClick={onImageClick}
            />
          </div>
        );
      })}
    </div>
  );
}
