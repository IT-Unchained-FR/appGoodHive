"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import BeeHiveSpinner from "@/app/components/spinners/bee-hive-spinner";
import { ArrowLeft, Clock, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ConnectLog {
  id: string;
  company_user_id: string;
  talent_user_id: string;
  job_id: string | null;
  title: string;
  request_message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  company_name: string;
  company_avatar: string | null;
  talent_name: string;
  talent_avatar: string | null;
  other_user_id: string;
}

export default function ConnectLogsPage() {
  const { isAuthenticated, user } = useAuth();
  const currentUserId = useCurrentUserId();
  const router = useRouter();
  
  const [logs, setLogs] = useState<ConnectLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      // If not authenticated, redirect or wait
      return;
    }

    const fetchLogs = async () => {
      try {
        const isTalent = user?.talent_status === "approved";
        const isCompany = user?.recruiter_status === "approved" || user?.recruiter;
        const role = isTalent ? "talent" : (isCompany ? "company" : "both");

        const response = await fetch(`/api/job-requests?userId=${currentUserId}&role=${role}`);
        if (!response.ok) {
          throw new Error("Failed to fetch connect logs");
        }

        const data = await response.json();
        setLogs(data.requests || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Could not load connect logs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [currentUserId, isAuthenticated, user]);

  if (!isAuthenticated && !isLoading) {
    router.push("/auth/login");
    return null;
  }

  const filteredLogs = logs.filter(log => {
    const isTalent = user?.talent_status === "approved";
    const isSentByMe = (isTalent ? log.talent_user_id : log.company_user_id) === currentUserId;
    if (filter === "all") return true;
    if (filter === "sent") return isSentByMe;
    if (filter === "received") return !isSentByMe;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "declined":
      case "withdrawn":
        return <XCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize";
    switch (status) {
      case "accepted":
        return <span className={`${baseClasses} bg-emerald-100 text-emerald-800`}>{status}</span>;
      case "declined":
      case "withdrawn":
        return <span className={`${baseClasses} bg-rose-100 text-rose-800`}>{status}</span>;
      case "sent":
        return <span className={`${baseClasses} bg-amber-100 text-amber-800`}>{status}</span>;
      default:
        return <span className={`${baseClasses} bg-slate-100 text-slate-800`}>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center">
              <MessageSquare className="mr-3 h-8 w-8 text-amber-500" />
              Connect Logs
            </h1>
            <p className="mt-2 text-slate-600">
              View your history of connection requests and messages.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 p-4">
            <div className="flex space-x-4">
              {["all", "sent", "received"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === f
                      ? "bg-amber-100 text-amber-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <BeeHiveSpinner size="large" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-rose-600 bg-rose-50 rounded-xl">
                {error}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No logs found</h3>
                <p className="mt-1 text-slate-500">
                  {filter === "all"
                    ? "You haven't sent or received any connection requests yet."
                    : `You haven't ${filter} any connection requests.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const isTalent = user?.talent_status === "approved";
                  const isSentByMe = (isTalent ? log.talent_user_id : log.company_user_id) === currentUserId;

                  const otherUserName = isTalent ? log.company_name : log.talent_name;
                  const otherUserAvatar = isTalent ? log.company_avatar : log.talent_avatar;

                  return (                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-start gap-4 p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-amber-200 transition-all shadow-sm"
                    >
                      <div className="flex-shrink-0 pt-1">
                        {otherUserAvatar ? (
                          <Image
                            src={otherUserAvatar}
                            alt={otherUserName || "User"}
                            width={48}
                            height={48}
                            className="rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold border-2 border-white shadow-sm">
                            {(otherUserName || "U")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <h4 className="text-base font-semibold text-slate-900 truncate">
                            {log.title}
                          </h4>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {getStatusBadge(log.status)}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-slate-500 mb-2">
                          <span className="font-medium text-slate-700 mr-1">
                            {isSentByMe ? "To: " : "From: "}
                          </span>
                          <span className="truncate mr-4">{otherUserName || "Unknown User"}</span>
                          <span className="flex items-center text-slate-400 text-xs">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>

                        {log.request_message && (
                          <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 mt-2 line-clamp-2">
                            {log.request_message}
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
