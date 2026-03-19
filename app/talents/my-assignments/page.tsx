"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, XCircle, BriefcaseBusiness, UserCheck, Flag } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";

interface Assignment {
  id: string;
  status: string;
  notes: string | null;
  assigned_at: string;
  responded_at: string | null;
  job_id: string;
  job_title: string | null;
  company_user_id: string;
  company_name: string | null;
  company_logo: string | null;
  budget: number | null;
  currency: string | null;
}

const STATUS_META: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Response", badgeClass: "bg-amber-100 text-amber-700 border border-amber-200", icon: <Clock3 className="w-3.5 h-3.5" /> },
  active: { label: "Active Mission", badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  accepted: { label: "Active Mission", badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Declined", badgeClass: "bg-slate-100 text-slate-500 border border-slate-200", icon: <XCircle className="w-3.5 h-3.5" /> },
  completed: { label: "Completed", badgeClass: "bg-blue-100 text-blue-700 border border-blue-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  completion_requested: { label: "Awaiting Confirmation", badgeClass: "bg-purple-100 text-purple-700 border border-purple-200", icon: <Clock3 className="w-3.5 h-3.5" /> },
};

export default function MyAssignmentsPage() {
  const userId = useCurrentUserId();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [requestingCompletionId, setRequestingCompletionId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/talents/my-assignments", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setAssignments(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCompletion = async (assignmentId: string) => {
    if (!window.confirm("Request mission completion? The company will be notified to confirm and release your payout.")) return;
    setRequestingCompletionId(assignmentId);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/request-completion`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed");
      toast.success("Completion request sent! Awaiting company confirmation.");
      setAssignments((prev) =>
        prev.map((a) => a.id === assignmentId ? { ...a, status: "completion_requested" } : a),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request completion");
    } finally {
      setRequestingCompletionId(null);
    }
  };

  const handleRespond = async (assignmentId: string, action: "accept" | "reject") => {
    setRespondingId(assignmentId);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed");

      toast.success(action === "accept" ? "Assignment accepted!" : "Assignment declined");
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, status: action === "accept" ? "active" : "rejected" }
            : a,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to respond");
    } finally {
      setRespondingId(null);
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-500">Please log in to view your assignments.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-[#fff6d9] via-white to-[#fff0c0] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Talent Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">My Assignments</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review and respond to job assignments from companies.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <UserCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">No assignments yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            When a company assigns you to a job, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const meta = STATUS_META[a.status] ?? STATUS_META.pending;
            return (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold flex-shrink-0">
                      {a.company_name?.[0]?.toUpperCase() ?? "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => router.push(`/jobs/${a.job_id}`)}
                        className="text-base font-semibold text-slate-900 hover:text-amber-700 transition truncate block text-left"
                      >
                        {a.job_title ?? "Untitled Job"}
                      </button>
                      <p className="text-sm text-slate-500 mt-0.5">{a.company_name ?? "Company"}</p>
                      {a.budget && (
                        <p className="text-xs text-slate-400 mt-1">
                          <BriefcaseBusiness className="inline w-3 h-3 mr-1" />
                          Budget: {a.budget} {a.currency ?? ""}
                        </p>
                      )}
                      {a.notes && (
                        <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 italic">
                          &ldquo;{a.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                </div>

                {a.status === "pending" && (
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => void handleRespond(a.id, "accept")}
                      disabled={respondingId === a.id}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:bg-amber-300"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {respondingId === a.id ? "..." : "Accept"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRespond(a.id, "reject")}
                      disabled={respondingId === a.id}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-400 hover:text-rose-600"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/jobs/${a.job_id}`)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-400"
                    >
                      View Job
                    </button>
                  </div>
                )}

                {(a.status === "active" || a.status === "accepted") && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/messages")}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                      Message Company
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/jobs/${a.job_id}`)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900"
                    >
                      View Job
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
