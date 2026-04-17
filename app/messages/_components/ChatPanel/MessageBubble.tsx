import Image from "next/image";
import { Loader2, Paperclip } from "lucide-react";
import type { UiMessengerMessage } from "../../_utils/messenger-helpers";
import {
  filenameFromUrl,
  formatRelativeTime,
  isImageAttachment,
} from "../../_utils/messenger-helpers";
import { UserAvatar } from "../shared/UserAvatar";

interface MessageBubbleProps {
  message: UiMessengerMessage;
  isMine: boolean;
  /** Only shown on the first message in a consecutive block from the same sender */
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string | null;
  onImageClick?: (url: string) => void;
}

export function MessageBubble({
  message,
  isMine,
  showAvatar = true,
  senderName = "",
  senderAvatar,
  onImageClick,
}: MessageBubbleProps) {
  // System messages (job request status changes) — centred, muted
  if (message.message_type === "system") {
    return (
      <div className="flex justify-center my-1">
        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-xs italic text-slate-500">
          {message.message_text}
        </span>
      </div>
    );
  }

  const hasAttachment = !!message.attachment_url;
  const isImage = hasAttachment && isImageAttachment(message.attachment_url!);

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar (only for incoming, only when showAvatar=true) */}
      {!isMine && (
        <div className="mb-0.5 flex-shrink-0">
          {showAvatar ? (
            <UserAvatar src={senderAvatar} name={senderName} size="sm" />
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`flex max-w-[75%] flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
        {/* Image attachment */}
        {hasAttachment && isImage && (
          <button
            type="button"
            onClick={() => onImageClick?.(message.attachment_url!)}
            className="overflow-hidden rounded-2xl border border-amber-100 shadow-sm hover:opacity-90 transition-opacity"
          >
            <div className="relative h-48 w-64">
              <Image
                src={message.attachment_url!}
                alt="attachment"
                fill
                className="object-cover"
                sizes="256px"
              />
            </div>
          </button>
        )}

        {/* File attachment chip */}
        {hasAttachment && !isImage && (
          <a
            href={message.attachment_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-200 transition-colors"
          >
            <Paperclip className="h-4 w-4 flex-shrink-0 text-slate-500" />
            <span className="max-w-[180px] truncate">
              {filenameFromUrl(message.attachment_url!)}
            </span>
          </a>
        )}

        {/* Text bubble */}
        {message.message_text && (
          <div
            className={`rounded-3xl px-4 py-2.5 shadow-sm ${
              isMine
                ? "rounded-br-md bg-amber-50 border border-amber-200 text-slate-900"
                : "rounded-bl-md bg-white border border-slate-200 text-slate-800"
            } ${message.pending ? "opacity-60" : ""}`}
          >
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.message_text}
            </p>
          </div>
        )}

        {/* Timestamp + pending indicator */}
        <div className={`flex items-center gap-1 ${isMine ? "flex-row-reverse" : ""}`}>
          {message.pending && (
            <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-400" />
          )}
          <span
            className={`text-[10px] ${isMine ? "text-amber-700/60" : "text-slate-400"}`}
          >
            {message.pending ? "Sending…" : formatRelativeTime(message.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
