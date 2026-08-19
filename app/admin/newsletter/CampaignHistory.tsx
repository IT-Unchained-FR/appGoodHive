"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/app/components/admin/StatusPill";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Campaign {
  id: string;
  subject: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: "sending" | "sent" | "failed";
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

interface CampaignRecipient {
  user_id: string;
  email: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  sent_at: string | null;
}

function statusPillProps(status: Campaign["status"]) {
  if (status === "sent") return { status: "approved", label: "sent" };
  if (status === "failed") return { status: "rejected", label: "failed" };
  return { status: "pending", label: "sending" };
}

export function CampaignHistory() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CampaignRecipient[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/newsletter/campaigns?limit=50", {
          headers: { "Cache-Control": "no-store, max-age=0" },
        });
        const data = await response.json();
        if (response.ok) setCampaigns(data.data);
      } catch (error) {
        console.error("Failed to load campaign history:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/newsletter/campaigns/${id}`, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
      const data = await response.json();
      if (response.ok) setDetail(data.data.recipients);
    } catch (error) {
      console.error("Failed to load campaign detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
        Loading campaigns...
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
        No newsletters sent yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => {
        const failedRecipients = detail.filter((recipient) => recipient.status === "failed");

        return (
          <div key={campaign.id} className="rounded-2xl border border-gray-100 bg-white">
            <button
              type="button"
              onClick={() => toggleExpand(campaign.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{campaign.subject}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {new Date(campaign.created_at).toLocaleString()} · {campaign.created_by}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right text-xs text-gray-500">
                  <p className="font-medium text-gray-900">
                    {campaign.recipient_count.toLocaleString()} recipients
                  </p>
                  <p>
                    {campaign.sent_count.toLocaleString()} sent
                    {campaign.failed_count > 0
                      ? `, ${campaign.failed_count.toLocaleString()} failed`
                      : ""}
                  </p>
                </div>
                <StatusPill {...statusPillProps(campaign.status)} />
                {expandedId === campaign.id ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedId === campaign.id ? (
              <div className="border-t border-gray-100 px-5 py-4">
                {detailLoading ? (
                  <p className="text-sm text-gray-400">Loading recipients...</p>
                ) : failedRecipients.length === 0 ? (
                  <p className="text-sm text-gray-400">Every recipient received this email.</p>
                ) : (
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {failedRecipients.map((recipient) => (
                      <div
                        key={recipient.user_id}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="truncate text-gray-700">{recipient.email}</span>
                        <span className="shrink-0 text-red-500">{recipient.error || "Failed"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
