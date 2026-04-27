"use client";

export const dynamic = "force-dynamic";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { AdminDataGrid } from "@/app/components/admin/AdminDataGrid";
import { Column } from "@/app/components/admin/EnhancedTable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, Copy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ReferredTalentsModal } from "./components/ReferredTalentsModal";

export default function AdminReferralsPage() {
  const [referrers, setReferrers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState<any>({ items: [], quickFilterValues: [] });
  const [selectedReferralCode, setSelectedReferralCode] = useState<string | null>(null);
  const [selectedReferrerName, setSelectedReferrerName] = useState<string | null>(null);

  const fetchReferrers = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL("/api/admin/referrals", window.location.origin);
      const search = filterModel.quickFilterValues?.join(" ");
      if (search) {
        url.searchParams.set("search", search);
      }
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setReferrers(data.data || []);
      } else {
        toast.error(data.error || "Failed to fetch referrals");
      }
    } catch (err) {
      toast.error("An error occurred fetching referrals");
    } finally {
      setLoading(false);
    }
  }, [filterModel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReferrers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchReferrers]);

  const columns: Column<any>[] = useMemo(() => [
    {
      key: "referrer",
      header: "Referrer",
      sortable: false,
      render: (_value, row) => {
        const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim();
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-slate-100 ring-offset-2">
                {row.image_url ? (
                  <Image
                    src={row.image_url}
                    alt={fullName}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-slate-100 text-slate-500 font-medium">
                    {row.first_name?.[0] || row.email?.[0] || "?"}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex flex-col min-w-0">
              {row.user_id ? (
                <Link
                  href={`/admin/talent/${row.user_id}`}
                  target="_blank"
                  className="truncate text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  {fullName || "Unnamed User"}
                </Link>
              ) : (
                <span className="truncate text-sm font-semibold text-slate-900">
                  {fullName || "Unnamed User"}
                </span>
              )}
              <span className="truncate text-[11px] text-slate-400 font-medium leading-tight">
                {row.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "user_id",
      header: "User ID",
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center gap-1.5 group">
          <span 
            className="font-mono text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded transition-colors group-hover:bg-slate-100" 
            title={row.user_id}
          >
            {row.user_id ? `${row.user_id.slice(0, 8)}...` : "N/A"}
          </span>
          {row.user_id && (
            <button
              title="Copy User ID"
              onClick={() => {
                navigator.clipboard.writeText(row.user_id);
                toast.success("User ID copied");
              }}
              className="text-slate-300 hover:text-slate-600 transition-colors"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "referral_code",
      header: "Referral Code",
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center gap-1.5 group">
          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded shadow-sm transition-all group-hover:bg-indigo-100 group-hover:border-indigo-200">
            {row.referral_code}
          </span>
          <button
            title="Copy Code"
            onClick={() => {
              navigator.clipboard.writeText(row.referral_code);
              toast.success("Referral code copied");
            }}
            className="text-slate-300 hover:text-indigo-500 transition-colors"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ),
    },
    {
      key: "referral_count",
      header: "Total Referrals",
      sortable: false,
      render: (value) => (
        <div className="flex items-center">
          <span className="inline-flex items-center justify-center min-w-[2.25rem] h-7 px-2.5 rounded-full bg-blue-600 text-white font-bold text-xs shadow-sm shadow-blue-100">
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (_value, row) => {
        const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email;
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all gap-1.5"
            onClick={() => {
              setSelectedReferralCode(row.referral_code);
              setSelectedReferrerName(fullName);
            }}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">View Referrals</span>
          </Button>
        );
      },
    },
  ], []);

  return (
    <AdminPageLayout
      title="Referrals"
      subtitle="Track user referrals and see who they have invited"
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 mt-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Top Referrers
              </h2>
              <p className="text-sm text-gray-600">
                {referrers.length} referrers found.
              </p>
            </div>
          </div>
          
          <AdminDataGrid
            rows={referrers}
            columns={columns}
            getRowId={(row) => row.referral_code || row.user_id}
            loading={loading}
            emptyMessage="No referrers found"
            searchPlaceholder="Search by name, email, or referral code..."
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
            currentPage={1}
            pageSize={referrers.length > 0 ? referrers.length : 10}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            totalItems={referrers.length}
            paginationMode="client"
          />
        </div>
      </div>

      <ReferredTalentsModal
        open={!!selectedReferralCode}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReferralCode(null);
            setSelectedReferrerName(null);
          }
        }}
        referralCode={selectedReferralCode}
        referrerName={selectedReferrerName}
      />
    </AdminPageLayout>
  );
}
