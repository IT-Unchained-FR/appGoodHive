"use client";

export const dynamic = "force-dynamic";

import { DeleteConfirmDialog } from "@/app/components/admin/DeleteConfirmDialog";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { EditTalentModal } from "@/app/components/admin/EditTalentModal";
import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { StatusPill } from "@/app/components/admin/StatusPill";
import { ProfileData } from "@/app/talents/my-profile/page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Globe,
  Linkedin,
  Pencil,
  Send,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ApprovalPopup from "../talent-approval/components/ApprovalPopup";

const EMPTY_CELL_LABEL = "N/A";
const TALENT_VIEW_STORAGE_KEY = "admin-talents-view-mode";

type TalentViewMode = "grid" | "table";

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

const getTalentApprovalStatus = (row: ProfileData) => {
  if (row.talent_status === "approved" || row.approved) return "approved";
  if (row.talent_status === "deferred") return "deferred";
  if (row.talent_status === "rejected") return "rejected";
  if (
    row.talent_status === "pending" ||
    row.talent_status === "in_review" ||
    row.inreview
  ) {
    return "in_review";
  }
  return "in_review";
};

const renderTalentApprovalBadge = (row: ProfileData) => {
  const status = getTalentApprovalStatus(row);
  if (status === "approved") return <StatusPill status="approved" label="Approved" />;
  if (status === "deferred") return <StatusPill status="deferred" label="Deferred" />;
  if (status === "rejected") return <StatusPill status="rejected" label="Rejected" />;
  return <StatusPill status="in_review" label="In Review" />;
};

