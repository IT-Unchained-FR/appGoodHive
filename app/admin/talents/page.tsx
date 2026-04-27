"use client";

export const dynamic = "force-dynamic";

import { DeleteConfirmDialog } from "@/app/components/admin/DeleteConfirmDialog";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { AdminDataGrid } from "@/app/components/admin/AdminDataGrid";
import { EditTalentModal } from "@/app/components/admin/EditTalentModal";
import { Column } from "@/app/components/admin/EnhancedTable";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { StatusPill } from "@/app/components/admin/StatusPill";
import {
  getSharedTalentColumns,
  getReferredByLabel,
  renderBooleanStatusPill,
  renderTalentApprovalBadge,
  renderMentorStatusPill,
} from "@/app/components/admin/sharedTalentColumns";
import { ProfileData } from "@/app/talents/my-profile/page";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  Download,
  Eye,
  ExternalLink,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ApprovalPopup from "../talent-approval/components/ApprovalPopup";
import { GridFilterModel } from "@mui/x-data-grid";

const EMPTY_CELL_LABEL = "N/A";
type SortDirection = "asc" | "desc" | null;

const TALENT_DETAIL_LABELS: Record<string, string> = {
  full_name: "Full Name",
  first_name: "First Name",
  last_name: "Last Name",
  image_url: "Image URL",
  cv_url: "CV URL",
  title: "Title",
  description: "Description",
  country: "Country",
  city: "City",
  phone_country_code: "Phone Country Code",
  phone_number: "Phone Number",
  phone: "Phone",
  location: "Location",
  email: "Email",
  about_work: "About Work",
  min_rate: "Min Rate",
  max_rate: "Max Rate",
  rate: "Rate",
  freelance_only: "Freelance Only",
  remote_only: "Remote Only",
  skills: "Skills",
  linkedin: "LinkedIn",
  github: "GitHub",
  twitter: "Twitter",
  stackoverflow: "Stack Overflow",
  portfolio: "Portfolio",
  telegram: "Telegram",
  talent: "Talent",
  mentor: "Mentor",
  recruiter: "Recruiter",
  talent_status: "Talent Status",
  mentor_status: "Mentor Status",
  recruiter_status: "Recruiter Status",
  talent_status_reason: "Talent Status Reason",
  mentor_status_reason: "Mentor Status Reason",
  recruiter_status_reason: "Recruiter Status Reason",
  hide_contact_details: "Hide Contact Details",
  referrer: "Referrer",
  referrer_name: "Referrer Name",
  referrer_email: "Referrer Email",
  referrer_user_id: "Referrer User ID",
  availability: "Availability",
  availability_status: "Availability Status",
  availability_updated_at: "Availability Updated",
  wallet_address: "Wallet Address",
  approved: "Approved",
  user_id: "User ID",
  inreview: "In Review",
  referred_by: "Referred By",
  approved_roles: "Approved Roles",
  experience: "Experience",
  education: "Education",
  certifications: "Certifications",
  projects: "Projects",
  languages: "Languages",
  current_company: "Current Company",
  user_created_at: "User Created",
  created_at: "Created",
  years_experience: "Years Experience",
  actions: "Actions",
};

const TALENT_DETAIL_PRIORITY = [
  "full_name",
  "first_name",
  "last_name",
  "title",
  "email",
  "user_id",
  "current_company",
  "years_experience",
  "location",
  "country",
  "city",
  "phone",
  "phone_country_code",
  "phone_number",
  "availability_status",
  "availability",
  "availability_updated_at",
  "talent",
  "talent_status",
  "talent_status_reason",
  "mentor",
  "mentor_status",
  "mentor_status_reason",
  "recruiter",
  "recruiter_status",
  "recruiter_status_reason",
  "approved",
  "inreview",
  "freelance_only",
  "remote_only",
  "hide_contact_details",
  "min_rate",
  "max_rate",
  "rate",
  "wallet_address",
  "linkedin",
  "github",
  "twitter",
  "stackoverflow",
  "portfolio",
  "telegram",
  "image_url",
  "cv_url",
  "skills",
  "description",
  "about_work",
  "referrer",
  "referrer_name",
  "referrer_email",
  "referrer_user_id",
  "referred_by",
  "approved_roles",
  "experience",
  "education",
  "certifications",
  "projects",
  "languages",
  "created_at",
  "user_created_at",
];

const TALENT_URL_FIELDS = new Set([
  "image_url",
  "cv_url",
  "linkedin",
  "github",
  "twitter",
  "stackoverflow",
  "portfolio",
]);

