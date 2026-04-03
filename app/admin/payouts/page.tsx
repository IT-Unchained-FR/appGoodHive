"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, ExternalLink } from "lucide-react";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";

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
  pending_tx: { label: "Pending TX", badgeClass: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmed", badgeClass: "bg-green-50 text-green-700" },
  failed: { label: "Failed", badgeClass: "bg-red-50 text-red-700" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/payouts", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/admin/login");
          return null;
        }

        return response.json();
      })
      .then((json) => setPayouts(json?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const totalVolume = payouts
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const totalFees = payouts
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + Number(p.platform_fee ?? 0), 0);

  const columns: Column<Payout>[] = [
    {
      key: "job_title",
      header: "Job",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value || "—"}</span>
      ),
    },
    {
      key: "talent_name",
      header: "Talent",
      sortable: true,
      render: (value) => value || "—",
    },
    {
      key: "company_name",
      header: "Company",
      sortable: true,
      render: (value) => value || "—",
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (_value, row) => (
        <span className="font-semibold text-gray-900">
          {row.net_amount ?? row.amount} {row.token}
        </span>
      ),
    },
    {
      key: "platform_fee",
      header: "Fee",
      sortable: true,
      render: (value, row) => `${value ?? 0} ${row.token}`,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value) => {
        const meta = STATUS_META[String(value)] ?? STATUS_META.pending_tx;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}
          >
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      render: (value) => formatDate(String(value)),
    },
    {
      key: "tx_hash",
      header: "TX",
      render: (value) =>
        value ? (
          <a
            href={`https://polygonscan.com/tx/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="text-xs font-mono">{String(value).slice(0, 8)}…</span>
          </a>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
  ];

  return (
    <AdminPageLayout
      title="Payouts"
      subtitle="On-chain USDC mission payout history"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-gray-500">Total Payouts</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{payouts.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-gray-500">Confirmed Volume</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {totalVolume.toFixed(2)} USDC/T
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-gray-500">Platform Fees Earned</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {totalFees.toFixed(2)} USDC/T
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFC905] border-t-transparent" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Coins className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-slate-500">No payouts yet</p>
        </div>
      ) : (
        <EnhancedTable
          data={payouts}
          columns={columns}
          searchable
          searchPlaceholder="Search by talent, company, job, or status..."
          pagination
          itemsPerPage={10}
          loading={loading}
          emptyMessage="No payouts found"
          mobileCardView
          renderMobileCard={(payout) => {
            const meta = STATUS_META[payout.status] ?? STATUS_META.pending_tx;
            return (
              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {payout.job_title ?? "—"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {payout.talent_name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payout.company_name ?? "—"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Amount:</span> {payout.net_amount ?? payout.amount} {payout.token}
                  </p>
                  <p>
                    <span className="font-medium">Fee:</span> {payout.platform_fee ?? 0} {payout.token}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {formatDate(payout.created_at)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">{payout.chain}</span>
                  {payout.tx_hash ? (
                    <a
                      href={`https://polygonscan.com/tx/${payout.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="text-xs font-mono">{payout.tx_hash.slice(0, 8)}…</span>
                    </a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </div>
              </div>
            );
          }}
        />
      )}
    </AdminPageLayout>
  );
}
