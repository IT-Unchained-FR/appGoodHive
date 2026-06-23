"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import toast from "react-hot-toast";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import {
  ArrowUpRight,
  CheckSquare,
  Clock3,
  Filter,
  MoreHorizontal,
  Sparkles,
  Square,
  Users,
  UserRoundCheck,
  UserRoundPlus,
} from "lucide-react";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { AdminDataGrid } from "@/app/components/admin/AdminDataGrid";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { BulkApproval } from "@/app/components/admin/BulkApproval";
import ApprovalPopup from "./components/ApprovalPopup";
import { deriveReviewStatus, type ReviewStatus } from "@/lib/talent-status";
import type { ProfileData } from "@/app/talents/my-profile/types";
import { Column } from "@/app/components/admin/EnhancedTable";
import { StatusPill } from "@/app/components/admin/StatusPill";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

type ProfileDataWithName = ProfileData & {
  name?: string;
  referrer_name?: string | null;
  referrer_user_id?: string | null;
  referrer_email?: string | null;
  talent_deferred_until?: string | null;
  mentor_deferred_until?: string | null;
  recruiter_deferred_until?: string | null;
  user_created_at?: string | null;
};

const shellCardClass =
  "overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur";

const getFullName = (user: ProfileDataWithName) =>
  `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unnamed talent";

const getInitials = (user: ProfileDataWithName) => {
  const first = user.first_name?.[0] ?? "G";
  const last = user.last_name?.[0] ?? "H";
  return `${first}${last}`.toUpperCase();
};

const getCreatedAt = (user: ProfileDataWithName) =>
  user.user_created_at || (user as ProfileDataWithName & { created_at?: string }).created_at;

const getStatusTone = (status: ReviewStatus) => {
  if (status === "approved") return "approved";
  if (status === "deferred") return "deferred";
  if (status === "rejected") return "rejected";
  return "in_review";
};

function SummaryMetric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-amber-700 transition hover:text-amber-900"
          aria-label={`Remove ${label} filter`}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export default function AdminTalentApproval() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<ProfileDataWithName[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileDataWithName | null>(null);
  const [selectedItems, setSelectedItems] = useState<ProfileDataWithName[]>([]);
  const [showBulkApproval, setShowBulkApproval] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getTalentStatus = useCallback((user: ProfileDataWithName) => {
    return deriveReviewStatus({
      status: user.talent_status,
      inReview: user.inreview,
      approved: user.approved,
      deferredUntil: user.talent_deferred_until,
    });
  }, []);

  const handleApproveClick = (user: ProfileDataWithName) => {
    setSelectedUser(user);
    setShowApprovePopup(true);
  };

  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());

      if (!params.has("status")) {
        params.set("status", "all");
      }

      const url = `/api/admin/talents/pending${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        console.error("Failed to fetch pending users:", data);
        setUsers([]);
        return;
      }

      const usersWithName = data.map((user: ProfileDataWithName) => ({
        ...user,
        name: getFullName(user),
      }));
      setUsers(usersWithName);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  useEffect(() => {
    setSelectedItems((prev) =>
      prev.filter((item) => users.some((u) => u.user_id === item.user_id)),
    );
  }, [users]);

  const handleStatusUpdate = async (
    user: ProfileDataWithName,
    status: "approved" | "in_review" | "rejected" | "deferred",
  ) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/talents/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          status,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || "Failed to update talent status");
      }

      toast.success("Talent status updated");
      fetchPendingUsers();
    } catch (error) {
      console.error("Error updating talent status:", error);
      toast.error("Failed to update talent status");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === users.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...users]);
    }
  };

  const handleBulkApprove = async (
    itemIds: string[],
    approvalTypes?: Record<string, boolean>,
  ) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/talents/bulk-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: itemIds,
          approvalTypes: approvalTypes || { talent: true },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve talents");
      }

      toast.success(`Successfully approved ${itemIds.length} talent(s)`);
      setSelectedItems([]);
      fetchPendingUsers();
    } catch (error) {
      console.error("Error approving talents:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async (itemIds: string[], reason?: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/talents/bulk-reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: itemIds,
          rejectionReason:
            reason || "Rejected by admin review due to profile requirements.",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject talents");
      }

      toast.success(`Successfully rejected ${itemIds.length} talent(s)`);
      setSelectedItems([]);
      fetchPendingUsers();
    } catch (error) {
      console.error("Error rejecting talents:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const totalRequests = users.length;
    const inReviewCount = users.filter(
      (user) => getTalentStatus(user) === "in_review",
    ).length;
    const referredCount = users.filter((user) => Boolean(user.referred_by)).length;
    const directCount = totalRequests - referredCount;
    const talentCount = users.filter((user) => Boolean(user.talent)).length;
    const mentorCount = users.filter((user) => Boolean(user.mentor)).length;
    const recruiterCount = users.filter((user) => Boolean(user.recruiter)).length;

    const newestDate = users
      .map((user) => getCreatedAt(user))
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

    return {
      totalRequests,
      inReviewCount,
      directCount,
      referredCount,
      talentCount,
      mentorCount,
      recruiterCount,
      newestDate: newestDate ? moment(newestDate).format("MMM D, YYYY") : "N/A",
    };
  }, [getTalentStatus, users]);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const dateRange = searchParams.get("dateRange");

    if (status && status !== "all") {
      labels.push(
        `Status: ${
          status === "in_review"
            ? "In Review"
            : status.charAt(0).toUpperCase() + status.slice(1)
        }`,
      );
    }

    if (role && role !== "all") {
      labels.push(`Role: ${role.charAt(0).toUpperCase() + role.slice(1)}`);
    }

    if (dateRange && dateRange !== "any") {
      labels.push(`Date: ${dateRange}`);
    }

    return labels;
  }, [searchParams]);

  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({
      type: "include",
      ids: new Set(
        selectedItems
          .map((item) => item.user_id)
          .filter((id): id is string => Boolean(id)),
      ),
    }),
    [selectedItems],
  );

  const columns: Column<ProfileDataWithName>[] = [
    {
      key: "name",
      header: "Applicant",
      width: "26%",
      sortable: true,
      exportValue: (row) => getFullName(row),
      valueGetter: (row) => getFullName(row),
      render: (_value, row) => {
        const fullName = getFullName(row);
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11 border border-amber-100 bg-amber-50">
              {row.image_url ? <AvatarImage src={row.image_url} alt={fullName} /> : null}
              <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-900">
                {getInitials(row)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900" title={fullName}>
                {fullName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {row.title?.trim() || "No professional title yet"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Review Status",
      width: "12%",
      sortable: true,
      exportValue: (row) => getTalentStatus(row).replace(/_/g, " "),
      valueGetter: (row) => getTalentStatus(row),
      render: (_value, row) => {
        const status = getTalentStatus(row);
        const label =
          status === "in_review"
            ? "In Review"
            : status.charAt(0).toUpperCase() + status.slice(1);

        return (
          <StatusPill
            status={getStatusTone(status)}
            label={label}
            className="px-3 py-1 text-xs font-semibold"
          />
        );
      },
    },
    {
      key: "applied_for",
      header: "Applied Roles",
      width: "14%",
      sortable: true,
      exportValue: (row) => {
        const roles: string[] = [];
        if (row.talent) roles.push("Talent");
        if (row.mentor) roles.push("Mentor");
        if (row.recruiter) roles.push("Recruiter");
        return roles.join(", ") || "None";
      },
      valueGetter: (row) => {
        const roles: string[] = [];
        if (row.talent) roles.push("Talent");
        if (row.mentor) roles.push("Mentor");
        if (row.recruiter) roles.push("Recruiter");
        return roles.join(", ") || "None";
      },
      render: (_value, row) => {
        const roles = [
          row.talent ? "Talent" : null,
          row.mentor ? "Mentor" : null,
          row.recruiter ? "Recruiter" : null,
        ].filter(Boolean) as string[];

        return (
          <div className="flex flex-wrap gap-1.5">
            {roles.map((role) => (
              <Badge
                key={role}
                variant="outline"
                className="rounded-full border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800"
              >
                {role}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Email",
      width: "18%",
      sortable: true,
      valueGetter: (row) => row.email,
      render: (_value, row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{row.email}</p>
          <p className="truncate text-xs text-slate-500">
            {row.telegram ? `Telegram: @${row.telegram}` : "No Telegram linked"}
          </p>
        </div>
      ),
    },
    {
      key: "referrer_name",
      header: "Signup Source",
      width: "16%",
      sortable: true,
      exportValue: (row) => {
        if (!row.referred_by) return "Direct signup";
        return row.referrer_name
          ? `${row.referrer_name} (${row.referred_by})`
          : row.referred_by;
      },
      valueGetter: (row) =>
        row.referred_by ? row.referrer_name || row.referred_by || "" : "Direct signup",
      render: (_value, row) => {
        if (!row.referred_by) {
          return (
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">Direct signup</p>
              <p className="text-xs text-slate-500">No referral code attached</p>
            </div>
          );
        }

        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {row.referrer_name || "Referral source"}
            </p>
            <p className="truncate text-xs text-slate-500">Code: {row.referred_by}</p>
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Submitted",
      width: "14%",
      sortable: true,
      exportValue: (row) => {
        const createdAt = getCreatedAt(row);
        return createdAt ? moment(createdAt).format("MMM D, YYYY") : "N/A";
      },
      valueGetter: (row) => getCreatedAt(row) || "",
      render: (_value, row) => {
        const createdAt = getCreatedAt(row);
        return createdAt ? (
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">
              {moment(createdAt).format("MMM D, YYYY")}
            </p>
            <p className="text-xs text-slate-500">{moment(createdAt).fromNow()}</p>
          </div>
        ) : (
          "N/A"
        );
      },
    },
    {
      key: "actions",
      header: "Review Actions",
      width: "10%",
      render: (_value, row) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  window.open(`/admin/talent/${row.user_id}`, "_blank");
                }}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Open profile review
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleApproveClick(row);
                }}
              >
                <UserRoundCheck className="mr-2 h-4 w-4" />
                Approve applicant
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleStatusUpdate(row, "in_review");
                }}
              >
                <Clock3 className="mr-2 h-4 w-4" />
                Keep in review
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleStatusUpdate(row, "deferred");
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Defer decision
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleStatusUpdate(row, "rejected");
                }}
              >
                Reject applicant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Talent Review Cockpit"
      subtitle="Triage, approve, defer, and batch-manage incoming talent applications"
    >
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-[32px] border-none bg-transparent shadow-none">
          <CardContent className="relative overflow-hidden rounded-[32px] border border-amber-100/70 bg-[radial-gradient(circle_at_top_left,_rgba(255,237,180,0.95),_rgba(255,255,255,0.98)_38%,_rgba(248,250,252,1)_100%)] p-0 shadow-[0_30px_80px_rgba(245,158,11,0.14)]">
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.22),_transparent_58%)] lg:block" />
            <div className="pointer-events-none absolute -right-10 top-10 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="pointer-events-none absolute left-0 top-0 h-28 w-28 rounded-full bg-white/50 blur-2xl" />

            <div className="relative px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
              <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <Badge className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900">
                      Admin Queue
                    </Badge>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.35rem]">
                      Review incoming talent requests with less friction
                    </h1>
                    <p className="mt-2 text-base text-slate-600 sm:text-lg">
                      This cockpit keeps the queue table-first, but surfaces the
                      signals you need before opening each applicant profile.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Newest submission
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {metrics.newestDate}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Based on the currently filtered queue.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <SummaryMetric
                    label="Queue Size"
                    value={String(metrics.totalRequests)}
                    note="Current requests in view"
                    icon={Users}
                  />
                  <SummaryMetric
                    label="In Review"
                    value={String(metrics.inReviewCount)}
                    note="Still awaiting a decision"
                    icon={Clock3}
                  />
                  <SummaryMetric
                    label="Direct Signups"
                    value={String(metrics.directCount)}
                    note="No referral attached"
                    icon={UserRoundPlus}
                  />
                  <SummaryMetric
                    label="Referred"
                    value={String(metrics.referredCount)}
                    note="Submitted through referral"
                    icon={Sparkles}
                  />
                  <SummaryMetric
                    label="Role Demand"
                    value={`${metrics.talentCount}/${metrics.mentorCount}/${metrics.recruiterCount}`}
                    note="Talent / Mentor / Recruiter"
                    icon={UserRoundCheck}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <AdminFilters
          config={{
            dateFilter: true,
            statusFilter: [
              { value: "in_review", label: "In Review" },
              { value: "approved", label: "Approved" },
              { value: "deferred", label: "Deferred" },
              { value: "rejected", label: "Rejected" },
              { value: "all", label: "All statuses" },
            ],
            customFilters: [
              {
                key: "role",
                label: "Applied Role",
                options: [
                  { value: "all", label: "All roles" },
                  { value: "talent", label: "Talent" },
                  { value: "mentor", label: "Mentor" },
                  { value: "recruiter", label: "Recruiter" },
                ],
              },
            ],
            sortOptions: [
              { value: "latest", label: "Latest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "status", label: "Status" },
              { value: "name-asc", label: "Name A-Z" },
              { value: "name-desc", label: "Name Z-A" },
              { value: "email-asc", label: "Email A-Z" },
              { value: "email-desc", label: "Email Z-A" },
            ],
          }}
          basePath="/admin/talent-approval"
        />

        <div className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-4 shadow-sm sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900">
                <Filter className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold">Active queue context</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilterLabels.length > 0 ? (
                  activeFilterLabels.map((label) => (
                    <ActiveFilterChip key={label} label={label} />
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    Viewing the full active queue with default filters.
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-[20px] border border-amber-200 bg-amber-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                {selectedItems.length > 0
                  ? `${selectedItems.length} applicant${selectedItems.length === 1 ? "" : "s"} selected`
                  : "No applicants selected"}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {selectedItems.length > 0
                  ? "Use bulk review when you want to apply one decision pattern to the current selection."
                  : "Select applicants from the grid to unlock batch approval or rejection."}
              </p>
            </div>
          </div>
        </div>

        {selectedItems.length > 0 ? (
          <div className="rounded-[24px] border border-[#FFC905] bg-[#FFC905]/10 px-4 py-4 shadow-sm sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFC905] text-black">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Batch review ready
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedItems.length} selected across the current filtered queue.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItems([])}
                  className="rounded-full border-slate-200 bg-white"
                >
                  Clear selection
                </Button>
                <Button
                  onClick={() => setShowBulkApproval(true)}
                  className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
                >
                  Manage selected applicants
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <AdminDataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.user_id || row.email || row.name || "talent"}
          loading={loading}
          emptyMessage="No talent requests found for the current queue view"
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setCurrentPage(1);
          }}
          totalItems={users.length}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="client"
          sortingMode="client"
          checkboxSelection
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={(model) => {
            const selectedIds = model.ids;
            setSelectedItems(
              users.filter((user) =>
                user.user_id ? selectedIds.has(user.user_id) : false,
              ),
            );
          }}
        />
      </div>

      {selectedUser ? (
        <ApprovalPopup
          open={showApprovePopup}
          setOpen={setShowApprovePopup}
          user={selectedUser}
          fetchData={fetchPendingUsers}
          loading={loading}
          setLoading={setLoading}
        />
      ) : null}

      <BulkApproval
        open={showBulkApproval}
        onOpenChange={setShowBulkApproval}
        selectedItems={selectedItems}
        entityType="talent"
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
      />

      <QuickActionFAB
        actions={[
          {
            icon: CheckSquare,
            label: "Bulk review",
            onClick: () => setShowBulkApproval(true),
          },
          {
            icon: Square,
            label: "Select all",
            onClick: toggleSelectAll,
          },
          {
            icon: MoreHorizontal,
            label: "Back to top",
            onClick: () =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              }),
          },
        ]}
      />
    </AdminPageLayout>
  );
}
