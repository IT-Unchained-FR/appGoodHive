"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, UserCheck, X, CheckCircle2, Clock3, XCircle, Flag } from "lucide-react";
import toast from "react-hot-toast";
import {
  getContract,
  prepareContractCall,
  sendTransaction,
  waitForReceipt,
} from "thirdweb";
import { useActiveAccount } from "thirdweb/react";

import { thirdwebClient } from "@/clients";
import { GoodhiveUsdcTokenPolygon } from "@/app/constants/common";
import { activeChain } from "@/config/chains";

interface TalentResult {
  user_id: string;
  name: string;
  image_url: string | null;
  skills: string | null;
}

interface ExistingAssignment {
  id: string;
  talent_user_id: string;
  talent_name: string | null;
  talent_image: string | null;
  status: string;
  assigned_at: string;
  notes: string | null;
}

interface AssignTalentModalProps {
  jobId: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", className: "text-amber-700 bg-amber-100", icon: <Clock3 className="w-3 h-3" /> },
  active: { label: "Active", className: "text-emerald-700 bg-emerald-100", icon: <CheckCircle2 className="w-3 h-3" /> },
  accepted: { label: "Accepted", className: "text-emerald-700 bg-emerald-100", icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: "Declined", className: "text-rose-700 bg-rose-100", icon: <XCircle className="w-3 h-3" /> },
  completed: { label: "Completed", className: "text-blue-700 bg-blue-100", icon: <CheckCircle2 className="w-3 h-3" /> },
  completion_requested: { label: "Completion Requested", className: "text-purple-700 bg-purple-100", icon: <Flag className="w-3 h-3" /> },
};

