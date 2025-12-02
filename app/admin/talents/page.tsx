"use client";

export const dynamic = "force-dynamic";

import { ConfirmationPopup } from "@/app/components/ConfirmationPopup/ConfirmationPopup";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { EditTalentModal } from "@/app/components/admin/EditTalentModal";
import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { ProfileData } from "@/app/talents/my-profile/page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import {
  Check,
  Copy,
  Download,
  Filter,
  Pencil,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ApprovalPopup from "../talent-approval/components/ApprovalPopup";

export default function AdminManageTalents() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [talents, setTalents] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [editingTalent, setEditingTalent] = useState<ProfileData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const fetchAllTalents = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      // Build URL with filter params
      const params = new URLSearchParams(searchParamsString);
      const url = `/api/admin/talents${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, { headers });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const talents = await response.json();
      setTalents(talents);
    } catch (error) {
      toast.error("Failed to fetch talents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTalents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsString]);

  const handleDeleteTalent = async (userId: string) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/admin/talents/${userId}`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete talent");
      }

      toast.success("Talent deleted successfully");
      setShowDeleteConfirm(false);
      await fetchAllTalents();
    } catch (error) {
      console.error("Error deleting talent:", error);
      toast.error("Failed to delete talent");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTalent = async (updatedTalent: ProfileData) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/admin/talents/${updatedTalent.user_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedTalent),
      });

      if (!response.ok) {
        throw new Error("Failed to update talent");
      }

      toast.success("Talent updated successfully");
      await fetchAllTalents();
    } catch (error) {
      console.error("Error updating talent:", error);
      toast.error("Failed to update talent");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<ProfileData>[] = [
    {
      key: "name",
      header: "Talent Name",
      width: "15%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-12 w-12">
            {row.image_url ? (
              <Image
                src={row.image_url}
                alt={`${row.first_name} ${row.last_name}`}
                width={46}
                height={46}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <AvatarFallback>
                {row.first_name?.[0]}
                {row.last_name?.[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="truncate max-w-[150px]">
            {`${row.first_name} ${row.last_name}`}
          </span>
        </div>
      ),
    },
    {
      key: "user_id",
      header: "User ID",
      width: "14%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[100px]">
            {row.user_id
              ? `${row.user_id.slice(0, 5)}...${row.user_id.slice(-5)}`
              : ""}
          </span>
          <button
            title="Copy user ID"
            onClick={() => {
              navigator.clipboard.writeText(row.user_id || "");
              toast.success("User ID copied!");
            }}
            className="hover:text-gray-700"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      width: "15%",
      sortable: true,
    },
    {
      key: "wallet_address",
      header: "Wallet Address",
      width: "12%",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.wallet_address ? (
            <>
              <span className="truncate max-w-[100px]">
                {row.wallet_address}
              </span>
              <button
                title="Copy wallet address"
                onClick={() => {
                  navigator.clipboard.writeText(row.wallet_address || "");
                  toast.success("Wallet address copied!");
                }}
                className="hover:text-gray-700"
              >
                <Copy className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Badge className="bg-orange-500 text-white">Not Available</Badge>
          )}
        </div>
      ),
    },
    {
      key: "talent",
      header: "Talent Status",
      width: "8%",
      sortable: true,
      render: (value, row) => (
        <Badge
          className={`${
            row.talent === true ? "bg-green-500" : "bg-orange-500"
          } text-white`}
        >
          {row.talent ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </Badge>
      ),
    },
    {
      key: "mentor",
      header: "Mentor Status",
      width: "8%",
      sortable: true,
      render: (value, row) => (
        <Badge
          className={`${
            row.mentor === true ? "bg-green-500" : "bg-orange-500"
          } text-white`}
        >
          {row.mentor ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </Badge>
      ),
    },
    {
      key: "recruiter",
      header: "Recruiter Status",
      width: "8%",
      sortable: true,
      render: (value, row) => (
        <Badge
          className={`${
            row.recruiter === true ? "bg-green-500" : "bg-orange-500"
          } text-white`}
        >
          {row.recruiter ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </Badge>
      ),
    },
    {
      key: "approved",
      header: "Account Status",
      width: "8%",
      sortable: true,
      render: (value, row) => (
        <Badge
          className={`${
            row.approved ? "bg-green-500" : "bg-orange-500"
          } text-white`}
        >
          {row.approved ? "Approved" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "12%",
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit talent"
            onClick={() => {
              setEditingTalent(row);
              setShowEditModal(true);
            }}
            disabled={loading}
          >
            <Pencil className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Approve/Manage roles"
            onClick={() => {
              setSelectedUser(row);
              setShowApprovePopup(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Delete talent"
            onClick={() => {
              setUserToDelete(row.user_id || "");
              setShowDeleteConfirm(true);
            }}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
            onClick={() => {
              window.open(`/admin/talent/${row.user_id}`, "_blank");
            }}
          >
            View Profile
          </Button>
        </div>
      ),
    },
  ];

  const talentActions = [
    {
      icon: UserCheck,
      label: "Approve talents",
      onClick: () => router.push("/admin/talent-approval"),
    },
    {
      icon: Filter,
      label: "Filter & sort",
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
    {
      icon: Download,
      label: "Export data",
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
  ];

  return (
    <AdminPageLayout
      title="All Talents"
      subtitle="Manage talent profiles, roles, and approvals"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">All Talents</h2>
          <p className="text-sm text-muted-foreground">
            {talents?.length || 0} talents
          </p>
        </div>
      </div>

      {/* Admin Filters */}
      <AdminFilters
        config={{
          dateFilter: true,
          statusFilter: [
            { value: 'all', label: 'All statuses' },
            { value: 'approved', label: 'Approved' },
            { value: 'pending', label: 'Pending' },
          ],
          customFilters: [
            {
              key: 'role',
              label: 'Role',
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
        basePath="/admin/talents"
      />

      <ConfirmationPopup
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => userToDelete && handleDeleteTalent(userToDelete)}
        title="Delete Talent"
        description="Are you sure you want to delete this talent? This action cannot be undone."
        loading={loading}
      />
      {selectedUser && (
        <ApprovalPopup
          open={showApprovePopup}
          setOpen={setShowApprovePopup}
          user={selectedUser}
          fetchData={fetchAllTalents}
          setLoading={setLoading}
          loading={loading}
          superView
        />
      )}
      <EditTalentModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        talent={editingTalent}
        onSave={handleSaveTalent}
      />
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Talent Directory
              </h2>
              <p className="text-sm text-gray-600">
                {talents?.length || 0} talents • search, edit roles, or approve.
              </p>
            </div>
          </div>
          <EnhancedTable
            data={talents}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search by name, email, user ID, or wallet address..."
            pagination={true}
            itemsPerPage={10}
            exportable={true}
            loading={loading}
            emptyMessage="No talents found"
            pageSizeOptions={[10, 25, 50]}
            mobileCardView
            renderMobileCard={(talent) => (
              <TalentCard
                talent={talent}
                onEdit={() => {
                  setEditingTalent(talent);
                  setShowEditModal(true);
                }}
                onApprove={() => {
                  setSelectedUser(talent);
                  setShowApprovePopup(true);
                }}
                onDelete={() => {
                  setUserToDelete(talent.user_id || "");
                  setShowDeleteConfirm(true);
                }}
              />
            )}
          />
        </div>
      </div>
      <QuickActionFAB actions={talentActions} />
    </AdminPageLayout>
  );
}

function TalentCard({
  talent,
  onEdit,
  onApprove,
  onDelete,
}: {
  talent: ProfileData;
  onEdit: () => void;
  onApprove: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          {talent.image_url ? (
            <Image
              src={talent.image_url}
              alt={`${talent.first_name} ${talent.last_name}`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <AvatarFallback>
              {talent.first_name?.[0]}
              {talent.last_name?.[0]}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">
            {talent.first_name} {talent.last_name}
          </div>
          <div className="text-sm text-gray-600 break-words">
            {talent.email}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className={talent.talent ? "bg-green-500 text-white" : "bg-orange-500 text-white"}>
              Talent {talent.talent ? "Yes" : "No"}
            </Badge>
            <Badge className={talent.mentor ? "bg-green-500 text-white" : "bg-orange-500 text-white"}>
              Mentor {talent.mentor ? "Yes" : "No"}
            </Badge>
            <Badge className={talent.recruiter ? "bg-green-500 text-white" : "bg-orange-500 text-white"}>
              Recruiter {talent.recruiter ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>
          Wallet:{" "}
          {talent.wallet_address
            ? `${talent.wallet_address.slice(0, 6)}...${talent.wallet_address.slice(-4)}`
            : "N/A"}
        </span>
        <Badge className={talent.approved ? "bg-green-500 text-white" : "bg-orange-500 text-white"}>
          {talent.approved ? "Approved" : "Pending"}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onApprove}>
          Roles
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => window.open(`/admin/talent/${talent.user_id}`, "_blank")}
        >
          View
        </Button>
      </div>
    </div>
  );
}
