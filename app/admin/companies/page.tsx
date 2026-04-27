"use client";

export const dynamic = "force-dynamic";

import { AdminDataGrid } from "@/app/components/admin/AdminDataGrid";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { DeleteConfirmDialog } from "@/app/components/admin/DeleteConfirmDialog";
import { EditCompanyModal } from "@/app/components/admin/EditCompanyModal";
import { Column } from "@/app/components/admin/EnhancedTable";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Download, Filter, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { GridFilterModel } from "@mui/x-data-grid";

interface Company {
  address: string;
  approved: boolean;
  published: boolean;
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

type SortDirection = "asc" | "desc" | null;

const getCompanyGridSortState = (
  params: ReadonlyURLSearchParams,
): { field: string | null; direction: SortDirection } => {
  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");

  if (!sortBy || (sortDir !== "asc" && sortDir !== "desc")) {
    return { field: null, direction: null };
  }

  return {
    field: sortBy,
    direction: sortDir,
  };
};

export default function AdminManageCompanies() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const serverSearchQuery = searchParams.get("search") || "";
  const currentPage = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const currentPageSize = Math.max(
    1,
    Number(searchParams.get("limit") || "25") || 25,
  );
  const { field: sortField, direction: sortDirection } = useMemo(
    () => getCompanyGridSortState(searchParams),
    [searchParams],
  );

