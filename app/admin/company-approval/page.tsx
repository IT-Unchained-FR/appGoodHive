"use client";

import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { AdminTable } from "@/app/components/admin/AdminTable";
import { SearchInput } from "@/app/components/admin/SearchInput";
import { Spinner } from "@/app/components/admin/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/app/components/ui/icon";
import ApprovalPopup from "./components/ApprovalPopup";
import moment from "moment";

export default function AdminCompanyApproval() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const handleApproveClick = (user: any) => {
    setSelectedUser(user);
    setShowApprovePopup(true);
  };

  const columns = [
    {
      key: "headline",
      header: "Headline",
      width: "30%",
      render: (value: any, row: any) => {
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
      key: "email",
      header: "Email",
      width: "25%",
    },
    {
      key: "location",
      header: "Location",
      width: "20%",
      render: (value: any, row: any) => (
        <span>
          {row.city}, {row.country}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "15%",
      render: (value: any, row: any) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Icon name="more" className="h-4 w-4" />
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
      const response = await fetch("/api/admin/companies/pending");
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const searchStr =
        `${user.headline} ${user.email} ${user.city} ${user.country}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  return (
    <AdminPageLayout
      title="Company Join Requests"
      subtitle="Review and approve company applications"
    >
      <div className="space-y-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, city, or country..."
        />

        {loading ? (
          <div className="py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <AdminTable
              columns={columns}
              data={filteredUsers}
              // onRowClick={(row) =>
              //   window.open(`/admin/company/${row.user_id}`, "_blank")
              // }
            />
            {filteredUsers.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No pending requests found
              </div>
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
    </AdminPageLayout>
  );
}
