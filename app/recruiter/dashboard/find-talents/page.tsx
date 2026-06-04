"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Clock,
  FileText,
  History,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  UserRoundCheck,
  X,
} from "lucide-react";

import { AvailabilityBadge } from "@/app/components/AvailabilityBadge";
import { formatRateRange } from "@/app/utils/format-rate-range";

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
  message?: string;
}

interface TalentsResponse {
  success: boolean;
  data?: { candidates: TopTalent[]; scoredCount: number };
  error?: string;
}

interface SearchHistoryItem {
  id: string;
  job_description: string;
  candidates: TopTalent[];
  scored_count: number;
  created_at: string;
}

function getDisplayName(talent: TopTalent) {
  return [talent.firstName, talent.lastName].filter(Boolean).join(" ").trim() || "GoodHive Talent";
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

function truncateText(value: string, maxLength: number) {
  const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function getLocationLabel(talent: TopTalent) {
  return [talent.city, talent.country].filter(Boolean).join(", ") || "Remote-ready";
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MIN_DESC_LENGTH = 50;
const MAX_DESC_LENGTH = 5000;

interface TalentCardProps {
  talent: TopTalent;
  rank: number;
  isHero?: boolean;
  onClick: () => void;
}

function ScoreRing({ score, size = 52 }: { score: number | null; size?: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score ?? 0, 0), 100);
  const dash = (pct / 100) * circ;
  const color = score === null ? "#cbd5e1" : score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f97316";
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x="22" y="22"
        textAnchor="middle" dominantBaseline="central"
        className="rotate-90"
        style={{ transform: "rotate(90deg)", transformOrigin: "22px 22px", fontSize: "9px", fontWeight: 700, fill: color }}
      >
        {score === null ? "–" : `${score}%`}
      </text>
    </svg>
  );
}

function TalentCard({ talent, rank, isHero = false, onClick }: TalentCardProps) {
  const rateLabel = formatRateRange({
    minRate: talent.minRate ?? undefined,
    maxRate: talent.maxRate ?? undefined,
  });
  const locationLabel = getLocationLabel(talent);
  const visibleSkills = talent.skills.slice(0, 4);
  const hiddenSkillsCount = Math.max(talent.skills.length - visibleSkills.length, 0);
  const description = truncateText(talent.description, isHero ? 180 : 140) || "No profile summary available.";
  const name = getDisplayName(talent);
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full flex-col overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 ${
        isHero
          ? "rounded-3xl border-2 border-amber-300 bg-white shadow-[0_8px_40px_rgba(245,158,11,0.18)] hover:shadow-[0_16px_60px_rgba(245,158,11,0.28)]"
          : "rounded-2xl border border-slate-100 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.06)] hover:border-amber-200 hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)]"
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${isHero ? "bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" : "bg-gradient-to-r from-slate-100 to-slate-200 group-hover:from-amber-300 group-hover:to-orange-300 transition-all duration-300"}`} />

      <div className="flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className={`relative shrink-0 overflow-hidden rounded-2xl ${isHero ? "h-14 w-14" : "h-12 w-12"}`}>
              {talent.imageUrl ? (
                <Image src={talent.imageUrl} alt={name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 text-sm font-bold text-amber-700">
                  {initials}
                </div>
              )}
            </div>
            {/* Name + title */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isHero && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    <Trophy className="h-3 w-3" /> Best Match
                  </span>
                )}
              </div>
              <p className={`truncate font-semibold text-slate-900 ${isHero ? "text-base" : "text-sm"}`}>{name}</p>
              <p className="truncate text-xs text-slate-500 mt-0.5">{talent.title || "Talent"}</p>
            </div>
          </div>
          {/* Score ring or rank */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <ScoreRing score={talent.score} size={isHero ? 52 : 46} />
            {!isHero && (
              <span className="text-[10px] font-semibold text-slate-400">#{rank}</span>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 flex-wrap">
          <AvailabilityBadge status={talent.availabilityStatus} />
          {locationLabel && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <span className="text-slate-300">•</span>
              {locationLabel}
            </span>
          )}
          {rateLabel && (
            <span className="flex items-center gap-1 text-xs font-medium text-slate-600">
              <span className="text-slate-300">•</span>
              {talent.currency} {rateLabel}/hr
            </span>
          )}
        </div>

        {/* Score bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${getScoreBarClass(talent.score)}`}
            style={{ width: `${Math.min(Math.max(talent.score ?? 10, 10), 100)}%` }}
          />
        </div>

        {/* Bio */}
        <p className="text-xs leading-5 text-slate-500 line-clamp-3 min-h-[60px]">
          {description}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
            >
              {skill}
            </span>
          ))}
          {hiddenSkillsCount > 0 && (
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
              +{hiddenSkillsCount}
            </span>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-end pt-1 border-t border-slate-100">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            isHero
              ? "bg-amber-500 text-white group-hover:bg-amber-600"
              : "bg-slate-900 text-white group-hover:bg-amber-500"
          }`}>
            View Profile
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}

export default function FindTalentsPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [talents, setTalents] = useState<TopTalent[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<TopTalent | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastScoredCount, setLastScoredCount] = useState<number | null>(null);
  const [outreachEmail, setOutreachEmail] = useState<string | null>(null);
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySource, setHistorySource] = useState<SearchHistoryItem | null>(null);

  useEffect(() => {
    setOutreachEmail(null);
    setIsDraftingEmail(false);
    setCopied(false);
  }, [selectedTalent]);

  useEffect(() => {
    void fetchHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/recruiter/search-history");
      const payload = (await response.json()) as { success: boolean; data?: SearchHistoryItem[] };
      if (payload.success && payload.data) {
        setHistory(payload.data);
      }
    } catch {
      // History failure is non-fatal
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadFromHistory = (item: SearchHistoryItem) => {
    setJobDescription(item.job_description);
    setTalents(item.candidates);
    setLastScoredCount(item.scored_count);
    setHistorySource(item);
    setSelectedTalent(null);
    setOutreachEmail(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const rerunSearch = async (jobDesc: string) => {
    setHistorySource(null);
    setJobDescription(jobDesc);
    setIsSearching(true);
    setTalents([]);
    setLastScoredCount(null);
    setSelectedTalent(null);
    try {
      const response = await fetch("/api/recruiter/top-talents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jobDesc }),
      });
      const payload = (await response.json()) as TalentsResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Failed to find top talents");
      }
      setTalents(payload.data.candidates);
      setLastScoredCount(payload.data.scoredCount);
      toast.success("Top talents found");
      await fetchHistory();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to find top talents");
    } finally {
      setIsSearching(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const response = await fetch(`/api/recruiter/search-history/${id}`, { method: "DELETE" });
      if (response.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (historySource?.id === id) setHistorySource(null);
        toast.success("History item removed");
      }
    } catch {
      toast.error("Failed to delete history item");
    }
  };

  const charCount = jobDescription.length;
  const canSubmit = charCount >= MIN_DESC_LENGTH && charCount <= MAX_DESC_LENGTH && !isSearching;

  const findTopTalents = async () => {
    if (!canSubmit) return;

    setIsSearching(true);
    setTalents([]);
    setLastScoredCount(null);
    setHistorySource(null);

    try {
      const response = await fetch("/api/recruiter/top-talents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const payload = (await response.json()) as TalentsResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Failed to find top talents");
      }

      setTalents(payload.data.candidates);
      setLastScoredCount(payload.data.scoredCount);
      toast.success("Top talents found");
      await fetchHistory();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to find top talents");
    } finally {
      setIsSearching(false);
    }
  };

  const draftOutreachEmail = async () => {
    if (!selectedTalent || isDraftingEmail) return;

    setIsDraftingEmail(true);
    setOutreachEmail(null);

    try {
      const response = await fetch("/api/recruiter/draft-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentName: getDisplayName(selectedTalent),
          talentTitle: selectedTalent.title,
          talentSkills: selectedTalent.skills,
          jobDescription,
        }),
      });
      const payload = (await response.json()) as { success: boolean; email?: string; error?: string };

      if (!response.ok || !payload.success || !payload.email) {
        throw new Error(payload.error ?? "Failed to draft email");
      }

      setOutreachEmail(payload.email);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to draft outreach email");
    } finally {
      setIsDraftingEmail(false);
    }
  };

  const copyEmail = async () => {
    if (!outreachEmail) return;
    await navigator.clipboard.writeText(outreachEmail);
    setCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Podium ordering: DOM order is [#2, #1, #3] so #1 appears center
  const podiumTop = talents.length >= 3 ? [talents[1], talents[0], talents[2]] : null;
  const runnerUps = talents.slice(3);

  return (
    <div className="space-y-6 pb-8">
      {/* Input section */}
      <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
              <Sparkles className="h-4 w-4" />
              AI Talent Finder
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Find the best talents for your role
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Describe the role you are hiring for and GoodHive will rank available talents using AI match scoring.
            </p>
          </div>

          <button
            type="button"
            onClick={findTopTalents}
            disabled={!canSubmit}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-amber-500 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserRoundCheck className="h-4 w-4" />
            )}
            {isSearching ? "Searching…" : talents.length > 0 ? "Search Again" : "Find Top 5 Talents"}
          </button>
        </div>

        <div className="mt-6">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FileText className="h-4 w-4 text-amber-600" />
              Job description
            </span>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              rows={8}
              maxLength={MAX_DESC_LENGTH}
              placeholder="Paste or type the job description here. Include the role title, required skills, responsibilities, and any other relevant details…"
              className="w-full rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              disabled={isSearching}
            />
          </label>

          <div className="mt-2 flex items-center justify-between gap-4">
            <p className={`text-xs ${charCount < MIN_DESC_LENGTH ? "text-slate-400" : "text-emerald-600"}`}>
              {charCount < MIN_DESC_LENGTH
                ? `${MIN_DESC_LENGTH - charCount} more characters needed`
                : `${charCount} / ${MAX_DESC_LENGTH} characters`}
            </p>
            {lastScoredCount !== null && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                Scored {lastScoredCount} available {lastScoredCount === 1 ? "talent" : "talents"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Results Banner */}
      {historySource && !isSearching && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Clock className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Showing results from{" "}
              <span
                className="font-semibold"
                title={new Date(historySource.created_at).toLocaleString()}
              >
                {formatRelativeTime(historySource.created_at)}
              </span>
              {" "}— these are cached results. New talents may have joined since.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void rerunSearch(historySource.job_description)}
            disabled={isSearching}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-amber-500 hover:to-orange-600 disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            View Current Top 5
          </button>
        </div>
      )}

      {/* Results */}
      {isSearching ? (
        <div className="rounded-2xl border border-amber-200 bg-white p-10 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />
          <h3 className="mt-4 text-lg font-semibold text-slate-950">Ranking available talent</h3>
          <p className="mt-2 text-sm text-slate-600">
            This can take a moment while AI scores are computed.
          </p>
        </div>
      ) : talents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <UserRoundCheck className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-950">Ready to search</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Enter a job description above and click &quot;Find Top 5 Talents&quot; to get AI-ranked results.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Podium row: #2 | #1 hero | #3 */}
          {podiumTop ? (
            <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-3">
              {podiumTop.map((talent, podiumIndex) => {
                const isHero = podiumIndex === 1;
                const rank = isHero ? 1 : podiumIndex === 0 ? 2 : 3;
                return (
                  <TalentCard
                    key={talent.userId}
                    talent={talent}
                    rank={rank}
                    isHero={isHero}
                    onClick={() => setSelectedTalent(talent)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {talents.slice(0, 3).map((talent, index) => (
                <TalentCard
                  key={talent.userId}
                  talent={talent}
                  rank={index + 1}
                  isHero={index === 0}
                  onClick={() => setSelectedTalent(talent)}
                />
              ))}
            </div>
          )}

          {/* Runner-up row: #4 and #5 */}
          {runnerUps.length > 0 && (
            <div className={`grid grid-cols-1 gap-6 ${runnerUps.length === 1 ? "md:grid-cols-1 max-w-sm mx-auto" : "md:grid-cols-2 max-w-2xl mx-auto w-full"}`}>
              {runnerUps.map((talent, index) => (
                <TalentCard
                  key={talent.userId}
                  talent={talent}
                  rank={index + 4}
                  onClick={() => setSelectedTalent(talent)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search History Panel */}
      <div className="rounded-2xl border border-amber-100 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-4 text-left transition hover:bg-amber-50/40"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-slate-800">Search History</span>
            {history.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {history.length}
              </span>
            )}
          </div>
          {isHistoryOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {isHistoryOpen && (
          <div className="border-t border-amber-100 px-6 pb-6 pt-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                  <History className="h-6 w-6 text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No search history yet</p>
                <p className="max-w-xs text-xs leading-5 text-slate-400">
                  Your past searches will appear here. Load them instantly without spending AI tokens.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="group relative rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-amber-200 hover:bg-amber-50/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <p
                            className="text-sm font-medium text-slate-700"
                            title={item.job_description}
                          >
                            {item.job_description.length > 90
                              ? `${item.job_description.slice(0, 90).trim()}…`
                              : item.job_description}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            Top {item.candidates.length} from {item.scored_count} scored
                          </span>
                          <span
                            className="text-xs text-slate-400"
                            title={new Date(item.created_at).toLocaleString()}
                          >
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => loadFromHistory(item)}
                          disabled={isSearching}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition hover:bg-amber-50 disabled:opacity-60"
                        >
                          <History className="h-3.5 w-3.5" />
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => void rerunSearch(item.job_description)}
                          disabled={isSearching}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-amber-500 hover:to-orange-600 disabled:opacity-60"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Re-run
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteHistoryItem(item.id)}
                          className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-400"
                          aria-label="Delete this history item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedTalent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Talent Details
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">
                  {getDisplayName(selectedTalent)}
                </h3>
                <p className="text-sm text-slate-500">{selectedTalent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTalent(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close talent details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex flex-wrap gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1 ${getScoreClasses(selectedTalent.score)}`}>
                  <Star className="h-4 w-4" />
                  {selectedTalent.score === null ? "No AI score" : `${selectedTalent.score}% AI match`}
                </span>
                <AvailabilityBadge status={selectedTalent.availabilityStatus} />
              </div>

              <section>
                <h4 className="text-sm font-semibold text-slate-950">Why this talent matches</h4>
                {selectedTalent.reasons.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {selectedTalent.reasons.map((reason) => (
                      <li key={reason} className="flex gap-2 text-sm leading-6 text-slate-600">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedTalent.message ?? "AI did not return match reasons for this talent."}
                  </p>
                )}
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-950">Potential gaps</h4>
                {selectedTalent.gaps.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {selectedTalent.gaps.map((gap) => (
                      <li key={gap} className="flex gap-2 text-sm leading-6 text-slate-600">
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No major gaps were returned by AI.</p>
                )}
              </section>

              {/* Outreach email section */}
              <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Mail className="h-4 w-4 text-amber-600" />
                      AI Outreach Email
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Generate a personalized cold-outreach email for this talent.
                    </p>
                  </div>
                  {!outreachEmail && (
                    <button
                      type="button"
                      onClick={draftOutreachEmail}
                      disabled={isDraftingEmail}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-amber-500 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDraftingEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {isDraftingEmail ? "Drafting…" : "Draft Email"}
                    </button>
                  )}
                </div>

                {outreachEmail && (
                  <div className="mt-4">
                    <div className="relative">
                      <textarea
                        readOnly
                        value={outreachEmail}
                        rows={10}
                        className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm leading-6 text-slate-700 outline-none resize-none"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => { setOutreachEmail(null); }}
                        className="text-xs text-slate-400 transition hover:text-slate-600"
                      >
                        Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={copyEmail}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-50"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                        {copied ? "Copied!" : "Copy Email"}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTalent(null)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
                <Link
                  href={`/talents/${selectedTalent.userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-amber-500 hover:to-orange-600"
                >
                  View Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
