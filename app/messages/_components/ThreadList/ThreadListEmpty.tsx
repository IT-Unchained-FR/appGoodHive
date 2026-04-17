import { MessageSquare } from "lucide-react";

interface ThreadListEmptyProps {
  isSearching: boolean;
}

export function ThreadListEmpty({ isSearching }: ThreadListEmptyProps) {
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
        <MessageSquare className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">No results found</p>
        <p className="text-xs text-slate-400">Try a different name or message</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
        <MessageSquare className="h-6 w-6 text-amber-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">No conversations yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Browse talents and send a request to start messaging
        </p>
      </div>
    </div>
  );
}
