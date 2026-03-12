"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, XCircle, Coins, ExternalLink } from "lucide-react";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";

interface Payout {
  id: string;
  assignment_id: string;
  job_id: string;
  amount: number;
  token: string;
  chain: string;
  tx_hash: string | null;
  status: string;
  platform_fee: number | null;
  net_amount: number | null;
  created_at: string;
  confirmed_at: string | null;
  job_title: string | null;
  company_name: string | null;
}

const STATUS_META: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  pending_tx: {
    label: "Pending",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    icon: <Clock3 className="w-3.5 h-3.5" />,
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  failed: {
    label: "Failed",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

export default function MyPayoutsPage() {
  const userId = useCurrentUserId();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    void fetch("/api/payouts", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setPayouts(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-500">Please log in to view your payouts.</p>
      </div>
    );
  }

  const totalConfirmed = payouts
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + Number(p.net_amount ?? 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-[#fff6d9] via-white to-[#fff0c0] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Talent Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">My Payouts</h1>
        <p className="mt-2 text-sm text-slate-600">
          On-chain USDC/USDT payouts for completed missions on Polygon.
        </p>
        {totalConfirmed > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            <Coins className="w-4 h-4" />
            Total earned: {totalConfirmed.toFixed(2)} USDC/USDT
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Coins className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">No payouts yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Completed missions will appear here with on-chain payment details.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => {
            const meta = STATUS_META[p.status] ?? STATUS_META.pending_tx;
            return (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{p.job_title ?? "Untitled Job"}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{p.company_name ?? "Company"}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(p.created_at)}</p>
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Amount: </span>
                    <span className="font-semibold text-slate-800">{p.net_amount ?? p.amount} {p.token}</span>
                  </div>
                  {p.platform_fee != null && (
                    <div>
                      <span className="text-slate-400">Platform fee: </span>
                      <span className="text-slate-600">{p.platform_fee} {p.token}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Chain: </span>
                    <span className="text-slate-600 capitalize">{p.chain}</span>
                  </div>
                </div>

                {p.tx_hash && (
                  <a
                    href={`https://polygonscan.com/tx/${p.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on Polygonscan
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
