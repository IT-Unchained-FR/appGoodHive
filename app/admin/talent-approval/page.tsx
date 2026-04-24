"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { AdminDataGrid } from "@/app/components/admin/AdminDataGrid";
import { Column } from "@/app/components/admin/EnhancedTable";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckSquare, Square } from "lucide-react";
import { ProfileData } from "@/app/talents/my-profile/page";
import ApprovalPopup from "./components/ApprovalPopup";
import { BulkApproval } from "@/app/components/admin/BulkApproval";
import toast from "react-hot-toast";
import moment from "moment";
import { GridRowSelectionModel } from "@mui/x-data-grid";

type ProfileDataWithName = ProfileData & {
  name?: string;
  referrer_name?: string | null;
  referrer_user_id?: string | null;
  referrer_email?: string | null;
};

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

  const getTalentStatus = (user: ProfileDataWithName) => {
    const status = user.talent_status;
    if (status === "approved" || user.approved) {
      return "approved";
    }
    if (status === "deferred") {
      return "deferred";
    }
    if (status === "rejected") {
      return "rejected";
    }
    if (status === "pending" || status === "in_review" || user.inreview) {
      return "in_review";
    }
    return "in_review";
  };

  const handleApproveClick = (user: ProfileDataWithName) => {
    setSelectedUser(user);
    setShowApprovePopup(true);
  };

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
        throw new Error("Failed to update talent status");
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

  const toggleItemSelection = (user: ProfileDataWithName) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.user_id === user.user_id);
      if (exists) {
        return prev.filter((item) => item.user_id !== user.user_id);
      } else {
        return [...prev, user];
      }
    });
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
    approvalTypes?: Record<string, boolean>
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

  const columns: Column<ProfileDataWithName>[] = [
    {
      key: "name",
      header: "Name",
      width: "22%",
      sortable: true,
      exportValue: (row: ProfileDataWithName) =>
        `${row.first_name || ""} ${row.last_name || ""}`.trim(),
      render: (_value: unknown, row: ProfileDataWithName) => {
        const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim();
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="font-medium" title={fullName}>
                {fullName.length > 25
                  ? `${fullName.substring(0, 25)}...`
                  : fullName}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: "12%",
      sortable: true,
      exportValue: (row: ProfileDataWithName) => {
        const status = getTalentStatus(row);
        if (status === "approved") return "Approved";
        if (status === "deferred") return "Deferred";
        if (status === "rejected") return "Rejected";
        return "In Review";
      },
      render: (_value: unknown, row: ProfileDataWithName) => {
        const status = getTalentStatus(row);
        if (status === "approved") {
          return (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Approved
            </Badge>
          );
        } else if (status === "deferred") {
          return (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Deferred
            </Badge>
          );
        } else if (status === "rejected") {
          return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Rejected
            </Badge>
          );
        } else {
          return (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              In Review
            </Badge>
          );
        }
      },
    },
    {
      key: "applied_for",
      header: "Applied For",
      width: "12%",
      sortable: true,
      exportValue: (row: ProfileDataWithName) => {
        const roles: string[] = [];
        if (row.talent) roles.push("Talent");
        if (row.mentor) roles.push("Mentor");
        if (row.recruiter) roles.push("Recruiter");
        return roles.join(", ") || "";
      },
      render: (_value: unknown, row: ProfileDataWithName) => {
        return (
          <div className="flex flex-col gap-2 w-full justify-center items-center">
            {row.talent && (
              <Badge
                style={{ width: "100%", justifyContent: "center" }}
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200 w-fit"
              >
                Talent
              </Badge>
            )}
            {row.mentor && (
              <Badge
                style={{ width: "100%", justifyContent: "center" }}
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200 w-fit"
              >
                Mentor
              </Badge>
            )}
            {row.recruiter && (
              <Badge
                style={{ width: "100%", justifyContent: "center" }}
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200 w-fit"
              >
                Recruiter
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Email",
      width: "20%",
      sortable: true,
    },
    {
      key: "referrer_name",
      header: "Referred By",
      width: "20%",
      sortable: true,
      exportValue: (row: ProfileDataWithName) => {
        if (!row.referred_by) return "Direct signup";
        return row.referrer_name
          ? `${row.referrer_name} (${row.referred_by})`
          : row.referred_by;
      },
      render: (_value: unknown, row: ProfileDataWithName) => {
        if (!row.referred_by) {
          return (
            <span className="text-xs font-medium text-slate-400">
              Direct signup
            </span>
          );
        }

        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {row.referrer_name || "Referral source"}
            </p>
            <p className="truncate text-xs text-slate-500">
              Code: {row.referred_by}
            </p>
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Created on",
      width: "13%",
      sortable: true,
      exportValue: (row: ProfileDataWithName) => {
        const createdAt = row.user_created_at || row.created_at;
        return createdAt ? moment(createdAt).format("MMM D, YYYY") : "N/A";
      },
      render: (value: string, row: ProfileDataWithName) => {
        const createdAt = row.user_created_at || value;
        return createdAt ? moment(createdAt).format("MMM D, YYYY") : "N/A";
      },
    },
    {
      key: "actions",
      header: "Actions",
      width: "8%",
      render: (_value: unknown, row: ProfileDataWithName) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  window.open(`/admin/talent/${row.user_id}`, "_blank");
                }}
              >
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleApproveClick(row);
                }}
              >
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleStatusUpdate(row, "in_review");
                }}
              >
                Mark In Review
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleStatusUpdate(row, "deferred");
                }}
              >
                Mark Deferred
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleStatusUpdate(row, "rejected");
                }}
              >
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());

      if (!params.has("status")) {
        params.set("status", "all");
      }

      const url = `/api/admin/talents/pending${params.toString() ? `?${params.toString()}` : ''}`;
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

      const usersWithName = data.map((user: ProfileData) => ({
        ...user,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
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

  // Smart selection preservation: keep only items still in filtered results
  useEffect(() => {
    setSelectedItems((prev) =>
      prev.filter((item) => users.some((u) => u.user_id === item.user_id))
    );
  }, [users]);

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

  return (
    <AdminPageLayout
      title="Talents Join Requests"
      subtitle="Review and approve talent applications"
    >
      <div className="space-y-6">
        <AdminFilters
          config={{
            dateFilter: true,
            statusFilter: [
              { value: 'in_review', label: 'In Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'deferred', label: 'Deferred' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'all', label: 'All statuses' },
            ],
            customFilters: [
              {
                key: 'role',
                label: 'Applied Role',
                options: [
                  { value: 'all', label: 'All roles' },
                  { value: 'talent', label: 'Talent' },
                  { value: 'mentor', label: 'Mentor' },
                  { value: 'recruiter', label: 'Recruiter' },
                ],
              },
            ],
            sortOptions: [
              { value: 'latest', label: 'Latest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'status', label: 'Status' },
              { value: 'name-asc', label: 'Name A-Z' },
              { value: 'name-desc', label: 'Name Z-A' },
              { value: 'email-asc', label: 'Email A-Z' },
              { value: 'email-desc', label: 'Email Z-A' },
            ],
          }}
          basePath="/admin/talent-approval"
        />

        {selectedItems.length > 0 && (
          <div className="bg-[#FFC905]/10 border border-[#FFC905] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {selectedItems.length} selected
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkApproval(true)}
            >
              Manage Selected ({selectedItems.length})
            </Button>
          </div>
        )}

        <AdminDataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.user_id || row.email || row.name || "talent"}
          loading={loading}
          emptyMessage="No talent requests found"
          showSearchInput={false}
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

      {selectedUser && (
        <ApprovalPopup
          open={showApprovePopup}
          setOpen={setShowApprovePopup}
          user={selectedUser}
          fetchData={fetchPendingUsers}
          loading={loading}
          setLoading={setLoading}
        />
      )}

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
            label: "Bulk approve",
            onClick: () => setShowBulkApproval(true),
          },
          {
            icon: Square,
            label: "Select all",
            onClick: toggleSelectAll,
          },
          {
            icon: MoreHorizontal,
            label: "Pending list",
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
