"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { EnhancedTable, Column } from "@/app/components/admin/EnhancedTable";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { Spinner } from "@/app/components/admin/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, CheckSquare, Square } from "lucide-react";
import { ProfileData } from "@/app/talents/my-profile/page";
import ApprovalPopup from "./components/ApprovalPopup";
import { BulkApproval } from "@/app/components/admin/BulkApproval";
import toast from "react-hot-toast";
import moment from "moment";

export default function AdminTalentApproval() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [selectedItems, setSelectedItems] = useState<ProfileData[]>([]);
  const [showBulkApproval, setShowBulkApproval] = useState(false);

  const handleApproveClick = (user: ProfileData) => {
    setSelectedUser(user);
    setShowApprovePopup(true);
  };

  const toggleItemSelection = (user: ProfileData) => {
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
          reason: reason || "Rejected by admin",
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

  const columns: Column<ProfileData>[] = [
    {
      key: "select",
      header: "",
      width: "5%",
      render: (value: any, row: ProfileData) => (
        <Checkbox
          checked={selectedItems.some((item) => item.user_id === row.user_id)}
          onCheckedChange={() => toggleItemSelection(row)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: "name",
      header: "Name",
      width: "22%",
      sortable: true,
      exportValue: (row: ProfileData) => `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      render: (value: any, row: ProfileData) => {
        const fullName = `${row.first_name} ${row.last_name}`;
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
      exportValue: (row: ProfileData) => {
        if (row.approved) return "Approved";
        if (row.inReview) return "Pending";
        return "Rejected";
      },
      render: (value: any, row: ProfileData) => {
        if (row.approved) {
          return (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Approved
            </Badge>
          );
        } else if (row.inReview) {
          return (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Pending
            </Badge>
          );
        } else {
          return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Rejected
            </Badge>
          );
        }
      },
    },
    {
      key: "applied_for",
      header: "Applied For",
      width: "12%",
      exportValue: (row: ProfileData) => {
        const roles: string[] = [];
        if (row.talent) roles.push("Talent");
        if (row.mentor) roles.push("Mentor");
        if (row.recruiter) roles.push("Recruiter");
        return roles.join(", ") || "";
      },
      render: (value: any, row: ProfileData) => {
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
      width: "25%",
      sortable: true,
    },
    {
      key: "created_at",
      header: "Created on",
      width: "13%",
      sortable: true,
      exportValue: (row: ProfileData) => {
        const createdAt = row.user_created_at || row.created_at;
        return createdAt ? moment(createdAt).format("MMM D, YYYY") : "N/A";
      },
      render: (value: string, row: ProfileData) => {
        const createdAt = row.user_created_at || value;
        return createdAt ? moment(createdAt).format("MMM D, YYYY") : "N/A";
      },
    },
    {
      key: "actions",
      header: "Actions",
      width: "8%",
      render: (value: any, row: ProfileData) => (
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());

      // Default to pending status if not specified
      if (!params.has('status')) {
        params.set('status', 'pending');
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

      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, [searchParams]);

  // Smart selection preservation: keep only items still in filtered results
  useEffect(() => {
    setSelectedItems((prev) =>
      prev.filter((item) => users.some((u) => u.user_id === item.user_id))
    );
  }, [users]);

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
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
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
              <Checkbox
                checked={selectedItems.length === users.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium text-gray-900">
                Select All ({users.length})
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

        <EnhancedTable
          data={users}
          columns={columns}
          searchable={true}
          searchPlaceholder="Search by name or email..."
          pagination={true}
          itemsPerPage={10}
          exportable={true}
          loading={loading}
          emptyMessage="No talent requests found"
          mobileCardView
          renderMobileCard={(user) => (
            <TalentApprovalCard
              user={user}
              selected={selectedItems.some((item) => item.user_id === user.user_id)}
              onSelect={() => toggleItemSelection(user)}
              onApprove={() => handleApproveClick(user)}
              onReject={() => handleBulkReject([user.user_id])}
            />
          )}
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

function TalentApprovalCard({
  user,
  selected,
  onSelect,
  onApprove,
  onReject,
}: {
  user: ProfileData;
  selected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const getStatusBadge = () => {
    if (user.approved) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Approved
        </Badge>
      );
    } else if (user.inReview) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Pending
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Rejected
        </Badge>
      );
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm space-y-3 relative">
      <div className="absolute top-3 right-3">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-gray-900">
          {user.first_name} {user.last_name}
        </div>
        <div className="text-sm text-gray-600">{user.email}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {getStatusBadge()}
          <span>{moment(user.created_at || user.user_created_at).fromNow()}</span>
        </div>
      </div>
      {(user.city || user.country) && (
        <div className="text-sm text-gray-700">
          {user.city}{user.city && user.country ? ', ' : ''}{user.country}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {user.talent && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Talent
          </Badge>
        )}
        {user.mentor && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Mentor
          </Badge>
        )}
        {user.recruiter && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Recruiter
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onApprove}>
          Approve
        </Button>
        <Button size="sm" variant="destructive" onClick={onReject}>
          Reject
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => window.open(`/admin/talent/${user.user_id}`, "_blank")}
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}
