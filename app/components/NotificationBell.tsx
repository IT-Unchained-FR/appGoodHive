"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell } from "lucide-react";
import { NotificationPanel } from "./NotificationPanel";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string | null;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setUnreadCount(json.data?.count ?? 0);
    } catch {
      // silent
    }
  }, [userId]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data ?? []);
    } catch {
      // silent
    }
  }, [userId]);

  // Poll unread count every 15 seconds
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    void fetchUnreadCount();
    const id = window.setInterval(() => void fetchUnreadCount(), 15000);
    return () => window.clearInterval(id);
  }, [userId, fetchUnreadCount]);

  // Fetch full list when panel opens
  useEffect(() => {
    if (isOpen) void fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  if (!userId) return null;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:text-amber-700 hover:bg-amber-100 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-[17px] items-center justify-center rounded-full bg-rose-600 px-1 py-0.5 text-[9px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
