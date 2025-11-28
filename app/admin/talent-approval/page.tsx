"use client";

import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { AdminTable } from "@/app/components/admin/AdminTable";
import { SearchInput } from "@/app/components/admin/SearchInput";
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
  const [users, setUsers] = useState<ProfileData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ProfileData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [selectedItems, setSelectedItems] = useState<ProfileData[]>([]);
  const [showBulkApproval, setShowBulkApproval] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    if (selectedItems.length === filteredUsers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredUsers]);
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

  const columns = [
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
      render: () => (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          Pending
        </Badge>
      ),
    },
    {
      key: "applied_for",
      header: "Applied For",
      width: "12%",
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
    },
    {
      key: "created_at",
      header: "Created on",
      width: "13%",
      render: (value: string, row: ProfileData) => {
        const createdAt =
          row.user_created_at || value; // Prefer user account creation date
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
      const response = await fetch("/api/admin/talents/pending");
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        console.error("Failed to fetch pending users:", data);
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const searchStr =
        `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
    setFilteredUsers(filtered);
    // Clear selection when filtering
    setSelectedItems((prev) =>
      prev.filter((item) =>
        filtered.some((user) => user.user_id === item.user_id)
      )
    );
  }, [searchQuery, users]);

  return (
    <AdminPageLayout
      title="Talents Join Requests"
      subtitle="Review and approve talent applications"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name or email..."
          />
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedItems.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkApproval(true)}
              >
                Bulk Actions
              </Button>
            </div>
          )}
        </div>

        {selectedItems.length > 0 && (
          <div className="bg-[#FFC905]/10 border border-[#FFC905] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.length === filteredUsers.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium text-gray-900">
                Select All ({filteredUsers.length})
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

        {loading ? (
          <div className="py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {isMobile ? (
              filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredUsers.map((user) => (
                    <TalentApprovalCard
                      key={user.user_id}
                      user={user}
                      selected={selectedItems.some(
                        (item) => item.user_id === user.user_id,
                      )}
                      onSelect={() => toggleItemSelection(user)}
                      onApprove={() => handleApproveClick(user)}
                      onReject={() => handleBulkReject([user.user_id])}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No pending requests found
                </div>
              )
            ) : (
              <>
                <AdminTable
                  columns={columns}
                  data={filteredUsers}
                  // onRowClick={(row) =>
                  //   window.open(`/admin/talent/${row.user_id}`, "_blank")
                  // }
                />
                {filteredUsers.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No pending requests found
                  </div>
                )}
              </>
            )}
          </>
        )}
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
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
          <span>{moment(user.created_at).fromNow()}</span>
        </div>
      </div>
      <div className="text-sm text-gray-700">
        {user.city}, {user.country}
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