export function AssignTalentModal({ jobId, jobTitle, isOpen, onClose }: AssignTalentModalProps) {
  const account = useActiveAccount();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<TalentResult[]>([]);
  const [assignments, setAssignments] = useState<ExistingAssignment[]>([]);
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingStage, setConfirmingStage] = useState<
    "confirming" | "sending" | "finalizing" | null
  >(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState<{
    assignmentId: string;
    txHash: string;
    txUrl: string | null;
  } | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/assignments`);
      if (!res.ok) return;
      const json = await res.json();
      setAssignments(json.data ?? []);
    } catch {
      // silent
    }
  }, [jobId]);

  useEffect(() => {
    if (isOpen) void fetchAssignments();
  }, [isOpen, fetchAssignments]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/talents?search=${encodeURIComponent(search)}&limit=8`);
        if (!res.ok) return;
        const json = await res.json();
        const raw: Array<Record<string, unknown>> = Array.isArray(json) ? json : (json.data ?? json.talents ?? []);
        const list: TalentResult[] = raw.map((t) => ({
          user_id: (t.userId ?? t.user_id ?? "") as string,
          name: [t.firstName ?? t.first_name, t.lastName ?? t.last_name].filter(Boolean).join(" ") || (t.name as string) || "Unnamed Talent",
          image_url: (t.imageUrl ?? t.image_url ?? null) as string | null,
          skills: Array.isArray(t.skills) ? (t.skills as string[]).join(", ") : ((t.skills ?? null) as string | null),
        }));
        setResults(list.slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAssign = async (talent: TalentResult) => {
    setAssigningId(talent.user_id);
    try {
      const res = await fetch(`/api/jobs/${jobId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talentUserId: talent.user_id, notes }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to assign talent");
      }
      toast.success(`${talent.name} has been assigned!`);
      setSearch("");
      setNotes("");
      setResults([]);
      void fetchAssignments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign talent");
    } finally {
      setAssigningId(null);
    }
  };

  const handleConfirmCompletion = async (assignment: ExistingAssignment) => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payout amount (USDC)");
      return;
    }
    if (!account) {
      toast.error("Connect your wallet before sending the payout");
      return;
    }
    if (!window.confirm(`Confirm completion for ${assignment.talent_name ?? "talent"} and initiate payout of ${amount} USDC?`)) return;
    setPaymentSuccess(null);
    setConfirmingId(assignment.id);
    setConfirmingStage("confirming");
    try {
      const res = await fetch(`/api/assignments/${assignment.id}/confirm-completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, token: "USDC" }),
      });
      const json = (await res.json()) as {
        error?: string;
        success?: boolean;
        data?: {
          netAmount?: number;
          payoutId?: string;
          talentWalletAddress?: string | null;
          token?: string;
        };
      };
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed");

      const payoutId = json.data?.payoutId;
      const talentWalletAddress = json.data?.talentWalletAddress?.trim();
      const netAmount = json.data?.netAmount;
      const token = json.data?.token;

      if (!payoutId || typeof netAmount !== "number" || !talentWalletAddress) {
        throw new Error("Payout details were incomplete. Please contact support.");
      }

      if (token !== "USDC") {
        throw new Error(`Unsupported payout token: ${token ?? "unknown"}`);
      }

      setConfirmingStage("sending");

      const usdcContract = getContract({
        client: thirdwebClient,
        chain: activeChain,
        address: GoodhiveUsdcTokenPolygon,
      });
      const amountInUnits = BigInt(Math.round(netAmount * 1_000_000));
      const transaction = prepareContractCall({
        contract: usdcContract,
        method: "function transfer(address to, uint256 amount) returns (bool)",
        params: [talentWalletAddress, amountInUnits],
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      await waitForReceipt({
        client: thirdwebClient,
        chain: activeChain,
        transactionHash: result.transactionHash,
      });

      setConfirmingStage("finalizing");

      const confirmTxResponse = await fetch(`/api/payouts/${payoutId}/confirm-tx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: result.transactionHash }),
      });
      const confirmTxJson = (await confirmTxResponse.json()) as {
        error?: string;
        success?: boolean;
      };

      if (!confirmTxResponse.ok || !confirmTxJson.success) {
        throw new Error(confirmTxJson.error ?? "Failed to confirm payout transaction");
      }

      const explorerBaseUrl = activeChain.blockExplorers?.[0]?.url?.replace(/\/+$/, "") ?? null;
      const txUrl = explorerBaseUrl ? `${explorerBaseUrl}/tx/${result.transactionHash}` : null;

      setPaymentSuccess({
        assignmentId: assignment.id,
        txHash: result.transactionHash,
        txUrl,
      });
      toast.success(`Payment sent! ${netAmount} USDC transferred successfully.`);
      setPayoutAmount("");
      setAssignments((currentAssignments) =>
        currentAssignments.map((currentAssignment) =>
          currentAssignment.id === assignment.id
            ? { ...currentAssignment, status: "completed" }
            : currentAssignment,
        ),
      );
      void fetchAssignments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm completion");
    } finally {
      setConfirmingStage(null);
      setConfirmingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
          <div>
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest">Assign Talent</p>
            <h2 className="text-lg font-semibold text-slate-900 truncate max-w-[340px]">{jobTitle}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {paymentSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p className="font-semibold">Payment sent!</p>
              <p className="mt-1 break-all">Tx: {paymentSuccess.txHash}</p>
              {paymentSuccess.txUrl && (
                <a
                  href={paymentSuccess.txUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-xs font-semibold text-emerald-700 underline"
                >
                  View on Polygonscan
                </a>
              )}
            </div>
          )}

          {/* Search */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Search Talents</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or skill..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Optional note */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Message to Talent <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this assignment..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm resize-none focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* Search results */}
          {results.length > 0 && (
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {results.map((talent) => (
                <div key={talent.user_id} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0 overflow-hidden">
                    {talent.image_url
                      ? <img src={talent.image_url} alt={talent.name} className="w-full h-full object-cover" />
                      : talent.name?.[0]?.toUpperCase() ?? "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{talent.name}</p>
                    {talent.skills && (
                      <p className="text-xs text-slate-500 truncate">{talent.skills}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAssign(talent)}
                    disabled={assigningId === talent.user_id}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:bg-amber-300"
                  >
                    <UserCheck className="w-3 h-3" />
                    {assigningId === talent.user_id ? "Sending..." : "Assign"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {isSearching && (
            <p className="text-sm text-slate-400 text-center py-2">Searching...</p>
          )}

          {/* Existing assignments */}
          {assignments.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Existing Assignments</p>
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {assignments.map((a) => {
                  const meta = STATUS_META[a.status] ?? STATUS_META.pending;
                  return (
                    <div key={a.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-xs flex-shrink-0">
                          {a.talent_name?.[0]?.toUpperCase() ?? "T"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{a.talent_name ?? "Talent"}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </div>
                      {a.status === "completion_requested" && (
                        <div className="pl-10">
                          <p className="text-xs text-slate-500">Completion confirmation coming soon.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
