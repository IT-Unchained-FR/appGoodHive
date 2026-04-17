"use client";

import type { MessengerThreadListItem } from "@/interfaces/messenger";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import type { UiMessengerMessage } from "../../_utils/messenger-helpers";
import { ChatHeader } from "./ChatHeader";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

interface ChatPanelProps {
  thread: MessengerThreadListItem | null;
  messages: UiMessengerMessage[];
  isLoading: boolean;
  isSending: boolean;
  hasEarlierMessages: boolean;
  isLoadingEarlier: boolean;
  currentUserId: string;
  composerText: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onComposerChange: (text: string) => void;
  onSendMessage: (attachmentUrl?: string) => void;
  onLoadEarlier: () => void;
  onBack: () => void;
  showBackButton: boolean;
}

export function ChatPanel({
  thread,
  messages,
  isLoading,
  isSending,
  hasEarlierMessages,
  isLoadingEarlier,
  currentUserId,
  composerText,
  scrollRef,
  onComposerChange,
  onSendMessage,
  onLoadEarlier,
  onBack,
  showBackButton,
}: ChatPanelProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // No thread selected — placeholder
  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50/50">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
          <MessageSquare className="h-7 w-7 text-amber-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">Select a conversation</p>
          <p className="mt-1 text-xs text-slate-500">
            Your messages with talents and companies appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <ChatHeader thread={thread} onBack={onBack} showBackButton={showBackButton} />

      <MessageList
        messages={messages}
        isLoading={isLoading}
        hasEarlierMessages={hasEarlierMessages}
        isLoadingEarlier={isLoadingEarlier}
        currentUserId={currentUserId}
        thread={thread}
        scrollRef={scrollRef}
        onLoadEarlier={onLoadEarlier}
        onImageClick={(url) => setLightboxUrl(url)}
      />

      <MessageComposer
        value={composerText}
        onChange={onComposerChange}
        onSend={onSendMessage}
        isSending={isSending}
      />

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="attachment"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
