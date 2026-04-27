"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import BeeHiveSpinner from "@/app/components/spinners/bee-hive-spinner";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Mail,
  MessageSquare,
  Send,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ContactLog {
  id: string;
  company_user_id: string;
  talent_user_id: string;
  job_id: string | null;
  thread_id: string | null;
  job_request_id: string | null;
  actor_user_id: string;
  actor_type: "company" | "talent";
  contact_type: "direct" | "job_request";
  message_preview: string | null;
  created_at: string;
  viewer_type: "company" | "talent";
  direction: "sent" | "received";
  other_user_id: string;
  other_user_type: "company" | "talent";
  other_user_name: string | null;
  other_user_avatar: string | null;
  other_user_headline: string | null;
  job_title: string | null;
}

interface ContactLogsResponse {
  success: boolean;
  logs?: ContactLog[];
  error?: string;
}

function getTypeBadge(log: ContactLog) {
  const isDirect = log.contact_type === "direct";
  const label = isDirect ? "Direct contact" : "Job request";
  const Icon = isDirect ? Mail : Briefcase;
  const classes = isDirect
    ? "bg-amber-100 text-amber-800"
    : "bg-blue-100 text-blue-800";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function getViewerBadge(type: "company" | "talent") {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
      <UserRound className="h-3.5 w-3.5" />
      As {type}
    </span>
  );
}

export default function ConnectLogsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/contact-logs", { cache: "no-store" });
        const data = (await response.json()) as ContactLogsResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Failed to fetch contact logs");
        }

        setLogs(data.logs ?? []);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Could not load contact logs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLogs();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.direction === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="group mb-4 flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </button>
            <h1 className="flex items-center text-3xl font-bold text-slate-900">
              <MessageSquare className="mr-3 h-8 w-8 text-amber-500" />
              Contact Logs
            </h1>
            <p className="mt-2 text-slate-600">
              View direct contacts and job requests from your company or talent profile.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex flex-wrap gap-3">
              {(["all", "sent", "received"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    filter === item
                      ? "bg-amber-100 text-amber-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <BeeHiveSpinner size="large" />
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 py-12 text-center text-rose-600">
                {error}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-16 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900">No logs found</h3>
                <p className="mt-1 text-slate-500">
                  {filter === "all"
                    ? "You do not have any contact activity yet."
                    : `You do not have any ${filter} contact activity.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const profilePath =
                    log.other_user_type === "talent"
                      ? `/talents/${log.other_user_id}`
                      : `/companies/${log.other_user_id}`;

                  return (
                    <div
                      key={log.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-5 shadow-sm transition-all hover:border-amber-200 hover:bg-white sm:flex-row sm:items-start"
                    >
                      <div className="shrink-0 pt-1">
                        {log.other_user_avatar ? (
                          <Image
                            src={log.other_user_avatar}
                            alt={log.other_user_name || "User"}
                            width={48}
                            height={48}
                            className="rounded-full border-2 border-white object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-amber-100 font-bold text-amber-700 shadow-sm">
                            {(log.other_user_name || "U")[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <Link
                              href={profilePath}
                              className="block truncate text-base font-semibold text-slate-900 transition hover:text-amber-700"
                            >
                              {log.other_user_name || "Unknown user"}
                            </Link>
                            <p className="truncate text-sm text-slate-500">
                              {log.other_user_headline || log.job_title || "GoodHive member"}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {getTypeBadge(log)}
                            {getViewerBadge(log.viewer_type)}
                          </div>
                        </div>

                        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1 font-medium capitalize text-slate-700">
                            <Send className="h-3.5 w-3.5" />
                            {log.direction}
                          </span>
                          <span className="inline-flex items-center text-xs text-slate-400">
                            <Clock className="mr-1 h-3.5 w-3.5" />
                            {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          {log.job_title && (
                            <span className="truncate text-xs text-slate-500">
                              Job: {log.job_title}
                            </span>
                          )}
                        </div>

                        {log.message_preview && (
                          <p className="mt-3 line-clamp-2 rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">
                            {log.message_preview}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
