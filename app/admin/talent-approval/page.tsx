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
import { MoreHorizontal } from "lucide-react";
import { ProfileData } from "@/app/talents/my-profile/page";
import ApprovalPopup from "./components/ApprovalPopup";
import moment from "moment";

export default function AdminTalentApproval() {
  const [users, setUsers] = useState<ProfileData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ProfileData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);

  const handleApproveClick = (user: ProfileData) => {
    setSelectedUser(user);
    setShowApprovePopup(true);
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      width: "24%",
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
      width: "13%",
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
      width: "13%",
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
      width: "28%",
    },
    {
      key: "created_at",
      header: "Created on",
      width: "14%",
      render: (value: string) => moment(value).format("MMM D, YYYY"),
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
        `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  return (
    <AdminPageLayout
      title="Talents Join Requests"
      subtitle="Review and approve talent applications"
    >
      <div className="space-y-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or email..."
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
