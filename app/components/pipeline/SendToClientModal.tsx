"use client";

import { useState } from "react";
import {
  Send, X, Sparkles, Loader2, AlertCircle, Copy, Check, Mail,
} from "lucide-react";
import { PipelineAvatar } from "./PipelineAvatar";
import type { PipelineEntry } from "./pipeline-types";

export function SendToClientModal({
  entry,
  onClose,
}: {
  entry: PipelineEntry;
  onClose: () => void;
}) {
  const [jobContext, setJobContext] = useState("");
  const [anonymize, setAnonymize] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/recruiter/client-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_name: entry.talent_name,
          talent_title: entry.talent_title,
          talent_skills: entry.talent_skills,
          talent_bio: entry.talent_bio,
          talent_experience: entry.talent_experience,
          talent_min_rate: entry.talent_min_rate,
          talent_max_rate: entry.talent_max_rate,
          talent_availability: entry.talent_availability,
          notes: entry.notes,
          anonymize,
          jobContext: jobContext.trim() || undefined,
        }),
      });
      const json = await res.json() as { success: boolean; summary?: string; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to generate summary");
      setSummary(json.summary ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEmailDraft = () => {
    if (!summary) return;
    const subject = encodeURIComponent(
      `Candidate Introduction${entry.talent_title ? ` — ${entry.talent_title}` : ""}`
    );
    const body = encodeURIComponent(summary);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(15,23,42,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Send className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Send to Client</h2>
              <p className="text-xs text-slate-400">AI-generated professional summary</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Candidate preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <PipelineAvatar src={entry.talent_image} name={entry.talent_name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{entry.talent_name ?? "Unknown"}</p>
              {entry.talent_title && (
                <p className="text-xs text-slate-500 truncate">{entry.talent_title}</p>
              )}
              {(entry.talent_min_rate || entry.talent_max_rate) && (
                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                  {entry.talent_min_rate && entry.talent_max_rate
                    ? `$${entry.talent_min_rate}–$${entry.talent_max_rate}/hr`
                    : entry.talent_min_rate
                      ? `from $${entry.talent_min_rate}/hr`
                      : `up to $${entry.talent_max_rate}/hr`}
                </p>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Role context (optional)
              </label>
              <input
                type="text"
                value={jobContext}
                onChange={(e) => setJobContext(e.target.value)}
                placeholder="e.g. Senior React developer for a fintech startup…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none placeholder:text-slate-300"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setAnonymize((v) => !v)}
                className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${anonymize ? "bg-amber-500" : "bg-slate-200"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${
                    anonymize ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Anonymize candidate</p>
                <p className="text-xs text-slate-400">Removes name — useful for initial client outreach</p>
              </div>
            </label>
          </div>

          {/* Generate button */}
          <button
            onClick={() => void generate()}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 transition-all shadow-sm"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><Sparkles className="w-4 h-4" /> {summary ? "Regenerate" : "Generate Summary"}</>}
          </button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Generated summary */}
          {summary && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">AI Summary</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => void copyToClipboard()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 transition"
                >
                  {copied
                    ? <><Check className="w-4 h-4 text-emerald-500" /> Copied!</>
                    : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
                <button
                  onClick={openEmailDraft}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 transition"
                >
                  <Mail className="w-4 h-4" />
                  Open in Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
