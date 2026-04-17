import type {
  JobRequest,
  JobRequestStatus,
  MessengerThreadListItem,
} from "@/interfaces/messenger";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { requestCounterByStatus } from "../../_utils/messenger-helpers";
import { RequestCard } from "./RequestCard";
import { RequestFilterBar } from "./RequestFilterBar";
import { RequestsPanelEmpty } from "./RequestsPanelEmpty";

interface RequestsPanelProps {
  requests: JobRequest[];
  isLoading: boolean;
  threads: MessengerThreadListItem[];
  currentUserId: string;
  searchText: string;
  onOpenThread: (thread: MessengerThreadListItem) => void;
  onUpdateStatus: (requestId: string, status: JobRequestStatus) => Promise<void>;
}

export function RequestsPanel({
  requests,
  isLoading,
  threads,
  currentUserId,
  searchText,
  onOpenThread,
  onUpdateStatus,
}: RequestsPanelProps) {
  const [filter, setFilter] = useState<"all" | JobRequestStatus>("all");

  const threadByRequestId = useMemo(() => {
    const map = new Map<string, MessengerThreadListItem>();
    for (const t of threads) {
      if (t.job_request_id) map.set(t.job_request_id, t);
    }
    return map;
  }, [threads]);

  const counts = useMemo(() => requestCounterByStatus(requests), [requests]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return requests.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.company_name ?? "").toLowerCase().includes(q) ||
        (r.talent_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [requests, filter, searchText]);

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Requests</h2>
      </div>

      <RequestFilterBar current={filter} counts={counts} onChange={setFilter} />

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <RequestsPanelEmpty />
        ) : (
          filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              linkedThread={threadByRequestId.get(req.id)}
              currentUserId={currentUserId}
              onOpenThread={onOpenThread}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}
