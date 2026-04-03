"use client";

import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  MessageSquare,
  Wallet,
  Bell,
  XCircle,
  UserCheck,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

function getIcon(type: string) {
  switch (type) {
    case "job_approved":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case "job_rejected":
      return <XCircle className="w-4 h-4 text-rose-500" />;
    case "assignment_request":
    case "assignment_accepted":
    case "assignment_rejected":
      return <UserCheck className="w-4 h-4 text-amber-500" />;
    case "application_received":
      return <BriefcaseBusiness className="w-4 h-4 text-blue-500" />;
    case "mission_complete_requested":
    case "mission_completed":
      return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
    case "payout_released":
      return <Wallet className="w-4 h-4 text-emerald-600" />;
    case "new_message":
      return <MessageSquare className="w-4 h-4 text-gray-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-400" />;
  }
}

function getHref(notification: Notification): string | null {
  const d = notification.data ?? {};
  switch (notification.type) {
    case "job_approved":
    case "job_rejected":
      return d.jobId ? `/jobs/${d.jobId}` : null;
    case "assignment_request":
    case "assignment_accepted":
    case "assignment_rejected":
      return "/companies/dashboard/jobs";
    case "application_received":
      return d.jobId ? `/companies/dashboard/jobs?jobId=${d.jobId}` : null;
    case "mission_complete_requested":
    case "mission_completed":
      return "/companies/dashboard/jobs";
    case "payout_released":
      return "/user-profile";
    case "new_message":
      return "/messages";
    default:
      return null;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: NotificationPanelProps) {
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (notification: Notification) => {
    if (!notification.read) onMarkRead(notification.id);
    const href = getHref(notification);
    if (href) {
      router.push(href as any);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-amber-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden"
      style={{ boxShadow: "0 20px 40px -12px rgba(245,158,11,0.25), 0 8px 16px -8px rgba(0,0,0,0.1)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-sm text-gray-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px]">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-50 ${
                !n.read ? "bg-amber-50/60" : "bg-white"
              }`}
            >
              <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug truncate ${!n.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read && (
                <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium w-full text-center transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