const renderBooleanStatusPill = (active: boolean, activeLabel: string, inactiveLabel: string) => (
  <span
    title={active ? activeLabel : inactiveLabel}
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
      active
        ? "bg-green-50 text-green-700 ring-1 ring-green-200"
        : "bg-gray-100 text-gray-400 ring-1 ring-gray-200"
    }`}
  >
    {active ? (
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
    )}
    {active ? activeLabel.replace(/ Yes$/, "").replace(/ No$/, "") : inactiveLabel.replace(/ Yes$/, "").replace(/ No$/, "")}
  </span>
);

const renderMentorStatusPill = (row: ProfileData) => {
  if (row.mentor === true && row.mentor_status === "approved") {
    return (
      <span title="Mentor Approved" className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200 whitespace-nowrap">
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
        Mentor
      </span>
    );
  }
  if (row.mentor === true && row.mentor_status === "pending") {
    return (
      <span title="Mentor Pending" className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200 whitespace-nowrap">
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
        Mentor
      </span>
    );
  }
  if (row.mentor === true && (row.mentor_status === "deferred" || row.mentor_status === "rejected")) {
    return (
      <span title={`Mentor ${row.mentor_status}`} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-red-200 whitespace-nowrap">
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
        Mentor
      </span>
    );
  }
  return (
    <span title="Not a mentor" className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400 ring-1 ring-gray-200 whitespace-nowrap">
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
      Mentor
    </span>
  );
};

const getReferredByLabel = (row: ProfileData) => {
  const referrerName = row.referrer_name?.trim();
  const referrerEmail = row.referrer_email?.trim();
  const referralCode = row.referred_by?.trim();

  if (referrerName && referrerEmail) {
    return `${referrerName} (${referrerEmail})`;
  }

  if (referrerName) {
    return referrerName;
  }

  if (referrerEmail) {
    return referrerEmail;
  }

  if (referralCode) {
    return referralCode;
  }

  return "–";
};

const getPhoneLabel = (row: ProfileData) => {
  const phone = row.phone_number?.trim();
  if (!phone) return "–";

  // Strip any leading + from stored country code to avoid ++XX
  const rawCode = row.phone_country_code?.trim().replace(/^\+/, "");
  if (!rawCode) return phone;

  // Avoid prepending if the phone number already starts with the country code
  const prefix = `+${rawCode}`;
  if (phone.startsWith(prefix) || phone.startsWith(rawCode)) return phone;

  return `${prefix} ${phone}`;
};

const getLocationLabel = (row: ProfileData) => {
  const location = [row.city?.trim(), row.country?.trim()].filter(Boolean);
  return location.length > 0 ? location.join(", ") : "–";
};

const getDisplayLink = (value?: string | null) => {
  if (!value) return "–";
  return value.replace(/^https?:\/\//, "");
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
  const [viewMode, setViewMode] = useState<TalentViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState(serverSearchQuery);

  const getSafeValue = (value?: string | null) =>
    value && value !== "null" ? value : undefined;

  useEffect(() => {
    const savedViewMode = window.localStorage.getItem(TALENT_VIEW_STORAGE_KEY);
    if (savedViewMode === "grid" || savedViewMode === "table") {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TALENT_VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    setSearchQuery(serverSearchQuery);
  }, [serverSearchQuery]);

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

  useEffect(() => {
    const normalizedSearch = searchQuery.trim().replace(/\s+/g, " ");
    const normalizedServerSearch = serverSearchQuery
      .trim()
      .replace(/\s+/g, " ");

    if (normalizedSearch === normalizedServerSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      updateTalentQueryParams({
        search: normalizedSearch || null,
        page: "1",
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery, serverSearchQuery, updateTalentQueryParams]);

  const fetchAllTalents = async () => {
    try {
      setLoading(true);

      // Build URL with filter params
      const params = new URLSearchParams(searchParamsString);
      const url = `/api/admin/talents${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url);

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

      setTalents(list);
      setTotalTalents(
        typeof result?.pagination?.total === "number"
          ? result.pagination.total
          : list.length,
      );
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
    (row: ProfileData) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Copy email"
          onClick={() => {
            navigator.clipboard.writeText(row.email || "");
            toast.success("Email copied!");
          }}
        >
          <Copy className="h-4 w-4 text-slate-600" />
        </Button>
        {row.linkedin ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Open LinkedIn"
            onClick={() => {
              window.open(row.linkedin || "", "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink className="h-4 w-4 text-slate-600" />
          </Button>
        ) : null}
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
            setSelectedTalent(row);
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
    [loading],
  );

  const compactColumns: Column<ProfileData>[] = [
    {
      key: "name",
      header: "Talent Name",
      width: "15%",
      sortable: true,
      exportValue: (row) =>
        `${row.first_name || ""} ${row.last_name || ""}`.trim(),
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
      key: "phone_number",
      header: "Phone",
      width: "12%",
      sortable: false,
      render: (_value, row) => (
        <span className="break-words text-sm text-slate-700">
          {getPhoneLabel(row)}
        </span>
      ),
      exportValue: (row) => getPhoneLabel(row),
    },
    {
      key: "location",
      header: "Location",
      width: "12%",
      sortable: false,
      render: (_value, row) => (
        <span className="break-words text-sm text-slate-700">
          {getLocationLabel(row)}
        </span>
      ),
      exportValue: (row) => getLocationLabel(row),
    },
    {
      key: "linkedin",
      header: "LinkedIn",
      width: "12%",
      sortable: false,
      render: (value) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-700 transition hover:text-blue-900"
          >
            <Linkedin className="h-4 w-4" />
            <span className="truncate max-w-[120px]">{getDisplayLink(value)}</span>
          </a>
        ) : (
          <span className="text-sm text-slate-500">–</span>
        ),
      exportValue: (row) => row.linkedin || "",
    },
    {
      key: "portfolio",
      header: "Portfolio",
      width: "12%",
      sortable: false,
      render: (value) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-slate-700 transition hover:text-slate-900"
          >
            <Globe className="h-4 w-4" />
            <span className="truncate max-w-[120px]">{getDisplayLink(value)}</span>
          </a>
        ) : (
          <span className="text-sm text-slate-500">–</span>
        ),
      exportValue: (row) => row.portfolio || "",
    },
    {
      key: "telegram",
      header: "Telegram",
      width: "12%",
      sortable: false,
      render: (value) =>
        value ? (
          <span className="inline-flex items-center gap-1 text-sm text-slate-700">
            <Send className="h-4 w-4" />
            <span className="truncate max-w-[120px]">{value}</span>
          </span>
        ) : (
          <span className="text-sm text-slate-500">–</span>
        ),
      exportValue: (row) => row.telegram || "",
    },
    {
      key: "github",
      header: "GitHub",
      width: "12%",
      sortable: false,
      render: (value) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-slate-700 transition hover:text-slate-900"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
            <span className="truncate max-w-[100px]">{getDisplayLink(value)}</span>
          </a>
        ) : (
          <span className="text-sm text-slate-400">–</span>
        ),
      exportValue: (row) => row.github || "",
    },
    {
      key: "stackoverflow",
      header: "StackOverflow",
      width: "12%",
      sortable: false,
      render: (value) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-orange-600 transition hover:text-orange-800"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M15 21h-10v-2h10v2zm6-11.665l-1.571-9.335-1.993.346 1.57 9.335 1.994-.346zm-7.277 6.886l-9.548-1.998-.409 1.958 9.548 1.998.409-1.958zm1.873-3.12l-8.868-4.711-.903 1.699 8.868 4.712.903-1.7zm2.938-5.782l-7.444-6.92-1.303 1.4 7.444 6.92 1.303-1.4zm-1.528 11.681h-9v2h9v-2z" /></svg>
            <span className="truncate max-w-[100px]">{getDisplayLink(value)}</span>
          </a>
        ) : (
          <span className="text-sm text-slate-400">–</span>
        ),
      exportValue: (row) => row.stackoverflow || "",
    },
    {
      key: "twitter",
      header: "Twitter / X",
      width: "12%",
      sortable: false,
      render: (value) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-slate-700 transition hover:text-slate-900"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.836L2.25 2.25h6.944l4.258 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            <span className="truncate max-w-[100px]">{getDisplayLink(value)}</span>
          </a>
        ) : (
          <span className="text-sm text-slate-400">–</span>
        ),
      exportValue: (row) => row.twitter || "",
    },
    {
      key: "cv_url",
      header: "CV",
      width: "8%",
      sortable: false,
      render: (value) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100 transition whitespace-nowrap"
          >
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            View CV
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 ring-1 ring-gray-200 whitespace-nowrap">No CV</span>
        ),
      exportValue: (row) => row.cv_url || "",
    },
    {
      key: "availability_status",
      header: "Availability",
      width: "10%",
      sortable: false,
      render: (_value, row) => {
        const status = row.availability_status || (row.availability ? "immediately" : null);
        if (!status) return <span className="text-sm text-slate-400">–</span>;
        const map: Record<string, { label: string; color: string }> = {
          immediately: { label: "Available", color: "bg-green-50 text-green-700 ring-green-200" },
          within_month: { label: "Soon", color: "bg-yellow-50 text-yellow-700 ring-yellow-200" },
          actively_looking: { label: "Looking", color: "bg-blue-50 text-blue-700 ring-blue-200" },
          open_to_opportunities: { label: "Open", color: "bg-purple-50 text-purple-700 ring-purple-200" },
          not_available: { label: "Not Available", color: "bg-gray-100 text-gray-500 ring-gray-200" },
          not_looking: { label: "Not Available", color: "bg-gray-100 text-gray-500 ring-gray-200" },
        };
        // Fallback: humanize unknown snake_case values
        const humanize = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const config = map[status] || { label: humanize(status), color: "bg-gray-100 text-gray-500 ring-gray-200" };
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 whitespace-nowrap ${config.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.color.includes("green") ? "bg-green-500" : config.color.includes("yellow") ? "bg-yellow-500" : config.color.includes("blue") ? "bg-blue-500" : config.color.includes("purple") ? "bg-purple-500" : "bg-gray-400"}`} />
            {config.label}
          </span>
        );
      },
      exportValue: (row) => row.availability_status || "",
    },
    {
      key: "referred_by",
      header: "Referred by",
      width: "16%",
      sortable: false,
      render: (_value, row) => (
        <span className="break-words text-sm text-slate-700">
          {getReferredByLabel(row)}
        </span>
      ),
      exportValue: (row) => getReferredByLabel(row),
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
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 ring-1 ring-gray-200 whitespace-nowrap">
              No wallet
            </span>
          )}
        </div>
      ),
    },
    {
      key: "talent",
      header: "Talent Status",
      width: "8%",
      sortable: true,
      render: (_value, row) =>
        renderBooleanStatusPill(Boolean(row.talent), "Talent Yes", "Talent No"),
    },
    {
      key: "talent_status",
      header: "Talent Approval",
      width: "10%",
      sortable: true,
      exportValue: (row) => {
        const status = getTalentApprovalStatus(row);
        if (status === "approved") return "Approved";
        if (status === "deferred") return "Deferred";
        if (status === "rejected") return "Rejected";
        return "In Review";
      },
      render: (_value, row) => renderTalentApprovalBadge(row),
    },
    {
      key: "mentor",
      header: "Mentor Status",
      width: "8%",
      sortable: true,
      render: (_value, row) => renderMentorStatusPill(row),
    },
    {
      key: "recruiter",
      header: "Recruiter Status",
      width: "8%",
      sortable: true,
      render: (_value, row) =>
        renderBooleanStatusPill(Boolean(row.recruiter), "Recruiter Yes", "Recruiter No"),
    },
    {
      key: "approved",
      header: "Account Status",
      width: "8%",
      sortable: true,
      render: (_value, row) =>
        renderBooleanStatusPill(Boolean(row.approved), "Approved", "Pending"),
    },
    {
      key: "created_at",
      header: "Created",
      width: "12%",
      sortable: true,
      render: (value) => {
        if (!value) return "N/A";
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      },
      exportValue: (row) => row.created_at ? new Date(row.created_at).toISOString() : '',
    },
    {
      key: "actions",
      header: "Actions",
      width: "12%",
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
        width: "240px",
        render: (_value, row) => renderTalentActions(row),
        exportValue: () => EMPTY_CELL_LABEL,
        searchValue: () => "",
      },
    ];
  }, [renderTalentActions, talents]);

  const activeColumns = (viewMode === "grid" ? compactColumns : detailedColumns).map(
    (column) => ({
      ...column,
      sortable: false,
    }),
  );

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
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span
                className={`text-sm font-medium ${
                  viewMode === "grid" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Grid view
              </span>
              <Switch
                checked={viewMode === "table"}
                onCheckedChange={(checked) =>
                  setViewMode(checked ? "table" : "grid")
                }
                aria-label="Toggle talent view mode"
              />
              <span
                className={`text-sm font-medium ${
                  viewMode === "table" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Row table view
              </span>
            </div>
          </div>
          {viewMode === "table" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Detailed table mode shows the full talent payload returned by the admin API.
              Empty values appear as {EMPTY_CELL_LABEL}, and you can scroll horizontally to inspect every column.
            </div>
          ) : null}
          <EnhancedTable
            key={viewMode}
            data={talents}
            columns={activeColumns}
            searchable={true}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            disableClientSearch
            currentPage={currentPage}
            onPageChange={(page) => updateTalentQueryParams({ page: String(page) })}
            pageSize={currentPageSize}
            onPageSizeChange={(pageSize) =>
              updateTalentQueryParams({ limit: String(pageSize), page: "1" })
            }
            totalItems={totalTalents}
            disableClientPagination
            searchPlaceholder={
              viewMode === "grid"
                ? "Search by first name, last name, full name, email, user ID, or profile links..."
                : "Search the full talent directory..."
            }
            pagination={true}
            itemsPerPage={viewMode === "grid" ? 10 : 25}
            exportable={true}
            loading={loading}
            emptyMessage="No talents found"
            pageSizeOptions={viewMode === "grid" ? [10, 25, 50] : [10, 25, 50, 100]}
            mobileCardView={viewMode === "grid"}
            renderMobileCard={
              viewMode === "grid"
                ? (talent) => (
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
                        setSelectedTalent(talent);
                        setShowDeleteConfirm(true);
                      }}
                    />
                  )
                : undefined
            }
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
          <div className="mt-1 text-xs text-gray-500">
            Referred by: {getReferredByLabel(talent)}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {renderBooleanStatusPill(Boolean(talent.talent), "Talent Yes", "Talent No")}
            {renderTalentApprovalBadge(talent)}
            {renderMentorStatusPill(talent)}
            {renderBooleanStatusPill(Boolean(talent.recruiter), "Recruiter Yes", "Recruiter No")}
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
        {renderBooleanStatusPill(Boolean(talent.approved), "Approved", "Pending")}
      </div>
      <div className="text-xs text-gray-500">
        Created: {talent.created_at ? new Date(talent.created_at).toLocaleDateString() : "N/A"}
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