  const initialColumnFilters = useMemo<GridFilterModel>(() => {
    try {
      const filters = searchParams.get("columnFilters");
      if (filters) {
        return { items: JSON.parse(filters) };
      }
    } catch (e) {}
    return { items: [] };
  }, [searchParams]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(serverSearchQuery);

  const getSafeValue = (value?: string | null) =>
    value && value !== "null" ? value : undefined;

  useEffect(() => {
    setSearchQuery(serverSearchQuery);
  }, [serverSearchQuery]);

  const updateCompanyQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParamsString);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const nextQuery = params.toString();
      router.replace(
        nextQuery ? `/admin/companies?${nextQuery}` : "/admin/companies",
        { scroll: false },
      );
    },
    [router, searchParamsString],
  );

  const handleFilterModelChange = useCallback((model: GridFilterModel) => {
    const json = JSON.stringify(model.items);
    updateCompanyQueryParams({ columnFilters: model.items.length > 0 ? json : null, page: "1" });
  }, [updateCompanyQueryParams]);

  useEffect(() => {
    const normalizedSearch = searchQuery.trim().replace(/\s+/g, " ");
    const normalizedServerSearch = serverSearchQuery
      .trim()
      .replace(/\s+/g, " ");

    if (normalizedSearch === normalizedServerSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      updateCompanyQueryParams({
        search: normalizedSearch || null,
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery, serverSearchQuery, updateCompanyQueryParams]);

  const fetchAllCompanies = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams(searchParamsString);
      const url = `/api/admin/companies${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, { cache: "no-store" });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const result = await response.json();
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setCompanies(list);
      setTotalCompanies(
        typeof result?.pagination?.total === "number"
          ? result.pagination.total
          : list.length,
      );

      if (
        typeof result?.pagination?.page === "number" &&
        result.pagination.page !== currentPage
      ) {
        updateCompanyQueryParams({ page: String(result.pagination.page) });
      }
    } catch (error) {
      toast.error("Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  }, [currentPage, router, searchParamsString, updateCompanyQueryParams]);

  useEffect(() => {
    fetchAllCompanies();
  }, [fetchAllCompanies]);

  const handleDeleteCompany = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(`/api/admin/companies/${userToDelete}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete company");
      }

      toast.success("Company deleted successfully");
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setSelectedCompany(null);
      await fetchAllCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete company",
      );
    } finally {
      setDeleteLoading(false);
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

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

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
      sortable: true,
      render: (_value, row) => (
        <div className="flex items-center gap-3">
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
          <div className="min-w-0">
            <span className="block truncate font-medium text-slate-900">
              {row.designation || "Unnamed company"}
            </span>
            <span className="block truncate text-sm text-slate-500">
              {row.headline || row.wallet_address || "No headline"}
            </span>
          </div>
        </div>
      ),
      exportValue: (row) => row.designation || "",
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (value) => (
        <span className="truncate text-sm text-slate-700">{String(value || "N/A")}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      sortable: true,
      render: (_value, row) => {
        const phone = row.phone_number?.trim();
        if (!phone) return "N/A";
        return `+${row.phone_country_code} ${phone}`;
      },
      exportValue: (row) =>
        row.phone_number ? `+${row.phone_country_code} ${row.phone_number}` : "",
    },
    {
      key: "address",
      header: "Address",
      sortable: true,
      render: (_value, row) => {
        const countryFlag = row.country
          ? generateCountryFlag(row.country)
          : undefined;

        return (
          <div className="flex min-w-0 flex-col">
            <span className="truncate">
              {[row.city, row.country].filter(Boolean).join(", ") || "N/A"}
            </span>
            {countryFlag ? (
              <img
                src={countryFlag}
                alt={row.country}
                height={20}
                width={20}
                className="mt-1 h-5 w-5"
              />
            ) : null}
          </div>
        );
      },
      exportValue: (row) =>
        [row.city, row.country, row.address].filter(Boolean).join(", "),
    },
    {
      key: "approved",
      header: "Status",
      sortable: true,
      render: (_value, row) => (
        <div className="flex flex-col gap-1">
          <Badge className={row.approved ? "bg-green-500 text-white" : "bg-orange-500 text-white"}>
            {row.approved ? "Approved" : "Pending"}
          </Badge>
          <Badge className={row.published ? "bg-blue-500 text-white" : "bg-gray-400 text-white"}>
            {row.published ? "Published" : "Unpublished"}
          </Badge>
        </div>
      ),
      exportValue: (row) =>
        row.approved
          ? row.published
            ? "Approved, Published"
            : "Approved, Unpublished"
          : "Pending",
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (value) => {
        if (!value) return "N/A";
        return new Date(String(value)).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
      exportValue: (row) =>
        row.created_at ? new Date(row.created_at).toISOString() : "",
    },
    {
      key: "actions",
      header: "Actions",
      render: (_value, row) => (
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
              setSelectedCompany(row);
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
              window.open(`/admin/company/${row.user_id}`, "_blank", "noopener,noreferrer");
            }}
          >
            View Profile
          </Button>
        </div>
      ),
      exportValue: () => "",
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
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteCompany}
        entityType="company"
        entityName={
          getSafeValue(selectedCompany?.email) ||
          getSafeValue(selectedCompany?.designation) ||
          ""
        }
        entityId={userToDelete || ""}
        loading={deleteLoading}
      />
      <EditCompanyModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        company={editingCompany}
        onSave={handleSaveCompany}
      />
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
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Company Directory
              </h2>
              <p className="text-sm text-gray-600">
                {totalCompanies || companies.length} companies • search, edit, or approve profiles.
              </p>
            </div>
          </div>
          <AdminDataGrid
            rows={companies}
            columns={columns}
            getRowId={(row) => row.user_id}
            loading={loading}
            emptyMessage="No companies found"
            searchPlaceholder="Search by company, email, location, wallet, phone, or any visible field..."
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            currentPage={currentPage}
            pageSize={currentPageSize}
            pageSizeOptions={[10, 25, 50]}
            totalItems={totalCompanies}
            onPageChange={(page) => updateCompanyQueryParams({ page: String(page) })}
            onPageSizeChange={(pageSize) =>
              updateCompanyQueryParams({ limit: String(pageSize) })
            }
            filterModel={initialColumnFilters}
            onFilterModelChange={handleFilterModelChange}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={(field, direction) =>
              updateCompanyQueryParams({
                sort: null,
                sortBy: field,
                sortDir: direction,
              })
            }
          />
        </div>
      </div>
      <QuickActionFAB actions={companyActions} />
    </AdminPageLayout>
  );
}
