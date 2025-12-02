"use client";

export const dynamic = "force-dynamic";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { DeleteConfirmDialog } from "@/app/components/admin/DeleteConfirmDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from "js-cookie";
import { BarChart3, Copy, Download, Filter, MoreHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  userid: string;
  talent_status: "approved" | "pending";
  mentor_status: "approved" | "pending";
  recruiter_status: "approved" | "pending";
  wallet_address?: string;
  last_active: string;
  has_talent_profile: boolean;
}

export default function AdminManageUsers() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [relatedData, setRelatedData] = useState({
    talents: 0,
    companies: 0,
    jobs: 0,
  });

  const getAuthHeaders = () => {
    const token = Cookies.get("admin_token");
    if (!token) {
      router.push("/admin/login");
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      // Build URL with filter params
      const params = new URLSearchParams(searchParams.toString());
      const url = `/api/admin/users${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, { headers });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const { users } = await response.json();
      setUsers(users);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [searchParams]);

  const fetchUserRelatedData = async (userId: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/admin/users/${userId}/related`, {
        headers,
      });
      const data = await response.json();
      setRelatedData(data);
    } catch (error) {
      console.error("Failed to fetch related data:", error);
      setRelatedData({ talents: 0, companies: 0, jobs: 0 });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `User deleted successfully. Removed: ${data.deleted.talents} talents, ${data.deleted.companies} companies, ${data.deleted.jobs} jobs`
        );
        fetchAllUsers(); // Refresh list
        setShowDeleteDialog(false);
        setUserToDelete(null);
      } else {
        throw new Error(data.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "email",
      header: "Email",
      width: "20%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {row.email?.charAt(0) || row.wallet_address?.charAt(2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{""}</div>
            <div className="text-sm text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      width: "15%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>
            {row.first_name} {row.last_name}
          </span>
        </div>
      ),
    },
    {
      key: "wallet_address",
      header: "Wallet Address",
      width: "15%",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.wallet_address ? (
            <>
              <span>
                {row.wallet_address.length > 10
                  ? `${row.wallet_address.slice(0, 10)}...${row.wallet_address.slice(-10)}`
                  : row.wallet_address}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  toast.success("Wallet Address copied to clipboard");
                  navigator.clipboard.writeText(row.wallet_address || "");
                }}
              >
                <Copy className="h-3 w-3 text-gray-500" />
              </Button>
            </>
          ) : (
            <span className="text-gray-400">Not Available</span>
          )}
        </div>
      ),
    },
    {
      key: "userid",
      header: "User ID",
      width: "15%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>
            {row.userid.length > 10
              ? `${row.userid.slice(0, 10)}...${row.userid.slice(-10)}`
              : row.userid}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              toast.success("User ID copied to clipboard");
              navigator.clipboard.writeText(row.userid);
            }}
          >
            <Copy className="h-3 w-3 text-gray-500" />
          </Button>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Approved Roles",
      width: "20%",
      render: (value, row) => (
        <div className="flex gap-2 flex-wrap">
          {row.mentor_status === "approved" && (
            <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
              Mentor
            </Badge>
          )}
          {row.recruiter_status === "approved" && (
            <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
              Recruiter
            </Badge>
          )}
          {row.talent_status === "approved" && (
            <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
              Talent
            </Badge>
          )}
          {row.mentor_status !== "approved" &&
            row.recruiter_status !== "approved" &&
            row.talent_status !== "approved" && (
              <Badge className="bg-gray-500 text-white hover:bg-gray-600 text-xs">
                No Roles
              </Badge>
            )}
        </div>
      ),
    },
    {
      key: "talent_profile",
      header: "Talent Profile",
      width: "15%",
      render: (value, row) =>
        row.has_talent_profile ? (
          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap w-full max-w-[150px] text-white bg-[#FFC905] border border-transparent rounded-md hover:bg-[#FFC905]/80 transition duration-200 ease-in-out"
            onClick={() => {
              window.open(`/admin/talent/${row.userid}`, "_blank");
            }}
          >
            Talent Profile
          </Button>
        ) : (
          <Badge className="bg-gray-600 text-gray-200 hover:bg-gray-500 w-[150px] text-center align-middle justify-center">
            No Talent Profile
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "10%",
      render: (_value: unknown, row: User) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (row.has_talent_profile) {
                    window.open(`/admin/talent/${row.userid}`, "_blank");
                  }
                }}
                disabled={!row.has_talent_profile}
              >
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={async () => {
                  setUserToDelete({
                    id: row.userid,
                    email: row.email,
                    name: `${row.first_name} ${row.last_name}`,
                  });
                  await fetchUserRelatedData(row.userid);
                  setShowDeleteDialog(true);
                }}
              >
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="All Users"
      subtitle="Manage users, roles, and profile access across GoodHive"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            All Users Under GoodHive&apos;s System
          </h2>
          <p className="text-sm text-muted-foreground">
            {users?.length || 0} users
          </p>
        </div>
      </div>

      {/* Admin Filters */}
      <AdminFilters
        config={{
          dateFilter: true,
          statusFilter: [
            { value: 'all', label: 'All roles' },
            { value: 'talent', label: 'Talent' },
            { value: 'mentor', label: 'Mentor' },
            { value: 'recruiter', label: 'Recruiter' },
          ],
          customFilters: [
            {
              key: 'hasProfile',
              label: 'Talent Profile',
              options: [
                { value: 'all', label: 'All users' },
                { value: 'yes', label: 'With profile' },
                { value: 'no', label: 'Without profile' },
              ],
            },
          ],
          sortOptions: [
            { value: 'latest', label: 'Latest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'email-asc', label: 'Email A-Z' },
            { value: 'email-desc', label: 'Email Z-A' },
          ],
        }}
        basePath="/admin/users"
      />

      <EnhancedTable
        data={users}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search by email, wallet address, user ID, first name, or last name..."
        pagination={true}
        itemsPerPage={10}
        exportable={true}
        loading={loading}
        emptyMessage="No users found"
        pageSizeOptions={[10, 25, 50]}
        mobileCardView
        renderMobileCard={(user) => <UserCard user={user} />}
      />

      <QuickActionFAB
        actions={[
          {
            icon: Download,
            label: "Export users",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          },
          {
            icon: Filter,
            label: "Filter by profile",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          },
          {
            icon: BarChart3,
            label: "View analytics",
            onClick: () => router.push("/admin/analytics"),
          },
        ]}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteUser}
        entityType="user"
        entityName={userToDelete?.email || ""}
        entityId={userToDelete?.id || ""}
        relatedData={relatedData}
        loading={deleteLoading}
      />
    </AdminPageLayout>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {user.email?.charAt(0) || user.wallet_address?.charAt(2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="font-semibold text-gray-900">
            {user.first_name} {user.last_name}
          </div>
          <div className="text-sm text-gray-600 break-words">{user.email}</div>
          <div className="text-xs text-gray-500">
            ID:{" "}
            {user.userid.length > 10
              ? `${user.userid.slice(0, 6)}...${user.userid.slice(-4)}`
              : user.userid}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {user.mentor_status === "approved" && (
          <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
            Mentor
          </Badge>
        )}
        {user.recruiter_status === "approved" && (
          <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
            Recruiter
          </Badge>
        )}
        {user.talent_status === "approved" && (
          <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
            Talent
          </Badge>
        )}
        {user.mentor_status !== "approved" &&
          user.recruiter_status !== "approved" &&
          user.talent_status !== "approved" && (
            <Badge className="bg-gray-500 text-white hover:bg-gray-600 text-xs">
              No Roles
            </Badge>
          )}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>
          Wallet:{" "}
          {user.wallet_address
            ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
            : "N/A"}
        </span>
        <span className="text-xs text-gray-500">
          Last active: {new Date(user.last_active).toLocaleDateString()}
        </span>
      </div>
      {user.has_talent_profile ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-white bg-[#FFC905] border border-transparent rounded-md hover:bg-[#FFC905]/80 transition duration-200 ease-in-out"
          onClick={() => window.open(`/admin/talent/${user.userid}`, "_blank")}
        >
          View Talent Profile
        </Button>
      ) : (
        <Badge className="bg-gray-600 text-gray-200 hover:bg-gray-500 w-full text-center justify-center">
          No Talent Profile
        </Badge>
      )}
    </div>
  );
}
