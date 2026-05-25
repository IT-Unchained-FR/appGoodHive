"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserPlus,
  X,
} from "lucide-react";

import { AvailabilityBadge } from "@/app/components/AvailabilityBadge";
import { useAuth } from "@/app/contexts/AuthContext";
import { formatRateRange } from "@/app/utils/format-rate-range";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TopTalent {
  userId: string;
  firstName: string;
  lastName: string;
  title: string;
  description: string;
  skills: string[];
  city: string | null;
  country: string | null;
  imageUrl: string | null;
  minRate: number | null;
  maxRate: number | null;
  currency: string;
  availabilityStatus: string;
  lastActive: string | null;
  score: number | null;
  reasons: string[];
  gaps: string[];
  unavailable: boolean;
}

interface WatchlistData {
  description: string;
  last_run_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STALE_MS = 22 * 60 * 60 * 1000; // 22 hours
const MIN_LEN = 50;
const MAX_LEN = 5000;

function getDisplayName(t: TopTalent) {
  return [t.firstName, t.lastName].filter(Boolean).join(" ").trim() || "GoodHive Talent";
}

function getLocationLabel(t: TopTalent) {
  return [t.city, t.country].filter(Boolean).join(", ") || "Remote-ready";
}

function truncateText(text: string, max: number) {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain;
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getScoreClasses(score: number | null) {
  if (score === null) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (score >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-orange-50 text-orange-700 ring-orange-200";
}

function getScoreBarClass(score: number | null) {
  if (score === null) return "from-slate-300 via-slate-200 to-slate-100";
  if (score >= 80) return "from-emerald-500 via-teal-400 to-cyan-300";
  if (score >= 60) return "from-amber-500 via-orange-400 to-yellow-300";
  return "from-orange-500 via-amber-400 to-yellow-200";
}

// ─── Talent Result Card ───────────────────────────────────────────────────────

function TalentResultCard({
  talent,
  rank,
  onAddToPipeline,
  addingId,
  addedIds,
}: {
  talent: TopTalent;
  rank: number;
  onAddToPipeline: (talent: TopTalent) => void;
  addingId: string | null;
  addedIds: Set<string>;
}) {
  const isHero = rank === 1;
  const rateLabel = formatRateRange({ minRate: talent.minRate ?? undefined, maxRate: talent.maxRate ?? undefined });
  const locationLabel = getLocationLabel(talent);
  const visibleSkills = talent.skills.slice(0, isHero ? 4 : 3);
  const hiddenCount = Math.max(talent.skills.length - visibleSkills.length, 0);
  const description = truncateText(talent.description, isHero ? 200 : 160) || "No profile summary.";
  const isAdding = addingId === talent.userId;
  const isAdded = addedIds.has(talent.userId);

  return (
    <div
      className={`group relative flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-0.5 ${
        isHero
          ? "rounded-[32px] border-2 border-amber-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(255,247,215,0.99)_100%)] p-6 ring-4 ring-amber-100"
          : "rounded-[28px] border border-amber-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,251,235,0.98)_100%)] p-5"
      }`}
    >
      {/* Background glow */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_58%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_46%)] opacity-90 ${isHero ? "h-36" : "h-28"}`} />

      {isHero && (
        <div className="relative mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
            <Trophy className="h-3.5 w-3.5" /> Best Match
          </span>
        </div>
      )}

      <div className="relative flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`relative shrink-0 overflow-hidden border border-white/80 bg-amber-100 shadow-[0_12px_30px_rgba(245,158,11,0.18)] ring-1 ring-amber-100/80 ${isHero ? "h-16 w-16 rounded-[20px]" : "h-14 w-14 rounded-2xl"}`}>
              <Image
                src={talent.imageUrl || "/img/client-bee.png"}
                alt={getDisplayName(talent)}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className={`truncate font-semibold text-slate-950 ${isHero ? "text-lg" : "text-base"}`}>
                {getDisplayName(talent)}
              </p>
              <p className="line-clamp-2 text-sm leading-5 text-slate-500">{talent.title || "Talent"}</p>
            </div>
          </div>
          {!isHero && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200/70 bg-white/85 text-sm font-bold text-amber-700 shadow-sm">
              {rank}
            </span>
          )}
        </div>

        {/* Score card */}
        <div className="mt-4 rounded-[22px] border border-white/70 bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold ring-1 ${getScoreClasses(talent.score)} ${isHero ? "text-sm" : "text-xs"}`}>
              <Star className={`shrink-0 ${isHero ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
              {talent.score === null ? "No score" : `${talent.score}% match`}
            </span>
            <span className="truncate text-xs font-medium text-slate-500">{locationLabel}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getScoreBarClass(talent.score)}`}
              style={{ width: `${Math.min(Math.max(talent.score ?? 18, 12), 100)}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AvailabilityBadge status={talent.availabilityStatus} />
          </div>
        </div>

        {/* Bio */}
        <p className={`mt-4 overflow-hidden break-words text-sm leading-6 text-slate-600 ${isHero ? "line-clamp-4" : "line-clamp-3"}`}>
          {description}
        </p>

        {/* Skills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleSkills.map((skill) => (
            <span key={skill} className="truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {skill}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              +{hiddenCount} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Rate</p>
            <p className="truncate text-sm font-semibold text-slate-800">
              {rateLabel ? `${talent.currency} ${rateLabel}/hr` : locationLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/talents/${talent.userId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition"
            >
              View <ArrowRight className="h-3 w-3" />
            </a>
            <button
              type="button"
              onClick={() => onAddToPipeline(talent)}
              disabled={isAdding || isAdded}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition ${
                isAdded
                  ? "bg-emerald-500 cursor-default"
                  : "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-60"
              }`}
            >
              {isAdding ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Adding…</>
              ) : isAdded ? (
                <><CheckCircle2 className="h-3 w-3" /> Added</>
              ) : (
                <><UserPlus className="h-3 w-3" /> Pipeline</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [watchlist, setWatchlist] = useState<WatchlistData | null>(null);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const [results, setResults] = useState<TopTalent[] | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const autoRanRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load watchlist on mount ──────────────────────────────────────────────
  const runSearch = useCallback(async (description: string, silent = false) => {
    setRunning(true);
    setRunError(null);
    try {
      const res = await fetch("/api/recruiter/top-talents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: description }),
      });
      const json = await res.json() as { success: boolean; data?: { candidates: TopTalent[] }; error?: string };

      if (!json.success || !json.data) {
        if (!silent) setRunError(json.error ?? "Search failed — please try again.");
        return false;
      }

      setResults(json.data.candidates);
      // Stamp last_run_at
      await fetch("/api/recruiter/watchlist", { method: "PATCH" });
      setWatchlist((prev) => prev ? { ...prev, last_run_at: new Date().toISOString() } : prev);
      if (!silent) toast.success("Talent feed refreshed ✓");
      return true;
    } catch {
      if (!silent) setRunError("Something went wrong. Please try again.");
      return false;
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    fetch("/api/recruiter/watchlist")
      .then((r) => r.json())
      .then((res: { success: boolean; data?: WatchlistData }) => {
        if (res.success && res.data?.description) {
          setWatchlist(res.data);
          setDraft(res.data.description);
          // Auto-run if stale
          const lastRun = res.data.last_run_at ? new Date(res.data.last_run_at).getTime() : 0;
          if (!autoRanRef.current && Date.now() - lastRun > STALE_MS) {
            autoRanRef.current = true;
            void runSearch(res.data.description, true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingWatchlist(false));
  }, [isAuthenticated, isAuthLoading, runSearch]);

  // ── Save description ─────────────────────────────────────────────────────
  const saveDescription = async () => {
    if (draft.trim().length < MIN_LEN) {
      toast.error(`Description must be at least ${MIN_LEN} characters.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/recruiter/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: draft.trim() }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Save failed");
      setWatchlist((prev) => ({ description: draft.trim(), last_run_at: prev?.last_run_at ?? null }));
      setIsEditing(false);
      toast.success("Watchlist saved ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Add to pipeline ──────────────────────────────────────────────────────
  const addToPipeline = async (talent: TopTalent) => {
    setAddingId(talent.userId);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talentId: talent.userId, stage: "shortlisted" }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success && !json.error?.includes("already")) throw new Error(json.error);
      setAddedIds((prev) => new Set(prev).add(talent.userId));
      toast.success(`${getDisplayName(talent)} added to pipeline ✓`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to pipeline");
    } finally {
      setAddingId(null);
    }
  };

  const charsLeft = MAX_LEN - draft.length;
  const isStale = watchlist?.last_run_at
    ? Date.now() - new Date(watchlist.last_run_at).getTime() > STALE_MS
    : true;

  // ── Loading / auth guards ────────────────────────────────────────────────
  if (isAuthLoading || loadingWatchlist) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Recruiter Dashboard</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5 flex items-center gap-2">
              <Target className="w-6 h-6 text-amber-500" />
              Daily Talent Feed
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Save a talent profile and run AI matching whenever you need fresh candidates.
            </p>
          </div>

          {watchlist && (
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {watchlist.last_run_at && (
                <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold ring-1 ${
                  isStale
                    ? "bg-amber-50 text-amber-700 ring-amber-200"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isStale ? "bg-amber-400" : "bg-emerald-500"}`} />
                  {isStale ? "Stale" : `Refreshed ${formatRelativeTime(watchlist.last_run_at)}`}
                </span>
              )}
              <button
                onClick={() => void runSearch(watchlist.description)}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition shadow-sm"
              >
                {running
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
                  : <><RefreshCw className="w-4 h-4" /> Run Now</>}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* ── Watchlist description card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-slate-900">Talent Profile</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 uppercase tracking-wide">
                AI-powered
              </span>
            </div>
            {watchlist && !isEditing && (
              <button
                onClick={() => { setDraft(watchlist.description); setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 60); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          <div className="px-5 py-4">
            {!watchlist && !isEditing ? (
              /* Empty state — no watchlist yet */
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
                  <Target className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">No talent profile yet</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    Describe the type of talent you're regularly looking for and the AI will surface fresh matches daily.
                  </p>
                </div>
                <button
                  onClick={() => { setDraft(""); setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 60); }}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 transition shadow-sm"
                >
                  <Sparkles className="w-4 h-4" /> Set up my talent feed
                </button>
              </div>
            ) : isEditing ? (
              /* Edit mode */
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  Describe the talent you're looking for
                </label>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  maxLength={MAX_LEN}
                  placeholder="e.g. Senior Solidity developer with 3+ years of DeFi experience, available immediately, based in Europe or remote. Strong background in smart contract auditing and Hardhat. Ideally worked on mainnet protocols..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-amber-400 focus:outline-none resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${draft.length < MIN_LEN ? "text-rose-500" : "text-slate-400"}`}>
                    {draft.length < MIN_LEN
                      ? `${MIN_LEN - draft.length} more characters needed`
                      : `${charsLeft} characters remaining`}
                  </p>
                  <div className="flex items-center gap-2">
                    {watchlist && (
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); setDraft(watchlist.description); }}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void saveDescription()}
                      disabled={saving || draft.trim().length < MIN_LEN}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-1.5 transition"
                    >
                      {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" /> Save</>}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="space-y-3">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{watchlist!.description}</p>
                {watchlist?.last_run_at && (
                  <p className="text-xs text-slate-400">
                    Last searched {formatRelativeTime(watchlist.last_run_at)}
                    {isStale && <span className="ml-2 text-amber-600 font-medium">· Results may be outdated</span>}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Run error ── */}
        {runError && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {runError}
          </div>
        )}

        {/* ── Running skeleton ── */}
        {running && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <p className="text-sm font-medium text-slate-600">AI is finding matching talent…</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-[28px] border border-slate-100 bg-white p-5 space-y-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                      <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="h-16 bg-slate-50 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-2.5 bg-slate-100 rounded-full" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-4/5" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {!running && results !== null && (
          <div className="space-y-4">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {results.length > 0 ? `${results.length} matches found` : "No matches found"}
                </h2>
                {results.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                    AI-ranked
                  </span>
                )}
              </div>
              {results.length > 0 && watchlist && (
                <button
                  onClick={() => void runSearch(watchlist.description)}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-lg hover:bg-white border border-slate-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <p className="text-slate-400 text-sm">No available talents matched your description right now.</p>
                <p className="text-slate-400 text-xs mt-1">Try broadening your criteria or check back later.</p>
              </div>
            ) : (
              <>
                {/* Hero card (rank 1) */}
                <TalentResultCard
                  talent={results[0]}
                  rank={1}
                  onAddToPipeline={addToPipeline}
                  addingId={addingId}
                  addedIds={addedIds}
                />

                {/* Rest of results */}
                {results.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.slice(1).map((talent, idx) => (
                      <TalentResultCard
                        key={talent.userId}
                        talent={talent}
                        rank={idx + 2}
                        onAddToPipeline={addToPipeline}
                        addingId={addingId}
                        addedIds={addedIds}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Empty state (watchlist set, never run) ── */}
        {!running && results === null && watchlist && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">Ready to find talent</p>
              <p className="text-sm text-slate-500 mt-1">Hit "Run Now" to search for matching candidates.</p>
            </div>
            <button
              onClick={() => void runSearch(watchlist.description)}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> Run Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
