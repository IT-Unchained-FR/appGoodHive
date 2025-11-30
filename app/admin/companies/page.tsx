"use client";

export const dynamic = "force-dynamic";

import { ConfirmationPopup } from "@/app/components/ConfirmationPopup/ConfirmationPopup";
import { EditCompanyModal } from "@/app/components/admin/EditCompanyModal";
import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { Building2, Download, Filter, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Company {
  address: string;
  approved: boolean;
  city: string;
  country: string;
  designation: string;
  email: string;
  github: string | null;
  headline: string;
  image_url: string;
  inreview: boolean;
  linkedin: string | null;
  phone_country_code: string;
  phone_number: string;
  portfolio: string | null;
  stackoverflow: string | null;
  status: string;
  telegram: string;
  twitter: string | null;
  user_id: string;
  wallet_address: string | null;
  created_at?: string;
}

export default function AdminManageCompanies() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
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

  const fetchAllCompanies = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      // Build URL with filter params
      const params = new URLSearchParams(searchParams.toString());
      const url = `/api/admin/companies${params.toString() ? `?${params.toString()}` : ""}`;

      const response = await fetch(url, { headers });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const company_data = await response.json();
      setCompanies(company_data);
    } catch (error) {
      console.log("💥", error);
      toast.error("Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCompanies();
  }, [searchParams]);

  const handleDeleteCompany = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/companies/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete company");
      }

      toast.success("Company deleted successfully");
      setShowDeleteConfirm(false);
      await fetchAllCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete company",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async (updatedCompany: Company) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/companies/${updatedCompany.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedCompany),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update company");
      }

      toast.success("Company updated successfully");
      await fetchAllCompanies();
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Company>[] = [
    {
      key: "designation",
      header: "Company Info",
      width: "20%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-12 w-12">
            {row.image_url ? (
              <Image
                src={row.image_url}
                alt={row.designation}
                width={46}
                height={46}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <AvatarFallback>{row.designation?.[0]}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{row.designation}</span>
          </div>
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
      key: "phone",
      header: "Phone",
      width: "15%",
      render: (value, row) => `+${row.phone_country_code} ${row.phone_number}`,
    },
    {
      key: "address",
      header: "Address",
      width: "15%",
      render: (value, row) => (
        <div className="flex flex-col">
          <span>{row.city}</span>
          <img
            src={generateCountryFlag(row.country)}
            alt={row.country}
            height={20}
            width={20}
            className="mt-1"
          />
        </div>
      ),
    },
    {
      key: "approved",
      header: "Status",
      width: "15%",
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
      width: "20%",
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit company"
            onClick={() => {
              setEditingCompany(row);
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
            title="Delete company"
            onClick={() => {
              setUserToDelete(row.user_id);
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
              window.open(`/admin/company/${row.user_id}`, "_blank");
            }}
          >
            View Profile
          </Button>
        </div>
      ),
    },
  ];

  const companyActions = [
    {
      icon: Building2,
      label: "Approve companies",
      onClick: () => router.push("/admin/company-approval"),
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
      title="All Companies"
      subtitle="Manage company profiles, approvals, and contact details"
    >
      <ConfirmationPopup
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => userToDelete && handleDeleteCompany(userToDelete)}
        title="Delete Company"
        description="Are you sure you want to delete this company? This action cannot be undone."
        loading={loading}
      />
      <EditCompanyModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        company={editingCompany}
        onSave={handleSaveCompany}
      />
      {/* Admin Filters */}
      <AdminFilters
        config={{
          dateFilter: true,
          statusFilter: [
            { value: "all", label: "All companies" },
            { value: "approved", label: "Approved" },
            { value: "pending", label: "Pending / In review" },
          ],
          customFilters: [
            {
              key: "location",
              label: "Location",
              type: "text",
              placeholder: "Search by city or country...",
            },
          ],
          sortOptions: [
            { value: "latest", label: "Latest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "name-asc", label: "Name A-Z" },
            { value: "name-desc", label: "Name Z-A" },
          ],
        }}
        basePath="/admin/companies"
      />
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Company Directory
              </h2>
              <p className="text-sm text-gray-600">
                {companies.length} companies • search, edit, or approve profiles.
              </p>
            </div>
          </div>
          <EnhancedTable
            data={companies}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search by email, designation, user ID, or wallet address..."
            pagination={true}
            itemsPerPage={10}
            exportable={true}
            loading={loading}
            emptyMessage="No companies found"
            pageSizeOptions={[10, 25, 50]}
            mobileCardView
            renderMobileCard={(company) => (
              <CompanyCard
                company={company}
                onEdit={() => {
                  setEditingCompany(company);
                  setShowEditModal(true);
                }}
                onDelete={() => {
                  setUserToDelete(company.user_id);
                  setShowDeleteConfirm(true);
                }}
              />
            )}
          />
        </div>
      </div>
      <QuickActionFAB actions={companyActions} />
    </AdminPageLayout>
  );
}

function CompanyCard({
  company,
  onEdit,
  onDelete,
}: {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          {company.image_url ? (
            <Image
              src={company.image_url}
              alt={company.designation}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <AvatarFallback>{company.designation?.[0]}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{company.designation}</div>
          <div className="text-sm text-gray-600 break-words">{company.email}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className={company.approved ? "bg-green-500 text-white" : "bg-orange-500 text-white"}>
              {company.approved ? "Approved" : "Pending"}
            </Badge>
            <Badge variant="secondary">{company.status || "Active"}</Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>
          {company.city}, {company.country}
        </span>
        <span>
          +{company.phone_country_code} {company.phone_number}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => window.open(`/admin/company/${company.user_id}`, "_blank")}
        >
          View
        </Button>
      </div>
    </div>
  );
}
