"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import "./newsletter-quill.css";
import toast from "react-hot-toast";
import { Mail, ShieldCheck } from "lucide-react";
import type { GridFilterModel, GridRowId, GridRowSelectionModel } from "@mui/x-data-grid";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { AdminDataGrid } from "@/app/components/admin/AdminDataGrid";
import { Column } from "@/app/components/admin/EnhancedTable";
import { StatusPill } from "@/app/components/admin/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CampaignHistory } from "./CampaignHistory";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const quillModules = {
  toolbar: [
    ["bold", "italic", "link"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["image"],
    ["clean"],
  ],
};

type Segment = "all" | "talent" | "company" | "both" | "code_of_hive";

const SEGMENT_OPTIONS: { value: Segment; label: string }[] = [
  { value: "all", label: "All users" },
  { value: "talent", label: "Talents only" },
  { value: "company", label: "Companies only" },
  { value: "both", label: "Talent + company" },
  { value: "code_of_hive", label: "Code of the Hive · signed" },
];

interface Recipient {
  user_id: string;
  email: string | null;
  name: string;
  is_talent: boolean;
  is_company: boolean;
  talent_approved: boolean;
  company_approved: boolean;
  code_of_hive_signed: boolean;
  created_at: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function typeLabel(row: Recipient) {
  if (row.is_talent && row.is_company) return "Talent + company";
  return row.is_company ? "Company" : "Talent";
}

export default function NewsletterPage() {
  const [tab, setTab] = useState<"compose" | "history">("compose");

  const [segment, setSegment] = useState<Segment>("all");
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const search = (filterModel.quickFilterValues || []).join(" ");

  const [rows, setRows] = useState<Recipient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const resetSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAllMatching(false);
    setExcludedIds(new Set());
  }, []);

  useEffect(() => {
    setPage(1);
    resetSelection();
  }, [segment, approvedOnly, search, resetSelection]);

  const fetchRecipients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        segment,
        approvedOnly: String(approvedOnly),
        search,
        page: String(page),
        limit: String(pageSize),
      });
      const response = await fetch(`/api/admin/newsletter/recipients?${params.toString()}`, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to load recipients");
        return;
      }

      setRows(data.data);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch newsletter recipients:", error);
      toast.error("Failed to load recipients");
    } finally {
      setLoading(false);
    }
  }, [segment, approvedOnly, search, page, pageSize]);

  useEffect(() => {
    if (tab === "compose") {
      fetchRecipients();
    }
  }, [tab, fetchRecipients]);

  const rowSelectionModel = useMemo<GridRowSelectionModel>(() => {
    if (selectAllMatching) {
      const ids = rows.filter((row) => !excludedIds.has(row.user_id)).map((row) => row.user_id);
      return { type: "include", ids: new Set<GridRowId>(ids) };
    }
    return { type: "include", ids: new Set<GridRowId>(selectedIds) };
  }, [selectAllMatching, excludedIds, selectedIds, rows]);

  const handleSelectionChange = (model: GridRowSelectionModel) => {
    const incomingIds = new Set(Array.from(model.ids, (id) => String(id)));

    if (selectAllMatching) {
      const nextExcluded = new Set(excludedIds);
      rows.forEach((row) => {
        if (incomingIds.has(row.user_id)) {
          nextExcluded.delete(row.user_id);
        } else {
          nextExcluded.add(row.user_id);
        }
      });
      setExcludedIds(nextExcluded);
    } else {
      setSelectedIds(incomingIds);
    }
  };

  const selectedCount = selectAllMatching
    ? Math.max(total - excludedIds.size, 0)
    : selectedIds.size;

  const columns: Column<Recipient>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Recipient",
        exportValue: (row) => row.name,
        valueGetter: (row) => row.name,
        render: (_value, row) => (
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                row.is_company ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-700",
              )}
            >
              {getInitials(row.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{row.name}</p>
              <p className="truncate text-xs text-gray-400">{row.email || "No email on file"}</p>
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        valueGetter: (row) => typeLabel(row),
        render: (_value, row) => (
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
              row.is_talent && row.is_company
                ? "bg-gray-100 text-gray-700"
                : row.is_company
                  ? "bg-purple-50 text-purple-700"
                  : "bg-blue-50 text-blue-700",
            )}
          >
            {typeLabel(row)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        valueGetter: (row) => (row.talent_approved || row.company_approved ? "approved" : "pending"),
        render: (_value, row) => (
          <StatusPill status={row.talent_approved || row.company_approved ? "approved" : "pending"} />
        ),
      },
      {
        key: "code_of_hive_signed",
        header: "Hive",
        valueGetter: (row) => row.code_of_hive_signed,
        render: (_value, row) =>
          row.code_of_hive_signed ? (
            <ShieldCheck className="h-4 w-4 text-amber-500" aria-label="Signed the Code of the Hive" />
          ) : (
            <span className="text-gray-300">—</span>
          ),
      },
    ],
    [],
  );

  const handleSendClick = () => {
    if (!subject.trim()) {
      toast.error("Add a subject line");
      return;
    }

    const plainText = bodyHtml.replace(/<[^>]*>/g, "").trim();
    if (!plainText) {
      toast.error("Write a message before sending");
      return;
    }

    if (selectedCount === 0) {
      toast.error("Select at least one recipient");
      return;
    }

    setConfirming(true);
  };

  const closeCompose = (open: boolean) => {
    setComposeOpen(open);
    if (!open) setConfirming(false);
  };

  const confirmSend = async () => {
    try {
      setSending(true);
      const audience = selectAllMatching
        ? {
            mode: "filter" as const,
            segment,
            approvedOnly,
            search,
            excludedIds: Array.from(excludedIds),
          }
        : { mode: "ids" as const, userIds: Array.from(selectedIds) };

      const response = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, bodyHtml, audience }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to send newsletter");
        return;
      }

      toast.success(
        `Sent to ${data.data.sentCount} of ${data.data.recipientCount} recipients` +
          (data.data.failedCount > 0 ? ` (${data.data.failedCount} failed)` : ""),
      );
      setSubject("");
      setBodyHtml("");
      resetSelection();
      setConfirming(false);
      setComposeOpen(false);
      setTab("history");
    } catch (error) {
      console.error("Failed to send newsletter:", error);
      toast.error("Failed to send newsletter");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminPageLayout
      title="Newsletter"
      subtitle="Send updates to talents and companies."
      breadcrumbLabels={{ newsletter: "Newsletter" }}
      actions={
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(["compose", "history"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                tab === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      }
    >
      {tab === "history" ? (
        <CampaignHistory />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4">
            <Select value={segment} onValueChange={(value) => setSegment(value as Segment)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEGMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Switch checked={approvedOnly} onCheckedChange={setApprovedOnly} />
              Approved only
            </label>

            <Button
              onClick={() => setComposeOpen(true)}
              className="ml-auto bg-[#f0b429] text-gray-900 hover:bg-[#dba321]"
            >
              <Mail className="mr-2 h-4 w-4" />
              Compose newsletter
            </Button>
          </div>

          {selectedCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm">
              <span className="font-medium text-amber-900">
                {selectedCount.toLocaleString()} selected
                {selectAllMatching ? " (matching current filter)" : ""}
              </span>
              <div className="flex items-center gap-3">
                {!selectAllMatching && total > rows.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectAllMatching(true);
                      setExcludedIds(new Set());
                    }}
                    className="font-medium text-amber-700 underline-offset-2 hover:underline"
                  >
                    Select all {total.toLocaleString()} matching
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={resetSelection}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : null}

          <AdminDataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.user_id}
            exportFileName="newsletter-recipients"
            loading={loading}
            emptyMessage="No users match this filter"
            currentPage={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setPage(1);
            }}
            totalItems={total}
            pageSizeOptions={[10, 25, 50]}
            paginationMode="server"
            filterMode="server"
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
            disableColumnFilter
            checkboxSelection
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={handleSelectionChange}
          />
        </div>
      )}

      <Dialog open={composeOpen} onOpenChange={closeCompose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {confirming ? (
            <>
              <DialogTitle>Send this newsletter?</DialogTitle>
              <p className="text-sm text-gray-600">
                This will email <strong>{selectedCount.toLocaleString()}</strong> recipient
                {selectedCount === 1 ? "" : "s"} with the subject &ldquo;{subject}&rdquo;. This
                can&apos;t be undone.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setConfirming(false)} disabled={sending}>
                  Back
                </Button>
                <Button
                  onClick={confirmSend}
                  disabled={sending}
                  className="bg-[#f0b429] text-gray-900 hover:bg-[#dba321]"
                >
                  {sending ? "Sending..." : "Send now"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogTitle>New newsletter</DialogTitle>
              <div className="space-y-4">
                <Input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject line"
                />
                <div id="newsletter-compose-editor" className="overflow-hidden rounded-lg">
                  <ReactQuill
                    theme="snow"
                    modules={quillModules}
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    placeholder="Write your update..."
                  />
                </div>

                <div className="space-y-1 border-t border-gray-100 pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recipients</span>
                    <span className="font-medium text-gray-900">
                      {selectedCount.toLocaleString()} people
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Mail className="h-3.5 w-3.5" />
                    Unsubscribe link included automatically.
                  </p>
                </div>

                <Button
                  onClick={handleSendClick}
                  disabled={sending}
                  className="w-full bg-[#f0b429] text-gray-900 hover:bg-[#dba321]"
                >
                  Send to {selectedCount.toLocaleString()} people
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