const TALENT_LONG_TEXT_FIELDS = new Set([
  "description",
  "about_work",
  "skills",
  "approved_roles",
  "experience",
  "education",
  "certifications",
  "projects",
  "languages",
]);

const TALENT_TABLE_HIDDEN_FIELDS = new Set([
  "description",
  "about_work",
  "skills",
  "approved_roles",
  "experience",
  "education",
  "certifications",
  "projects",
  "languages",
  "resume_experience",
  "resume_education",
  "resume_certifications",
  "resume_projects",
  "resume_languages",
]);

const isEmptyTalentValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length === 0 || trimmed.toLowerCase() === "null";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }

  return false;
};

const humanizeTalentField = (field: string) =>
  TALENT_DETAIL_LABELS[field] ||
  field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatTalentDateValue = (value: unknown) => {
  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return EMPTY_CELL_LABEL;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getDetailedTalentValue = (row: ProfileData, key: string) => {
  if (key === "full_name") {
    return `${row.first_name || ""} ${row.last_name || ""}`.trim();
  }

  if (key === "location") {
    const location = [row.city?.trim(), row.country?.trim()].filter(Boolean);
    return location.join(", ");
  }

  if (key === "phone") {
    const phone = row.phone_number?.trim();
    const countryCode = row.phone_country_code?.trim();

    if (!phone) {
      return "";
    }

    return countryCode ? `+${countryCode} ${phone}` : phone;
  }

  return (row as Record<string, unknown>)[key];
};

const getDetailedTalentText = (row: ProfileData, key: string) => {
  const value = getDetailedTalentValue(row, key);

  if (isEmptyTalentValue(value)) {
    return EMPTY_CELL_LABEL;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value instanceof Date) {
    return formatTalentDateValue(value);
  }

  if (
    typeof value === "string" &&
    (key.endsWith("_at") || key === "created_at" || key === "user_created_at")
  ) {
    return formatTalentDateValue(value);
  }

  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value).trim() || EMPTY_CELL_LABEL;
};

const TALENT_URL_BUTTON_LABELS: Record<string, string> = {
  image_url: "View Image",
  cv_url: "Open CV",
  linkedin: "Open LinkedIn",
  github: "Open GitHub",
  twitter: "Open X",
  stackoverflow: "Open StackOverflow",
  portfolio: "Open Portfolio",
};

