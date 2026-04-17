import type { JobRequest, JobRequestStatus, MessengerThreadListItem } from "@/interfaces/messenger";
import { Check, MessageSquare, X } from "lucide-react";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_STYLES,
  formatRelativeTime,
} from "../../_utils/messenger-helpers";
import { UserAvatar } from "../shared/UserAvatar";

interface RequestCardProps {
  request: JobRequest;
  linkedThread: MessengerThreadListItem | undefined;
  currentUserId: string;
  onOpenThread: (thread: MessengerThreadListItem) => void;
  onUpdateStatus: (requestId: string, status: JobRequestStatus) => Promise<void>;
}

export function RequestCard({
  request,
  linkedThread,
  currentUserId,
  onOpenThread,
  onUpdateStatus,
}: RequestCardProps) {
  const isSender = request.company_user_id === currentUserId;
  const otherName = isSender
    ? (request.talent_name ?? "Talent")
    : (request.company_name ?? "Company");
  const otherAvatar = isSender ? request.talent_avatar : request.company_avatar;

  const canAccept =
    !isSender && (request.status === "sent" || request.status === "viewed");
  const canDecline = canAccept;
  const canWithdraw =
    isSender && (request.status === "sent" || request.status === "viewed");
  const canArchive =
    request.status === "accepted" ||
    request.status === "declined" ||
    request.status === "withdrawn";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <UserAvatar src={otherAvatar} name={otherName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{otherName}</p>
          <p className="truncate text-xs text-slate-500 mt-0.5">{request.title}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              REQUEST_STATUS_STYLES[request.status]
            }`}
          >
            {REQUEST_STATUS_LABELS[request.status]}
          </span>
          <span className="text-[10px] text-slate-400">
            {formatRelativeTime(request.created_at)}
          </span>
        </div>
      </div>

      {/* Message preview */}
      {request.request_message && (
        <p className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600 line-clamp-2">
          {request.request_message}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {linkedThread && (
          <button
            type="button"
            onClick={() => onOpenThread(linkedThread)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:border-amber-300 hover:text-amber-700 transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            Open chat
          </button>
        )}

        {canAccept && (
          <button
            type="button"
            onClick={() => void onUpdateStatus(request.id, "accepted")}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Check className="h-3 w-3" />
            Accept
          </button>
        )}

        {canDecline && (
          <button
            type="button"
            onClick={() => void onUpdateStatus(request.id, "declined")}
            className="flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <X className="h-3 w-3" />
            Decline
          </button>
        )}

        {canWithdraw && (
          <button
            type="button"
            onClick={() => void onUpdateStatus(request.id, "withdrawn")}
            className="flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-1.5 text-xs text-orange-700 hover:bg-orange-100 transition-colors"
          >
            Withdraw
          </button>
        )}

        {canArchive && (
          <button
            type="button"
            onClick={() => void onUpdateStatus(request.id, "archived")}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-1"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
