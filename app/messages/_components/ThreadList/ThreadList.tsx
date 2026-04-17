import type { MessengerThreadListItem } from "@/interfaces/messenger";
import { Search } from "lucide-react";
import { ThreadListEmpty } from "./ThreadListEmpty";
import { ThreadListItem } from "./ThreadListItem";
import { ThreadListSkeleton } from "./ThreadListSkeleton";

interface ThreadListProps {
  threads: MessengerThreadListItem[];
  selectedThreadId: string | null;
  isLoading: boolean;
  searchText: string;
  currentUserId: string;
  onSearchChange: (text: string) => void;
  onSelectThread: (thread: MessengerThreadListItem) => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  isLoading,
  searchText,
  currentUserId,
  onSearchChange,
  onSelectThread,
}: ThreadListProps) {
  const filtered = threads.filter((t) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    const name = (t.other_user_name ?? "").toLowerCase();
    const preview = (t.last_message_text ?? "").toLowerCase();
    return name.includes(q) || preview.includes(q);
  });

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Messages</h2>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 py-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ThreadListSkeleton />
        ) : filtered.length === 0 ? (
          <ThreadListEmpty isSearching={searchText.trim().length > 0} />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((thread) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                isSelected={thread.id === selectedThreadId}
                currentUserId={currentUserId}
                onClick={() => onSelectThread(thread)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
