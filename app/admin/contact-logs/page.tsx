"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { ExternalLink, Filter } from "lucide-react";

interface ContactLog {
  id: string;
  actor_type: string;
  contact_type: string;
  link_type: string | null;
  link_url: string | null;
  source_page: string | null;
  company_user_id: string;
  talent_user_id: string;
  company_name: string;
  talent_name: string;
  job_title: string | null;
  created_at: string;
}

const CONTACT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "link_click", label: "Link Click" },
  { value: "direct", label: "Direct" },
  { value: "job_request", label: "Job Request" },
];

const LINK_TYPE_LABELS: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  twitter: "Twitter",
  portfolio: "Portfolio",
  website: "Website",
};

export default function AdminContactLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [contactTypeFilter, setContactTypeFilter] = useState("link_click");

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (contactTypeFilter) params.set("contact_type", contactTypeFilter);
        const res = await fetch(`/api/admin/contact-logs?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
          setTotal(data.total);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLogs();
  }, [contactTypeFilter, router]);

  return (
    <AdminPageLayout
      title="Contact Logs"
      subtitle="Auditable record of all contact events and external link clicks between companies and talents."
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filter by type:</span>
          {CONTACT_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setContactTypeFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                contactTypeFilter === opt.value
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-500">{total} total</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left">Target</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Link</th>
                <th className="px-4 py-3 text-left">Source Page</th>
                <th className="px-4 py-3 text-left">Job</th>
                <th className="px-4 py-3 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {log.actor_type === "company" ? log.company_name : log.talent_name}
                      </div>
                      <div className="text-xs capitalize text-slate-400">{log.actor_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {log.actor_type === "company" ? log.talent_name : log.company_name}
                      </div>
                      <div className="text-xs capitalize text-slate-400">
                        {log.actor_type === "company" ? "talent" : "company"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        log.contact_type === "link_click"
                          ? "bg-amber-100 text-amber-800"
                          : log.contact_type === "direct"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {log.contact_type === "link_click"
                          ? `Link: ${LINK_TYPE_LABELS[log.link_type ?? ""] ?? log.link_type}`
                          : log.contact_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.link_url ? (
                        <a
                          href={log.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-[180px] items-center gap-1 truncate text-amber-700 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{log.link_url.replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.source_page ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.job_title ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(log.created_at).toLocaleString("en-US", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageLayout>
  );
}
