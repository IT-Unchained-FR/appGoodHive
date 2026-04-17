import type {
  JobRequest,
  JobRequestStatus,
  MessengerMessage,
  MessengerThreadListItem,
} from "@/interfaces/messenger";

export type UiMessengerMessage = MessengerMessage & { pending?: boolean };

// ─── Display helpers ────────────────────────────────────────────────────────

export function displayNameFromThread(thread: MessengerThreadListItem): string {
  if (thread.other_user_name?.trim()) return thread.other_user_name;
  return `User ${thread.other_user_id.slice(0, 8)}`;
}

export function initialsFromName(name: string): string {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 0) return "GH";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function formatRelativeTime(value?: string | null): string {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffMs = timestamp - Date.now();
  const absMs = Math.abs(diffMs);

  if (absMs < 60_000) return "now";

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");

  const hours = Math.round(diffMs / 3_600_000);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");

  const days = Math.round(diffMs / 86_400_000);
  return rtf.format(days, "day");
}

export function formatDateSeparator(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

export function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ─── File attachment helpers ─────────────────────────────────────────────────

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"]);

export function isImageAttachment(url: string): boolean {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0] ?? "";
  return IMAGE_EXTS.has(ext);
}

export function filenameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url.split("?")[0]);
    return decoded.split("/").pop() ?? "file";
  } catch {
    return "file";
  }
}

// ─── Request helpers ─────────────────────────────────────────────────────────

export const REQUEST_STATUS_LABELS: Record<JobRequestStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

export const REQUEST_STATUS_STYLES: Record<JobRequestStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-amber-100 text-amber-800 border-amber-200",
  viewed: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  declined: "bg-rose-100 text-rose-800 border-rose-200",
  withdrawn: "bg-orange-100 text-orange-800 border-orange-200",
  archived: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export const REQUEST_FILTER_OPTIONS: Array<{
  key: "all" | JobRequestStatus;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
  { key: "withdrawn", label: "Withdrawn" },
];

export function requestCounterByStatus(
  requests: JobRequest[],
): Record<JobRequestStatus, number> {
  return requests.reduce(
    (acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    },
    {} as Record<JobRequestStatus, number>,
  );
}

// ─── Message merge (optimistic + server) ────────────────────────────────────

export function mergeServerAndPendingMessages(
  serverMessages: MessengerMessage[],
  previousMessages: UiMessengerMessage[],
): UiMessengerMessage[] {
  const pendingMessages = previousMessages.filter((m) => m.pending);
  if (pendingMessages.length === 0) return serverMessages;

  const consumedIds = new Set<string>();
  const unresolvedPending: UiMessengerMessage[] = [];

  for (const pending of pendingMessages) {
    const pendingTime = new Date(pending.created_at).getTime();
    const match = serverMessages.find((s) => {
      if (consumedIds.has(s.id)) return false;
      if (s.sender_user_id !== pending.sender_user_id) return false;
      if (s.message_text !== pending.message_text) return false;
      const sTime = new Date(s.created_at).getTime();
      return !Number.isNaN(sTime) && sTime >= pendingTime - 10_000;
    });

    if (match) {
      consumedIds.add(match.id);
    } else {
      unresolvedPending.push(pending);
    }
  }

  return [...serverMessages, ...unresolvedPending].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}
