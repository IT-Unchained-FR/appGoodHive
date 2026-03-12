"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, XCircle, Coins, ExternalLink } from "lucide-react";
import Cookies from "js-cookie";

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
  talent_name: string | null;
  company_name: string | null;
}

const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  pending_tx: { label: "Pending TX", badgeClass: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", badgeClass: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Failed", badgeClass: "bg-rose-100 text-rose-700" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    void fetch("/api/admin/payouts", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((json) => setPayouts(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const totalVolume = payouts
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const totalFees = payouts
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + Number(p.platform_fee ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Payout History</h1>
        <p className="text-sm text-slate-500 mt-1">All on-chain mission payouts across the platform</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Payouts</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{payouts.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Confirmed Volume</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalVolume.toFixed(2)} USDC/T</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Platform Fees Earned</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-800">{totalFees.toFixed(2)} USDC/T</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Coins className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-slate-500">No payouts yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Job</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Talent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">TX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.map((p) => {
                const meta = STATUS_META[p.status] ?? STATUS_META.pending_tx;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800 font-medium">{p.job_title ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.talent_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.company_name ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.net_amount ?? p.amount} {p.token}</td>
                    <td className="px-4 py-3 text-slate-500">{p.platform_fee ?? 0} {p.token}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      {p.tx_hash ? (
                        <a
                          href={`https://polygonscan.com/tx/${p.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="text-xs font-mono">{p.tx_hash.slice(0, 8)}…</span>
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