const getTalentGridSortState = (
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

export default function AdminManageTalents() {
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
    () => getTalentGridSortState(searchParams),
    [searchParams],
  );

  const initialColumnFilters = useMemo<GridFilterModel>(() => {
    let items = [];
    try {
      const filters = searchParams.get("columnFilters");
      if (filters) {
        items = JSON.parse(filters);
      }
    } catch (e) {}

    const search = searchParams.get("search");
    const quickFilterValues = search ? search.split(" ") : [];

    return { items, quickFilterValues };
  }, [searchParams]);

  const [talents, setTalents] = useState<ProfileData[]>([]);
  const [totalTalents, setTotalTalents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<ProfileData | null>(null);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [editingTalent, setEditingTalent] = useState<ProfileData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const getSafeValue = (value?: string | null) =>
    value && value !== "null" ? value : undefined;


  const updateTalentQueryParams = useCallback(
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
      router.replace(nextQuery ? `/admin/talents?${nextQuery}` : "/admin/talents", {
        scroll: false,
      });
    },
    [router, searchParamsString],
  );

  const handleFilterModelChange = useCallback((model: GridFilterModel) => {
    const currentFiltersStr = searchParams.get("columnFilters");
    const currentFilters = currentFiltersStr ? JSON.parse(currentFiltersStr) : [];
    
    const currentSearch = searchParams.get("search") || "";
    const nextSearch = (model.quickFilterValues || []).join(" ");

    const updates: Record<string, string | null> = {};

    if (JSON.stringify(model.items) !== JSON.stringify(currentFilters)) {
      updates.columnFilters = model.items.length > 0 ? JSON.stringify(model.items) : null;
    }

    if (nextSearch !== currentSearch) {
      updates.search = nextSearch || null;
    }

    if (Object.keys(updates).length > 0) {
      updates.page = "1";
      updateTalentQueryParams(updates);
    }
  }, [searchParams, updateTalentQueryParams]);


  const fetchAllTalents = async () => {
    try {
      setLoading(true);

      // Build URL with filter params
      const params = new URLSearchParams(searchParamsString);
      const url = `/api/admin/talents${params.toString() ? `?${params.toString()}` : ''}`;

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

      // Inject a computed `name` field so MUI DataGrid's internal filtering and
      // sorting can resolve the "name" column (which maps field: "name") from
      // the raw DB rows that only carry first_name / last_name.
      const normalizedList = list.map((t: ProfileData) => ({
        ...t,
        name: `${t.first_name || ""} ${t.last_name || ""}`.trim(),
      }));

      setTalents(normalizedList);
      setTotalTalents(
        typeof result?.pagination?.total === "number"
          ? result.pagination.total
          : normalizedList.length,
      );

      if (
        typeof result?.pagination?.page === "number" &&
        result.pagination.page !== currentPage
      ) {
        updateTalentQueryParams({ page: String(result.pagination.page) });
      }
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

  const handleDeleteTalent = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/admin/talents/${userToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userToDelete }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete talent");
      }

      toast.success("Talent deleted successfully");
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setSelectedTalent(null);
      await fetchAllTalents();
    } catch (error) {
      console.error("Error deleting talent:", error);
      toast.error("Failed to delete talent");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveTalent = async (updatedTalent: ProfileData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/talents/${updatedTalent.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTalent),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

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

  const renderTalentActions = useCallback(
    (row: ProfileData) => {
      const hasEmail = Boolean(row.email?.trim());
      const hasLinkedIn = Boolean(row.linkedin?.trim());
      const hasUserId = Boolean(row.user_id);

      return (
        <div className="flex min-w-[164px] items-center justify-end gap-1.5 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg border-gray-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => {
              if (!hasUserId) return;
              window.open(`/admin/talent/${row.user_id}`, "_blank", "noopener,noreferrer");
            }}
            disabled={!hasUserId}
            title="View profile"
          >
            <Eye className="mr-1.5 h-4 w-4" />
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg border border-transparent text-slate-600 hover:border-gray-200 hover:bg-slate-50"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                disabled={!hasEmail}
                onClick={() => {
                  if (!hasEmail) return;
                  navigator.clipboard.writeText(row.email || "");
                  toast.success("Email copied!");
                }}
              >
                <Copy className="h-4 w-4 text-slate-500" />
                Copy email
              </DropdownMenuItem>
              {hasLinkedIn ? (
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => {
                    window.open(row.linkedin || "", "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                  Open LinkedIn
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                disabled={loading}
                onClick={() => {
                  setEditingTalent(row);
                  setShowEditModal(true);
                }}
              >
                <Pencil className="h-4 w-4 text-sky-600" />
                Edit talent
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => {
                  setSelectedUser(row);
                  setShowApprovePopup(true);
                }}
              >
                <UserCheck className="h-4 w-4 text-slate-500" />
                Manage approval & roles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                disabled={loading}
                onClick={() => {
                  setUserToDelete(row.user_id || "");
                  setSelectedTalent(row);
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete talent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    [loading],
  );

  const compactColumns: Column<ProfileData>[] = [
    ...getSharedTalentColumns(),
    {
      key: "actions",
      header: "Actions",
      width: "184px",
      render: (_value, row) => renderTalentActions(row),
    },
  ];

  const detailedColumns = useMemo<Column<ProfileData>[]>(() => {
    const dynamicKeys = new Set<string>();

    talents.forEach((talent) => {
      Object.keys(talent).forEach((key) => dynamicKeys.add(key));
    });

    const orderedKeys = [
      ...TALENT_DETAIL_PRIORITY.filter(
        (key) =>
          key === "full_name" ||
          key === "location" ||
          key === "phone" ||
          (!TALENT_TABLE_HIDDEN_FIELDS.has(key) && dynamicKeys.has(key)),
      ),
      ...Array.from(dynamicKeys)
        .filter(
          (key) =>
            !TALENT_DETAIL_PRIORITY.includes(key) &&
            !TALENT_TABLE_HIDDEN_FIELDS.has(key),
        )
        .sort((left, right) => left.localeCompare(right)),
    ];

    return [
      ...orderedKeys.map((key) => ({
        key,
        header: humanizeTalentField(key),
        width: TALENT_LONG_TEXT_FIELDS.has(key) ? "320px" : "180px",
        exportValue: (row: ProfileData) => getDetailedTalentText(row, key),
        searchValue: (row: ProfileData) => getDetailedTalentText(row, key),
        render: (_value: unknown, row: ProfileData) => {
          const rawValue = getDetailedTalentValue(row, key);
          const displayValue = getDetailedTalentText(row, key);

          if (displayValue === EMPTY_CELL_LABEL) {
            return <span className="text-sm text-slate-500">{EMPTY_CELL_LABEL}</span>;
          }

          if (typeof rawValue === "boolean") {
            return (
              <StatusPill
                status={rawValue ? "approved" : "pending"}
                label={rawValue ? "Yes" : "No"}
              />
            );
          }

          if (
            typeof rawValue === "string" &&
            key.toLowerCase().includes("status") &&
            !key.toLowerCase().includes("reason")
          ) {
            return (
              <StatusPill
                status={rawValue}
                label={rawValue.replace(/_/g, " ")}
              />
            );
          }

          if (TALENT_URL_FIELDS.has(key) && typeof rawValue === "string") {
            return (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 whitespace-nowrap"
                onClick={() => {
                  window.open(rawValue, "_blank", "noopener,noreferrer");
                }}
              >
                {TALENT_URL_BUTTON_LABELS[key] || `Open ${humanizeTalentField(key)}`}
              </Button>
            );
          }

          if (Array.isArray(rawValue) || typeof rawValue === "object") {
            return (
              <span
                className="block max-w-[14rem] truncate text-sm text-slate-700"
                title={displayValue}
              >
                {displayValue}
              </span>
            );
          }

          return (
            <span
              className="block max-w-[14rem] truncate text-sm text-slate-700"
              title={displayValue}
            >
              {displayValue}
            </span>
          );
        },
      })),
      {
        key: "actions",
        header: "Actions",
        width: "184px",
        render: (_value, row) => renderTalentActions(row),
        exportValue: () => EMPTY_CELL_LABEL,
        searchValue: () => "",
      },
    ];
  }, [renderTalentActions, talents]);

  const sortableTalentFields = new Set([
    "name",
    "user_id",
    "email",
    "phone_number",
    "location",
    "linkedin",
    "github",
    "stackoverflow",
    "twitter",
    "portfolio",
    "telegram",
    "cv_url",
    "availability_status",
    "wallet_address",
    "talent",
    "talent_status",
    "mentor",
    "recruiter",
    "approved",
    "referred_by",
    "created_at",
  ]);

  const activeColumns = compactColumns.map((column) => ({
    ...column,
    sortable: sortableTalentFields.has(column.key),
  }));

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
            {totalTalents || talents?.length || 0} talents
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
            { value: 'in_review', label: 'In Review' },
            { value: 'deferred', label: 'Deferred' },
            { value: 'rejected', label: 'Rejected' },
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
            { value: 'status', label: 'Status' },
            { value: 'name-asc', label: 'Name A-Z' },
            { value: 'name-desc', label: 'Name Z-A' },
            { value: 'email-asc', label: 'Email A-Z' },
            { value: 'email-desc', label: 'Email Z-A' },
          ],
        }}
        basePath="/admin/talents"
      />

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteTalent}
        entityType="talent"
        entityName={
          getSafeValue(selectedTalent?.email) ||
          [getSafeValue(selectedTalent?.first_name), getSafeValue(selectedTalent?.last_name)]
            .filter(Boolean)
            .join(" ") ||
          ""
        }
        entityId={userToDelete || ""}
        loading={deleteLoading}
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
                {totalTalents || talents?.length || 0} talents • search, edit roles, or approve.
              </p>
            </div>
          </div>
          <AdminDataGrid
            rows={talents}
            columns={activeColumns}
            getRowId={(row) =>
              row.user_id ||
              row.email ||
              `${row.first_name || "unknown"}-${row.last_name || "talent"}`
            }
            loading={loading}
            emptyMessage="No talents found"
            searchPlaceholder="Search by full name, email, referrer, user ID, wallet, location, or any visible field..."
            currentPage={currentPage}
            onPageChange={(page) => updateTalentQueryParams({ page: String(page) })}
            pageSize={currentPageSize}
            onPageSizeChange={(pageSize) =>
              updateTalentQueryParams({ limit: String(pageSize) })
            }
            filterMode="server"
            filterModel={initialColumnFilters}
            onFilterModelChange={handleFilterModelChange}
            totalItems={totalTalents}
            pageSizeOptions={[10, 25, 50, 100]}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={(field, direction) =>
              updateTalentQueryParams({
                sort: null,
                sortBy: field,
                sortDir: direction,
              })
            }
          />
        </div>
      </div>
      <QuickActionFAB actions={talentActions} />
    </AdminPageLayout>
  );
}
