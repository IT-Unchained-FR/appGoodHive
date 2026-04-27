"use client";

/**
 * Shared talent column definitions used by both:
 * - /admin/talents (All Talents)
 * - /admin/talent-approval (Talent Approval Queue)
 *
 * Each page adds its own select + actions columns around these.
 */

import { Column } from "@/app/components/admin/EnhancedTable";
import { StatusPill } from "@/app/components/admin/StatusPill";
import { ProfileData } from "@/app/talents/my-profile/page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Globe, Linkedin, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

// ─── Empty cell badge ────────────────────────────────────────────────────────

const renderEmpty = (label = "Not set") => (
  <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-200 px-2 py-0.5 text-xs text-gray-400 whitespace-nowrap">
    {label}
  </span>
);

// ─── Helpers ────────────────────────────────────────────────────────────────

export const getTalentApprovalStatus = (row: ProfileData) => {
  if (row.talent_status === "approved" || row.approved) return "approved";
  if (row.talent_status === "deferred") return "deferred";
  if (row.talent_status === "rejected") return "rejected";
  if (row.talent_status === "pending" || row.talent_status === "in_review" || row.inreview)
    return "in_review";
  return "in_review";
};

export const renderTalentApprovalBadge = (row: ProfileData) => {
  const status = getTalentApprovalStatus(row);
  if (status === "approved") return <StatusPill status="approved" label="Approved" />;
  if (status === "deferred") return <StatusPill status="deferred" label="Deferred" />;
  if (status === "rejected") return <StatusPill status="rejected" label="Rejected" />;
  return <StatusPill status="in_review" label="In Review" />;
};

export const renderBooleanStatusPill = (active: boolean, activeLabel: string, inactiveLabel: string) => (
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
    {active
      ? activeLabel.replace(/ Yes$/, "").replace(/ No$/, "")
      : inactiveLabel.replace(/ Yes$/, "").replace(/ No$/, "")}
  </span>
);

export const renderMentorStatusPill = (row: ProfileData) => {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 whitespace-nowrap";
  const check = <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>;
  const clock = <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
  const xmark = <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;

  if (row.mentor === true && row.mentor_status === "approved")
    return <span title="Mentor Approved" className={`${base} bg-green-50 text-green-700 ring-green-200`}>{check}Mentor</span>;
  if (row.mentor === true && row.mentor_status === "pending")
    return <span title="Mentor Pending" className={`${base} bg-yellow-50 text-yellow-700 ring-yellow-200`}>{clock}Mentor</span>;
  if (row.mentor === true && (row.mentor_status === "deferred" || row.mentor_status === "rejected"))
    return <span title={`Mentor ${row.mentor_status}`} className={`${base} bg-red-50 text-red-600 ring-red-200`}>{xmark}Mentor</span>;
  return <span title="Not a mentor" className={`${base} bg-gray-100 text-gray-400 ring-gray-200`}>{xmark}Mentor</span>;
};

export const getReferredByLabel = (row: ProfileData) => {
  const name = row.referrer_name?.trim();
  const email = row.referrer_email?.trim();
  const code = row.referred_by?.trim();
  if (name && email) return `${name} (${email})`;
  if (name) return name;
  if (email) return email;
  if (code) return code;
  return null;
};

export const getPhoneLabel = (row: ProfileData) => {
  const phone = row.phone_number?.trim();
  if (!phone) return null;
  const rawCode = row.phone_country_code?.trim().replace(/^\+/, "");
  if (!rawCode) return phone;
  const prefix = `+${rawCode}`;
  if (phone.startsWith(prefix) || phone.startsWith(rawCode)) return phone;
  return `${prefix} ${phone}`;
};

