"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { EnhancedTable, Column } from "@/app/components/admin/EnhancedTable";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { BulkApproval } from "@/app/components/admin/BulkApproval";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckSquare, MoreHorizontal, Square } from "lucide-react";
import toast from "react-hot-toast";
import ApprovalPopup from "./components/ApprovalPopup";

interface Company {
  user_id: string;
  headline: string;
  email: string;
  city: string;
  country: string;
  designation: string;
  approved: boolean;
  inReview: boolean;
}

export default function AdminCompanyApproval() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Company | null>(null);
  const [selectedItems, setSelectedItems] = useState<Company[]>([]);
  const [showBulkApproval, setShowBulkApproval] = useState(false);

  const handleApproveClick = (user: Company) => {
    setSelectedUser(user);
    setShowApprovePopup(true);
  };

  const toggleItemSelection = (user: Company) => {
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

  const handleBulkApprove = async (itemIds: string[]) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/companies/bulk-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: itemIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve companies");
      }

      toast.success(`Successfully approved ${itemIds.length} company(ies)`);
      setSelectedItems([]);
      fetchPendingUsers();
    } catch (error) {
      console.error("Error approving companies:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async (itemIds: string[], reason?: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/companies/bulk-reject", {
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
        throw new Error("Failed to reject companies");
      }

      toast.success(`Successfully rejected ${itemIds.length} company(ies)`);
      setSelectedItems([]);
      fetchPendingUsers();
    } catch (error) {
      console.error("Error rejecting companies:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Company>[] = [
    {
      key: "select",
      header: "",
      width: "5%",
      render: (_value: unknown, row: Company) => (
        <Checkbox
          checked={selectedItems.some((item) => item.user_id === row.user_id)}
          onCheckedChange={() => toggleItemSelection(row)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: "headline",
      header: "Headline",
      width: "27%",
      sortable: true,
      exportValue: (row: Company) => row.headline?.replace(/<[^>]*>?/gm, "") || "",
      render: (_value: unknown, row: Company) => {
        const cleanHeadline = row.headline?.replace(/<[^>]*>?/gm, "") || "";
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="font-medium" title={cleanHeadline}>
                {cleanHeadline.length > 25
                  ? `${cleanHeadline.substring(0, 25)}...`
                  : cleanHeadline}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: "10%",
      exportValue: (row: Company) => {
        if (row.approved) return "Approved";
        if (row.inReview) return "Pending";
        return "Rejected";
      },
      render: (_value: unknown, row: Company) => {
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
      key: "email",
      header: "Email",
      width: "23%",
      sortable: true,
    },
    {
      key: "location",
      header: "Location",
      width: "18%",
      exportValue: (row: Company) => {
        const parts = [row.city, row.country].filter(Boolean);
        return parts.join(", ") || "";
      },
      render: (_value: unknown, row: Company) => (
        <span>
          {row.city}, {row.country}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "12%",
      render: (_value: unknown, row: Company) => (
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
                  window.open(`/admin/company/${row.user_id}`, "_blank");
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

      const url = `/api/admin/companies/pending${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        console.error("Failed to fetch pending companies:", data);
        setUsers([]);
        return;
      }

      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch pending companies:", error);
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
      title="Company Join Requests"
      subtitle="Review and approve company applications"
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
            locationFilter: true,
            sortOptions: [
              { value: 'latest', label: 'Latest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'headline-asc', label: 'Headline A-Z' },
              { value: 'headline-desc', label: 'Headline Z-A' },
            ],
          }}
          basePath="/admin/company-approval"
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
          searchPlaceholder="Search by headline, email, or location..."
          pagination={true}
          itemsPerPage={10}
          exportable={true}
          loading={loading}
          emptyMessage="No company requests found"
          mobileCardView
          renderMobileCard={(company) => (
            <CompanyApprovalCard
              company={company}
              selected={selectedItems.some((item) => item.user_id === company.user_id)}
              onSelect={() => toggleItemSelection(company)}
              onApprove={() => handleApproveClick(company)}
              onReject={() => handleBulkReject([company.user_id])}
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
        entityType="company"
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

function CompanyApprovalCard({
  company,
  selected,
  onSelect,
  onApprove,
  onReject,
}: {
  company: Company;
  selected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const cleanHeadline = company.headline?.replace(/<[^>]*>?/gm, "") || "";

  const getStatusBadge = () => {
    if (company.approved) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Approved
        </Badge>
      );
    } else if (company.inReview) {
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
          {company.designation || "Company"}
        </div>
        {cleanHeadline && (
          <div className="text-sm text-gray-600" title={cleanHeadline}>
            {cleanHeadline.length > 60
              ? `${cleanHeadline.substring(0, 60)}...`
              : cleanHeadline}
          </div>
        )}
        <div className="text-sm text-gray-600">{company.email}</div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>
      {(company.city || company.country) && (
        <div className="text-sm text-gray-700">
          {company.city}{company.city && company.country ? ', ' : ''}{company.country}
        </div>
      )}
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
          onClick={() =>
            window.open(`/admin/company/${company.user_id}`, "_blank")
          }
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}
