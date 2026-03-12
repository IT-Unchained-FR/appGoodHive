"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import toast from "react-hot-toast";

interface SaveToPipelineButtonProps {
  talentId: string;
  jobId?: string;
  compact?: boolean;
}

export function SaveToPipelineButton({ talentId, jobId, compact = false }: SaveToPipelineButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (saved || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talentId, jobId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (res.status === 409) {
          setSaved(true);
          toast("Already in your pipeline", { icon: "ℹ️" });
          return;
        }
        if (res.status === 401) {
          toast.error("Log in as a company to save talents");
          return;
        }
        throw new Error(json.error ?? "Failed");
      }
      setSaved(true);
      toast.success("Saved to pipeline!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={loading || saved}
        title={saved ? "Saved to pipeline" : "Save to pipeline"}
        className={`p-1.5 rounded-full transition ${saved ? "text-amber-600" : "text-slate-400 hover:text-amber-600"}`}
      >
        {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleSave()}
      disabled={loading || saved}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        saved
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-slate-300 text-slate-700 hover:border-amber-400 hover:text-amber-700"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      {loading ? "Saving..." : saved ? "Saved to Pipeline" : "Save to Pipeline"}
    </button>
  );
}
