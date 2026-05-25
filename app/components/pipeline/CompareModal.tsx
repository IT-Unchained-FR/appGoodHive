"use client";

import { useState, useRef } from "react";
import {
  GitCompare, X, CheckCircle2, Sparkles, Loader2,
  DollarSign, Clock, AlertCircle,
} from "lucide-react";
import { PipelineAvatar } from "./PipelineAvatar";
import { AnalysisText } from "./AnalysisText";
import { STAGES, type PipelineEntry, type Stage } from "./pipeline-types";

function formatRate(min: number | null, max: number | null): string | null {
  if (min && max) return `$${min}–$${max}/hr`;
  if (min) return `from $${min}/hr`;
  if (max) return `up to $${max}/hr`;
  return null;
}

export function CompareModal({
  entries,
  onClose,
}: {
  entries: PipelineEntry[];
  onClose: () => void;
}) {
  const [jobContext, setJobContext] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // Shared skills across all candidates
  const skillSets = entries.map(
    (e) => new Set((e.talent_skills ?? "").split(",").map((s) => s.trim()).filter(Boolean))
  );
  const sharedSkills =
    skillSets.length > 0
      ? [...skillSets[0]].filter((s) => skillSets.every((set) => set.has(s)))
      : [];

  const stageMeta = (stage: Stage) => STAGES.find((s) => s.key === stage);

  const runAiCompare = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiAnalysis(null);
    try {
      const candidates = entries.map((e) => ({
        name: e.talent_name ?? "Unknown",
        title: e.talent_title,
        skills: e.talent_skills,
        bio: e.talent_bio,
        stage: e.stage,
        experience: e.talent_experience,
        minRate: e.talent_min_rate,
        maxRate: e.talent_max_rate,
        availability: e.talent_availability,
        notes: e.notes,
      }));
      const res = await fetch("/api/pipeline/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates, jobContext: jobContext.trim() || undefined }),
      });
      const json = await res.json() as { success: boolean; analysis?: string; error?: string };
      if (!json.success) throw new Error(json.error ?? "AI comparison failed");
      setAiAnalysis(json.analysis ?? "");
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(15,23,42,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <GitCompare className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Candidate Comparison</h2>
              <p className="text-xs text-slate-400">Side-by-side evaluation · {entries.length} candidates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sharedSkills.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">
                  {sharedSkills.length} shared skill{sharedSkills.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* Candidate columns */}
          <div
            className="grid divide-x divide-slate-100"
            style={{ gridTemplateColumns: `repeat(${entries.length}, 1fr)` }}
          >
            {entries.map((entry) => {
              const skills = (entry.talent_skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
              const stage = stageMeta(entry.stage);
              const rate = formatRate(entry.talent_min_rate, entry.talent_max_rate);

              return (
                <div key={entry.id} className="p-5 space-y-4 min-w-0">

                  {/* Avatar + name + stage */}
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-amber-100 flex items-center justify-center text-amber-700 text-2xl font-bold shadow-md">
                      {entry.talent_image
                        ? (
                          <img
                            src={entry.talent_image}
                            alt={entry.talent_name ?? ""}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const el = e.currentTarget;
                              el.style.display = "none";
                              const parent = el.parentElement;
                              if (parent) parent.textContent = entry.talent_name?.[0]?.toUpperCase() ?? "T";
                            }}
                          />
                        )
                        : (entry.talent_name?.[0]?.toUpperCase() ?? "T")}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{entry.talent_name ?? "Unknown"}</p>
                      {entry.talent_title && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{entry.talent_title}</p>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${stage?.bg ?? "bg-slate-100 text-slate-600"}`}>
                      {stage?.label ?? entry.stage}
                    </span>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Rate + availability */}
                  {(rate || entry.talent_availability) && (
                    <>
                      <div className="space-y-1.5">
                        {rate && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="font-medium">{rate}</span>
                          </div>
                        )}
                        {entry.talent_availability && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="capitalize">{entry.talent_availability}</span>
                          </div>
                        )}
                      </div>
                      <div className="h-px bg-slate-100" />
                    </>
                  )}

                  {/* Skills */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {skills.length > 0
                        ? skills.map((s) => (
                          <span
                            key={s}
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              sharedSkills.includes(s)
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {s}
                          </span>
                        ))
                        : <span className="text-xs text-slate-400 italic">None listed</span>}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Bio */}
                  {entry.talent_bio && (
                    <>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">About</p>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 bg-slate-50 rounded-xl px-3 py-2.5">
                          {entry.talent_bio}
                        </p>
                      </div>
                      <div className="h-px bg-slate-100" />
                    </>
                  )}

                  {/* Notes */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Notes</p>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl px-3 py-2.5 min-h-[48px]">
                      {entry.notes ? entry.notes : <span className="text-slate-300 italic">No notes added</span>}
                    </p>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Timeline */}
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Added</span>
                      <span className="font-medium text-slate-700">
                        {entry.created_at
                          ? new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Updated</span>
                      <span className="font-medium text-slate-700">
                        {entry.updated_at
                          ? new Date(entry.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* View profile */}
                  <a
                    href={`/talents/${entry.talent_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-300 transition"
                  >
                    View Profile
                  </a>
                </div>
              );
            })}
          </div>

          {/* Shared skills footer */}
          {sharedSkills.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-3 bg-amber-50 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Shared skills:</span>
              {sharedSkills.map((s) => (
                <span key={s} className="text-[11px] font-semibold bg-white border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* AI Compare section */}
          <div className="border-t border-slate-100 px-6 py-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-bold text-slate-900">AI Analysis</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 uppercase tracking-wide">
                Powered by Gemini
              </span>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Job context (optional)
              </label>
              <input
                type="text"
                value={jobContext}
                onChange={(e) => setJobContext(e.target.value)}
                placeholder="e.g. Senior React developer for a fintech startup…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none placeholder:text-slate-300"
              />
            </div>

            <button
              onClick={() => void runAiCompare()}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 transition-all shadow-sm"
            >
              {aiLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                : <><Sparkles className="w-4 h-4" /> {aiAnalysis ? "Re-analyze" : "Compare with AI"}</>}
            </button>

            {aiError && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {aiError}
              </div>
            )}

            {aiAnalysis && (
              <div ref={analysisRef} className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 space-y-1">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">AI Recommendation</span>
                </div>
                <AnalysisText text={aiAnalysis} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
