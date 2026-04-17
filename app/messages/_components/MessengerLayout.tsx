"use client";

import type {
  JobRequest,
  JobRequestStatus,
  MessengerThreadListItem,
} from "@/interfaces/messenger";
import { MessageSquare, Inbox } from "lucide-react";
import type { UiMessengerMessage } from "../_utils/messenger-helpers";
import { ChatPanel } from "./ChatPanel/ChatPanel";
import { RequestsPanel } from "./RequestsPanel/RequestsPanel";
import { ThreadList } from "./ThreadList/ThreadList";
import { UnreadBadge } from "./shared/UnreadBadge";

type MobileView = "list" | "chat" | "requests";

interface MessengerLayoutProps {
  // Thread list
  threads: MessengerThreadListItem[];
  isThreadsLoading: boolean;
  selectedThread: MessengerThreadListItem | null;
  searchText: string;
  currentUserId: string;
  onSearchChange: (text: string) => void;
  onSelectThread: (thread: MessengerThreadListItem) => void;
  totalUnread: number;

  // Chat panel
  messages: UiMessengerMessage[];
  isMessagesLoading: boolean;
  isSending: boolean;
  hasEarlierMessages: boolean;
  isLoadingEarlier: boolean;
  composerText: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onComposerChange: (text: string) => void;
  onSendMessage: (attachmentUrl?: string) => void;
  onLoadEarlier: () => void;

  // Requests panel
  requests: JobRequest[];
  isRequestsLoading: boolean;
  onUpdateRequestStatus: (requestId: string, status: JobRequestStatus) => Promise<void>;

  // Mobile
  mobileView: MobileView;
  onMobileViewChange: (view: MobileView) => void;

  // Counts for mobile tabs
  requestCount: number;
}

export function MessengerLayout({
  threads,
  isThreadsLoading,
  selectedThread,
  searchText,
  currentUserId,
  onSearchChange,
  onSelectThread,
  totalUnread,

  messages,
  isMessagesLoading,
  isSending,
  hasEarlierMessages,
  isLoadingEarlier,
  composerText,
  scrollRef,
  onComposerChange,
  onSendMessage,
  onLoadEarlier,

  requests,
  isRequestsLoading,
  onUpdateRequestStatus,

  mobileView,
  onMobileViewChange,
  requestCount,
}: MessengerLayoutProps) {
  const handleSelectThread = (thread: MessengerThreadListItem) => {
    onSelectThread(thread);
    onMobileViewChange("chat");
  };

  const handleOpenThreadFromRequest = (thread: MessengerThreadListItem) => {
    onSelectThread(thread);
    onMobileViewChange("chat");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Mobile tab bar */}
      <div className="flex flex-shrink-0 border-b border-slate-200 bg-white lg:hidden">
        <button
          type="button"
          onClick={() => onMobileViewChange("list")}
          className={`relative flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            mobileView === "list"
              ? "border-b-2 border-amber-400 text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Chats
          {totalUnread > 0 && (
            <UnreadBadge count={totalUnread} className="absolute top-2 right-[calc(50%-28px)]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onMobileViewChange("requests")}
          className={`relative flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            mobileView === "requests"
              ? "border-b-2 border-amber-400 text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Inbox className="h-4 w-4" />
          Requests
          {requestCount > 0 && (
            <UnreadBadge count={requestCount} className="absolute top-2 right-[calc(50%-36px)]" />
          )}
        </button>
      </div>

      {/* 3-column desktop / single-column mobile */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thread list */}
        <div
          className={`w-full flex-shrink-0 lg:w-80 lg:flex ${
            mobileView === "list" ? "flex" : "hidden"
          } flex-col`}
        >
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThread?.id ?? null}
            isLoading={isThreadsLoading}
            searchText={searchText}
            currentUserId={currentUserId}
            onSearchChange={onSearchChange}
            onSelectThread={handleSelectThread}
          />
        </div>

        {/* Chat panel */}
        <div
          className={`flex-1 flex-col overflow-hidden lg:flex ${
            mobileView === "chat" ? "flex" : "hidden"
          }`}
        >
          <ChatPanel
            thread={selectedThread}
            messages={messages}
            isLoading={isMessagesLoading}
            isSending={isSending}
            hasEarlierMessages={hasEarlierMessages}
            isLoadingEarlier={isLoadingEarlier}
            currentUserId={currentUserId}
            composerText={composerText}
            scrollRef={scrollRef}
            onComposerChange={onComposerChange}
            onSendMessage={onSendMessage}
            onLoadEarlier={onLoadEarlier}
            onBack={() => onMobileViewChange("list")}
            showBackButton={mobileView === "chat"}
          />
        </div>

        {/* Requests panel */}
        <div
          className={`w-full flex-shrink-0 flex-col lg:flex lg:w-72 ${
            mobileView === "requests" ? "flex" : "hidden"
          }`}
        >
          <RequestsPanel
            requests={requests}
            isLoading={isRequestsLoading}
            threads={threads}
            currentUserId={currentUserId}
            searchText={searchText}
            onOpenThread={handleOpenThreadFromRequest}
            onUpdateStatus={onUpdateRequestStatus}
          />
        </div>
      </div>
    </div>
  );
}