export const getLocationLabel = (row: ProfileData) => {
  const parts = [row.city?.trim(), row.country?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
};

// Convert a 2-letter ISO country code to a flag emoji
// e.g. "FR" → "🇫🇷", "IN" → "🇮🇳"
export const getCountryFlag = (country?: string | null): string => {
  if (!country) return "";
  // Country codes are stored as 2-letter ISO codes (e.g. "FR", "IN") or full names
  const code = country.trim().toUpperCase();
  if (code.length === 2) {
    // Convert each letter to its regional indicator symbol
    return String.fromCodePoint(
      ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
    );
  }
  return "";
};

export const getDisplayLink = (value?: string | null) => {
  if (!value) return value;
  return value.replace(/^https?:\/\//, "");
};

// ─── Shared data columns (no select, no actions) ────────────────────────────

export function getSharedTalentColumns(): Column<ProfileData>[] {
  return [
    {
      key: "name",
      header: "Talent Name",
      width: "15%",
      sortable: true,
      // valueGetter lets MUI DataGrid resolve "name" from first_name + last_name
      // when the raw DB row has no top-level "name" field. This fixes the quick-filter
      // and client-side sorting seeing undefined for this column.
      valueGetter: (row) =>
        `${row.first_name || ""} ${row.last_name || ""}`.trim(),
      exportValue: (row) => `${row.first_name || ""} ${row.last_name || ""}`.trim(),
      render: (_value, row) => {
        const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim();
        if (!fullName) {
          return (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <span className="text-xs text-gray-400">?</span>
              </div>
              <span className="text-xs italic text-gray-400">No name set</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 shrink-0">
              {row.image_url ? (
                <Image src={row.image_url} alt={fullName} width={32} height={32} className="h-8 w-8 rounded-full" />
              ) : (
                <AvatarFallback className="text-xs">
                  {row.first_name?.[0]}{row.last_name?.[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="truncate max-w-[140px] font-medium" title={fullName}>{fullName}</span>
          </div>
        );
      },
    },
    {
      key: "user_id",
      header: "User ID",
      width: "12%",
      sortable: true,
      render: (_value, row) => row.user_id ? (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[90px] text-sm text-slate-600">
            {`${row.user_id.slice(0, 5)}…${row.user_id.slice(-5)}`}
          </span>
          <button
            title="Copy user ID"
            onClick={() => { navigator.clipboard.writeText(row.user_id || ""); toast.success("User ID copied!"); }}
            className="hover:text-gray-700"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : renderEmpty("No ID"),
    },
    {
      key: "email",
      header: "Email",
      width: "15%",
      sortable: true,
      render: (value) => {
        if (!value) return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-200 px-2 py-0.5 text-xs text-gray-400">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            No email
          </span>
        );
        return <span className="text-sm truncate">{String(value)}</span>;
      },
    },
    {
      key: "phone_number",
      header: "Phone",
      width: "14%",
      sortable: false,
      render: (_value, row) => {
        const label = getPhoneLabel(row);
        return label ? (
          <span className="block whitespace-nowrap text-sm text-slate-700" title={label}>
            {label}
          </span>
        ) : renderEmpty("No phone");
      },
      exportValue: (row) => getPhoneLabel(row) || "",
    },
    {
      key: "location",
      header: "Location",
      width: "12%",
      sortable: false,
      render: (_value, row) => {
        const label = getLocationLabel(row);
        if (!label) return renderEmpty("No location");
        const flag = getCountryFlag(row.country);
        return (
          <span className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap text-sm text-slate-700" title={label}>
            {flag && <span className="shrink-0 text-base leading-none" aria-hidden="true">{flag}</span>}
            <span className="truncate">{label}</span>
          </span>
        );
      },
      exportValue: (row) => getLocationLabel(row) || "",
    },
    {
      key: "linkedin",
      header: "LinkedIn",
      width: "12%",
      sortable: false,
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900">
          <Linkedin className="h-4 w-4" />
          <span className="truncate max-w-[100px]">{getDisplayLink(value)}</span>
        </a>
      ) : renderEmpty("Not linked"),
      exportValue: (row) => row.linkedin || "",
    },
    {
      key: "github",
      header: "GitHub",
      width: "12%",
      sortable: false,
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
          <span className="truncate max-w-[90px]">{getDisplayLink(value)}</span>
        </a>
      ) : renderEmpty("Not linked"),
      exportValue: (row) => row.github || "",
    },
    {
      key: "stackoverflow",
      header: "StackOverflow",
      width: "12%",
      sortable: false,
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M15 21h-10v-2h10v2zm6-11.665l-1.571-9.335-1.993.346 1.57 9.335 1.994-.346zm-7.277 6.886l-9.548-1.998-.409 1.958 9.548 1.998.409-1.958zm1.873-3.12l-8.868-4.711-.903 1.699 8.868 4.712.903-1.7zm2.938-5.782l-7.444-6.92-1.303 1.4 7.444 6.92 1.303-1.4zm-1.528 11.681h-9v2h9v-2z" /></svg>
          <span className="truncate max-w-[90px]">{getDisplayLink(value)}</span>
        </a>
      ) : renderEmpty("Not linked"),
      exportValue: (row) => row.stackoverflow || "",
    },
    {
      key: "twitter",
      header: "Twitter / X",
      width: "10%",
      sortable: false,
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.836L2.25 2.25h6.944l4.258 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          <span className="truncate max-w-[90px]">{getDisplayLink(value)}</span>
        </a>
      ) : renderEmpty("Not linked"),
      exportValue: (row) => row.twitter || "",
    },
    {
      key: "portfolio",
      header: "Portfolio",
      width: "12%",
      sortable: false,
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900">
          <Globe className="h-4 w-4" />
          <span className="truncate max-w-[100px]">{getDisplayLink(value)}</span>
        </a>
      ) : renderEmpty("Not linked"),
      exportValue: (row) => row.portfolio || "",
    },
    {
      key: "telegram",
      header: "Telegram",
      width: "10%",
      sortable: false,
      render: (value) => value ? (
        <span className="inline-flex items-center gap-1 text-sm text-slate-700">
          <Send className="h-4 w-4" />
          <span className="truncate max-w-[90px]">{value}</span>
        </span>
      ) : renderEmpty("Not linked"),
      exportValue: (row) => row.telegram || "",
    },
    {
      key: "cv_url",
      header: "CV",
      width: "8%",
      sortable: false,
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100 whitespace-nowrap">
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
        if (!status) return renderEmpty("Not set");
        const map: Record<string, { label: string; color: string }> = {
          immediately:           { label: "Available",    color: "bg-green-50 text-green-700 ring-green-200" },
          within_month:          { label: "Soon",         color: "bg-yellow-50 text-yellow-700 ring-yellow-200" },
          actively_looking:      { label: "Looking",      color: "bg-blue-50 text-blue-700 ring-blue-200" },
          open_to_opportunities: { label: "Open",         color: "bg-purple-50 text-purple-700 ring-purple-200" },
          not_available:         { label: "Not Available",color: "bg-gray-100 text-gray-500 ring-gray-200" },
          not_looking:           { label: "Not Available",color: "bg-gray-100 text-gray-500 ring-gray-200" },
        };
        const humanize = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const config = map[status] || { label: humanize(status), color: "bg-gray-100 text-gray-500 ring-gray-200" };
        const dotColor = config.color.includes("green") ? "bg-green-500" : config.color.includes("yellow") ? "bg-yellow-500" : config.color.includes("blue") ? "bg-blue-500" : config.color.includes("purple") ? "bg-purple-500" : "bg-gray-400";
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 whitespace-nowrap ${config.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
            {config.label}
          </span>
        );
      },
      exportValue: (row) => row.availability_status || "",
    },
    {
      key: "wallet_address",
      header: "Wallet Address",
      width: "12%",
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          {row.wallet_address ? (
            <>
              <span className="truncate max-w-[90px] text-sm">{row.wallet_address}</span>
              <button title="Copy wallet address" onClick={() => { navigator.clipboard.writeText(row.wallet_address || ""); toast.success("Wallet address copied!"); }} className="hover:text-gray-700">
                <Copy className="h-4 w-4" />
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 ring-1 ring-gray-200 whitespace-nowrap">No wallet</span>
          )}
        </div>
      ),
    },
    {
      key: "talent",
      header: "Talent",
      width: "8%",
      sortable: true,
      render: (_value, row) => renderBooleanStatusPill(Boolean(row.talent), "Talent Yes", "Talent No"),
    },
    {
      key: "talent_status",
      header: "Talent Approval",
      width: "10%",
      sortable: true,
      exportValue: (row) => {
        const s = getTalentApprovalStatus(row);
        return s === "approved" ? "Approved" : s === "deferred" ? "Deferred" : s === "rejected" ? "Rejected" : "In Review";
      },
      render: (_value, row) => renderTalentApprovalBadge(row),
    },
    {
      key: "mentor",
      header: "Mentor",
      width: "8%",
      sortable: true,
      render: (_value, row) => renderMentorStatusPill(row),
    },
    {
      key: "recruiter",
      header: "Recruiter",
      width: "8%",
      sortable: true,
      render: (_value, row) => renderBooleanStatusPill(Boolean(row.recruiter), "Recruiter Yes", "Recruiter No"),
    },
    {
      key: "approved",
      header: "Account Status",
      width: "8%",
      sortable: true,
      render: (_value, row) => renderBooleanStatusPill(Boolean(row.approved), "Approved", "Pending"),
    },
    {
      key: "referred_by",
      header: "Referred By",
      width: "14%",
      sortable: false,
      render: (_value, row) => {
        if (!row.referred_by) return renderEmpty("Direct signup");
        return (
          <div className="min-w-0">
            {row.referrer_user_id ? (
              <Link href={`/admin/talent/${row.referrer_user_id}`}>
                <p className="truncate text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline cursor-pointer">
                  {row.referrer_name || "Referral source"}
                </p>
              </Link>
            ) : (
              <p className="truncate text-sm font-medium text-slate-900">
                {row.referrer_name || "Referral source"}
              </p>
            )}
            <p className="truncate text-xs text-slate-500">Code: {row.referred_by}</p>
          </div>
        );
      },
      exportValue: (row) => getReferredByLabel(row) || "",
    },
    {
      key: "created_at",
      header: "Created",
      width: "10%",
      sortable: true,
      render: (value, row) => {
        const d = row.user_created_at || value;
        return d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : renderEmpty("Unknown");
      },
      exportValue: (row) => {
        const d = row.user_created_at || row.created_at;
        return d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
      },
    },
  ];
}
