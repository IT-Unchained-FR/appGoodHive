"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Clock,
  Zap,
  Filter,
  Star,
  Send,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserCircle,
  Target,
  Pencil,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/app/contexts/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TopTalent {
  userId: string;
  firstName: string;
  lastName: string;
  title: string;
  skills: string[];
  score: number | null;
  availabilityStatus: string;
  imageUrl: string | null;
}

interface SearchHistoryItem {
  id: string;
  job_description: string;
  candidates: TopTalent[];
  scored_count: number;
  created_at: string;
}

interface PipelineEntry {
  id: string;
  talent_id: string;
  stage: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  talent_name: string | null;
  talent_image: string | null;
  talent_title: string | null;
  talent_skills: string | null;
}

interface PipelineData {
  shortlisted: PipelineEntry[];
  contacted: PipelineEntry[];
  interviewing: PipelineEntry[];
  hired: PipelineEntry[];
  rejected: PipelineEntry[];
}

interface RecruiterStats {
  searches: {
    total: number;
    thisWeek: number;
    lastWeek: number;
    sparkline: number[];
  };
  pipeline: {
    addedThisWeek: number;
    addedLastWeek: number;
    sparkline: number[];
  };
  interviewing: {
    current: number;
    lastWeek: number;
    sparkline: number[];
  };
  hired: {
    thisMonth: number;
    lastMonth: number;
    sparkline: number[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDashboardDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "R";
}

/** Formats a real delta number as a signed percentage or count string */
function formatDelta(current: number, previous: number): { label: string; dir: "up" | "down" | "flat" } {
  if (previous === 0 && current === 0) return { label: "No data yet", dir: "flat" };
  if (previous === 0) return { label: `+${current} new`, dir: "up" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { label: "Same as before", dir: "flat" };
  return { label: `${pct > 0 ? "+" : ""}${pct}%`, dir: pct >= 0 ? "up" : "down" };
}

/** Convert a number[] sparkline into an SVG polyline points string (normalized 0-20 height) */
function toPolyline(values: number[]): string {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 120},${20 - (v / max) * 16}`)
    .join(" ");
}

// ─── Avatar palette (cycles by index) ────────────────────────────────────────

const AVATAR_PALETTE = [
  { bg: "bg-amber-100",  text: "text-amber-700"  },
  { bg: "bg-teal-100",   text: "text-teal-700"   },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-rose-100",   text: "text-rose-700"   },
];

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  hero?: boolean;
  title: string;
  icon: React.ElementType;
  value: string | number;
  delta: string;
  deltaDir?: "up" | "down" | "flat";
  sub: string;
  sparkline: number[];
  delay?: number;
  loading?: boolean;
}

function StatCard({
  hero,
  title,
  icon: Icon,
  value,
  delta,
  deltaDir = "up",
  sub,
  sparkline,
  delay = 0,
  loading,
}: StatCardProps) {
  const isUp = deltaDir === "up";
  const isFlat = deltaDir === "flat";
  const spark = toPolyline(sparkline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-2xl p-5 ${
        hero
          ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-200/60"
          : "bg-white border border-slate-200 shadow-sm"
      }`}
    >
      {hero && (
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(0,0,0,0.6) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />
      )}

      <div className="flex items-start justify-between">
        <span className={`text-[11px] font-semibold uppercase tracking-widest ${hero ? "text-amber-900/70" : "text-slate-400"}`}>
          {title}
        </span>
        <Icon className={`w-4 h-4 ${hero ? "text-amber-900/50" : "text-slate-300"}`} />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className={`h-10 w-16 rounded-lg animate-pulse ${hero ? "bg-amber-300/40" : "bg-slate-100"}`} />
        ) : (
          <span className={`text-[40px] leading-none font-bold tabular-nums tracking-tight ${hero ? "text-white" : "text-slate-900"}`}>
            {value}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[12px]">
        {!isFlat && (
          <span className={`inline-flex items-center gap-0.5 font-semibold ${
            hero ? "text-amber-900/75" : isUp ? "text-emerald-600" : "text-rose-500"
          }`}>
            {isUp
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {delta}
          </span>
        )}
        {sub && (
          <span className={hero ? "text-amber-900/55" : "text-slate-400"}>{isFlat ? delta : sub}</span>
        )}
      </div>

      {/* Sparkline */}
      {spark && (
        <svg viewBox="0 0 120 24" className="mt-3 w-full h-5" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={hero ? "rgba(255,255,255,0.22)" : "rgba(245,166,35,0.3)"}
            strokeWidth="1.5"
            points={spark}
          />
          <polyline
            fill="none"
            stroke={hero ? "rgba(255,255,255,0.75)" : "rgba(245,166,35,0.85)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="60 200"
            points={spark}
          />
        </svg>
      )}
    </motion.div>
  );
}

// ─── Error card with retry ────────────────────────────────────────────────────

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl bg-white border border-red-100 p-5 flex items-center gap-4">
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      <p className="text-sm text-slate-600 flex-1">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[12px] font-medium transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    </div>
  );
}

// ─── Pipeline Health Bar ──────────────────────────────────────────────────────

const PIPELINE_SEGMENTS = [
  { key: "shortlisted"  as const, label: "Shortlisted",   color: "#F5A623" },
  { key: "contacted"    as const, label: "Contacted",      color: "#3B82F6" },
  { key: "interviewing" as const, label: "Interviewing",   color: "#A78BFA" },
  { key: "hired"        as const, label: "Hired",          color: "#10B981" },
  { key: "rejected"     as const, label: "Rejected",       color: "#FDA4AF" },
];

function PipelineHealthBar({ data }: { data: PipelineData | null }) {
  const counts = PIPELINE_SEGMENTS.map((s) => ({
    ...s,
    count: data ? (data[s.key]?.length ?? 0) : 0,
  }));
  const total = counts.reduce((a, b) => a + b.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.32 }}
      className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4"
    >
      <div className="flex items-center justify-between text-[12.5px] mb-3">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">Pipeline health</span>
          <span className="text-slate-400">· {total} candidates</span>
        </div>
        <Link
          href="/recruiter/dashboard/pipeline"
          className="text-slate-400 hover:text-amber-600 inline-flex items-center gap-1 transition-colors text-[12px]"
        >
          View pipeline <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
        {counts.map((s, i) =>
          total > 0 && s.count > 0 ? (
            <motion.div
              key={s.key}
              initial={{ width: 0 }}
              animate={{ width: `${(s.count / total) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.08 * i, ease: "easeOut" }}
              style={{ background: s.color }}
              className={i !== counts.length - 1 ? "border-r border-white/40" : ""}
            />
          ) : null
        )}
        {total === 0 && <div className="flex-1 bg-slate-100 rounded-full" />}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px]">
        {counts.map((s) => (
          <div key={s.key} className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="text-slate-400 tabular-nums">({s.count})</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Match Chip ───────────────────────────────────────────────────────────────

function MatchChip({ score }: { score: number | null }) {
  if (score === null) return null;
  const tone = score >= 90 ? "emerald" : score >= 75 ? "amber" : "slate";
  const cls = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber:   "bg-amber-50  text-amber-700  ring-amber-200",
    slate:   "bg-slate-100 text-slate-600  ring-slate-200",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 tabular-nums ${cls}`}>
      <Sparkles className="w-2.5 h-2.5" />
      {score}%
    </span>
  );
}

// ─── Talent Card ──────────────────────────────────────────────────────────────

function TalentCard({ talent, colorIndex }: { talent: TopTalent; colorIndex: number }) {
  const col = AVATAR_PALETTE[colorIndex % AVATAR_PALETTE.length];
  const initials = getInitials(talent.firstName, talent.lastName);
  const name = [talent.firstName, talent.lastName].filter(Boolean).join(" ") || "GoodHive Talent";

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-3.5 hover:border-amber-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3">
        {talent.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={talent.imageUrl}
            alt={name}
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full ${col.bg} ${col.text} flex items-center justify-center font-bold text-[12px] shrink-0`}>
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{name}</p>
              <p className="text-[11.5px] text-slate-500 truncate">{talent.title || "Talent"}</p>
            </div>
            <MatchChip score={talent.score} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {talent.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 h-0 overflow-hidden group-hover:h-7 transition-all duration-200">
        <Link
          href={`/talents/${talent.userId}`}
          className="flex-1 h-7 rounded-lg bg-amber-500 text-white text-[11px] font-semibold flex items-center justify-center hover:bg-amber-600 transition-colors"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

// ─── Pipeline Stage Card ──────────────────────────────────────────────────────

function PipelineEntryCard({ entry, colorIndex }: { entry: PipelineEntry; colorIndex: number }) {
  const col = AVATAR_PALETTE[colorIndex % AVATAR_PALETTE.length];
  const name = entry.talent_name?.trim() || "Unknown Talent";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const skills = entry.talent_skills
    ? entry.talent_skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-3.5 hover:border-amber-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3">
        {entry.talent_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.talent_image}
            alt={name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full ${col.bg} ${col.text} flex items-center justify-center font-bold text-[12px] shrink-0`}>
            {initials || <UserCircle className="w-5 h-5" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-900 truncate">{name}</p>
          <p className="text-[11.5px] text-slate-500 truncate">{entry.talent_title || "Talent"}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill) => (
              <span key={skill} className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">{formatRelativeTime(entry.updated_at)}</span>
        <Link
          href={`/talents/${entry.talent_id}`}
          className="text-[11px] font-medium text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 transition-colors"
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Pipeline Stage Section ───────────────────────────────────────────────────

function PipelineStageSection({
  stage,
  entries,
  loading,
}: {
  stage: keyof PipelineData;
  entries: PipelineEntry[];
  loading: boolean;
}) {
  const STAGE_LABELS: Record<string, string> = {
    shortlisted:  "Shortlisted Talents",
    contacted:    "Contacted Talents",
    interviewing: "Interviewing",
    hired:        "Hired Talents",
    rejected:     "Rejected",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="col-span-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <h2 className="text-[14.5px] font-semibold text-slate-900">{STAGE_LABELS[stage]}</h2>
          {!loading && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-semibold">
              {entries.length}
            </span>
          )}
        </div>
        <Link
          href="/recruiter/dashboard/pipeline"
          className="text-[12px] font-medium text-slate-500 hover:text-amber-600 inline-flex items-center gap-1 transition-colors"
        >
          Full pipeline <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No talents in this stage yet</p>
          <Link href="/recruiter/dashboard/find-talents" className="mt-2 text-sm text-amber-600 hover:underline">
            Find talents →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {entries.map((entry, i) => (
            <PipelineEntryCard key={entry.id} entry={entry} colorIndex={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Top Talents Section ──────────────────────────────────────────────────────

function TopTalentsSection({
  searchHistory,
  loading,
}: {
  searchHistory: SearchHistoryItem[];
  loading: boolean;
}) {
  const latestSearch = searchHistory[0];
  const talents = latestSearch?.candidates?.slice(0, 4) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <h2 className="text-[14.5px] font-semibold text-slate-900">Latest AI search results</h2>
          {latestSearch && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10.5px] font-semibold ring-1 ring-amber-200">
              {formatRelativeTime(latestSearch.created_at)}
            </span>
          )}
        </div>
        <Link
          href="/recruiter/dashboard/find-talents"
          className="text-[12px] font-medium text-slate-500 hover:text-amber-600 inline-flex items-center gap-1 transition-colors"
        >
          See all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : talents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No AI searches yet</p>
          <Link href="/recruiter/dashboard/find-talents" className="mt-2 text-sm text-amber-600 hover:underline">
            Run your first search →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {talents.map((t, i) => (
            <motion.div
              key={t.userId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i + 0.45 }}
            >
              <TalentCard talent={t} colorIndex={i} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Search Row ───────────────────────────────────────────────────────────────

function SearchRow({ item, isFirst }: { item: SearchHistoryItem; isFirst: boolean }) {
  const router = useRouter();
  const raw = stripHtml(item.job_description);
  const truncated = raw.length > 42 ? raw.slice(0, 42).trim() + "…" : raw;

  return (
    <button
      onClick={() => router.push("/recruiter/dashboard/find-talents")}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        isFirst ? "bg-slate-50 ring-1 ring-slate-200" : "hover:bg-slate-50"
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-slate-800 font-medium truncate">{truncated}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="tabular-nums">{item.scored_count} results</span>
          <span>·</span>
          <span>{formatRelativeTime(item.created_at)}</span>
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
    </button>
  );
}

// ─── Recent Searches Section ──────────────────────────────────────────────────

function RecentSearchesSection({
  history,
  loading,
}: {
  history: SearchHistoryItem[];
  loading: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.48 }}
      className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <h2 className="text-[14.5px] font-semibold text-slate-900">Recent AI searches</h2>
        </div>
        <Link href="/recruiter/dashboard/find-talents" className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">
          History
        </Link>
      </div>

      {/* Quick search prompt */}
      <div className="rounded-xl ring-1 ring-amber-200 bg-gradient-to-br from-amber-50 to-transparent p-3 mb-3">
        <p className="text-[11.5px] text-slate-600 font-medium mb-1.5">Start a new search</p>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && router.push("/recruiter/dashboard/find-talents")}
            placeholder='e.g. "Senior React dev, EU timezone…"'
            className="flex-1 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            onClick={() => router.push("/recruiter/dashboard/find-talents")}
            className="h-8 px-3 rounded-lg bg-amber-500 text-white text-[12px] font-semibold hover:bg-amber-600 transition-colors inline-flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Find
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Search className="w-7 h-7 text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No searches yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 -mx-1">
          {history.slice(0, 5).map((item, i) => (
            <SearchRow key={item.id} item={item} isFirst={i === 0} />
          ))}
        </div>
      )}

      {history.length > 5 && (
        <Link
          href="/recruiter/dashboard/find-talents"
          className="mt-3 text-[12px] text-slate-400 hover:text-amber-600 self-start inline-flex items-center gap-1 transition-colors"
        >
          View all searches <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </motion.div>
  );
}

// ─── Watchlist ───────────────────────────────────────────────────────────────

interface WatchlistData {
  description: string;
  last_run_at: string | null;
}

const WATCHLIST_STALE_MS = 22 * 60 * 60 * 1000; // 22 h

function WatchlistCard({
  onRunSearch,
  onRefreshHistory,
  onRunningChange,
}: {
  onRunSearch: (description: string) => Promise<boolean>;
  onRefreshHistory: () => void;
  onRunningChange: (running: boolean) => void;
}) {
  const [watchlist, setWatchlist]     = useState<WatchlistData | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft]             = useState("");
  const [saving, setSaving]           = useState(false);
  const [running, setRunning]         = useState(false);
  const autoRanRef                     = useRef(false);
  const textareaRef                    = useRef<HTMLTextAreaElement>(null);

  // Keep the latest parent callbacks in a ref so triggerRun stays stable.
  const cbRef = useRef({ onRunSearch, onRefreshHistory, onRunningChange });
  useEffect(() => { cbRef.current = { onRunSearch, onRefreshHistory, onRunningChange }; });

  const triggerRun = useCallback(async (description: string, silent = false) => {
    setRunning(true);
    cbRef.current.onRunningChange(true);
    try {
      const ok = await cbRef.current.onRunSearch(description);
      if (ok) {
        await fetch("/api/recruiter/watchlist", { method: "PATCH" });
        const now = new Date().toISOString();
        setWatchlist((prev) => (prev ? { ...prev, last_run_at: now } : prev));
        cbRef.current.onRefreshHistory();
        if (!silent) toast.success("Talent feed refreshed ✓");
      } else if (!silent) {
        toast.error("Refresh failed — please try again.");
      }
    } finally {
      setRunning(false);
      cbRef.current.onRunningChange(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/recruiter/watchlist")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.description) {
          setWatchlist(res.data);
          setDraft(res.data.description);
          const lastRun = res.data.last_run_at ? new Date(res.data.last_run_at).getTime() : 0;
          if (!autoRanRef.current && Date.now() - lastRun > WATCHLIST_STALE_MS) {
            autoRanRef.current = true;
            triggerRun(res.data.description, true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCard(false));
  }, [triggerRun]);

  function openModal() {
    setDraft(watchlist?.description ?? "");
    setIsModalOpen(true);
    // Focus textarea after animation frame
    setTimeout(() => textareaRef.current?.focus(), 80);
  }

  function closeModal() {
    setIsModalOpen(false);
    setDraft(watchlist?.description ?? "");
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (trimmed.length < 50) {
      toast.error(`Write at least ${50 - trimmed.length} more characters.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/recruiter/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      }).then((r) => r.json());

      if (res.success) {
        setWatchlist({ description: trimmed, last_run_at: null });
        setIsModalOpen(false);
        await triggerRun(trimmed, false);
      } else {
        toast.error(res.error ?? "Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loadingCard) return null;

  const truncated = watchlist
    ? watchlist.description.length > 110
      ? watchlist.description.slice(0, 110).trimEnd() + "…"
      : watchlist.description
    : null;

  const charOk = draft.trim().length >= 50;

  return (
    <>
      {/* ── Compact card / CTA ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            watchlist ? "bg-amber-50" : "bg-amber-500 shadow-sm shadow-amber-200"
          }`}>
            <Target className={`w-4 h-4 ${watchlist ? "text-amber-500" : "text-white"}`} />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13.5px] font-semibold text-slate-900">Daily talent feed</span>
              {running ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  AI is searching…
                </span>
              ) : watchlist?.last_run_at ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-medium ring-1 ring-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Refreshed {formatRelativeTime(watchlist.last_run_at)}
                </span>
              ) : !watchlist ? (
                <span className="text-[12px] text-slate-400">Tell AI what talent you need daily</span>
              ) : null}
            </div>
            {truncated && (
              <p className="text-[12px] text-slate-400 mt-0.5 truncate">{truncated}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {watchlist && (
              <>
                <button
                  onClick={() => triggerRun(watchlist.description, false)}
                  disabled={running}
                  className="h-8 w-8 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-40 inline-flex items-center justify-center transition-colors"
                  title="Refresh now"
                >
                  {running
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                </button>
                <Link
                  href="/recruiter/dashboard/watchlist"
                  className="h-8 px-3.5 rounded-xl text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                >
                  View feed →
                </Link>
              </>
            )}
            <button
              onClick={openModal}
              className={`h-8 px-3.5 rounded-xl text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-all ${
                watchlist
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200"
              }`}
            >
              {watchlist ? (
                <><Pencil className="w-3 h-3" /> Edit</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Set up feed</>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm shadow-amber-300">
                  <Target className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[16px] font-bold text-slate-900 leading-tight">
                    {watchlist ? "Edit talent feed" : "Set up your daily talent feed"}
                  </h2>
                  <p className="text-[12.5px] text-slate-400 mt-0.5">
                    AI will auto-refresh your results every day
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center transition-colors ml-2 shrink-0"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 2l12 12M14 2L2 14" />
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 mx-6" />

              {/* Body */}
              <div className="px-6 py-5">
                <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Talent profile description
                </label>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  placeholder='Describe what you&apos;re looking for — skills, seniority, timezone, availability, stack, industry...&#10;&#10;e.g. "Senior React / TypeScript developer, 5+ years experience, strong Node.js background, EU timezone, open to blockchain projects, immediately available."'
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none leading-relaxed"
                />

                {/* Char counter + hint */}
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-[11.5px] tabular-nums transition-colors ${
                    charOk ? "text-emerald-600 font-medium" : "text-slate-400"
                  }`}>
                    {draft.trim().length} / 5000
                    {!charOk && draft.trim().length > 0 && (
                      <span className="text-slate-400"> · {50 - draft.trim().length} more needed</span>
                    )}
                  </span>
                  {charOk && (
                    <span className="text-[11.5px] text-emerald-600 font-medium inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 pb-5">
                <button
                  onClick={closeModal}
                  className="h-9 px-4 rounded-xl text-slate-600 text-[13px] font-medium hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !charOk}
                  className="h-9 px-5 rounded-xl bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 shadow-sm shadow-amber-200"
                >
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Save &amp; Search now</>}
                </button>
              </div>
            </motion.div>
          </div>
      )}
    </>
  );
}

// ─── Activity Tabs ────────────────────────────────────────────────────────────

const ACTIVITY_TABS = [
  { id: "all",          label: "All activity",  icon: Star        },
  { id: "shortlisted",  label: "Shortlisted",   icon: Users       },
  { id: "interviewing", label: "Interviews",    icon: Calendar    },
  { id: "contacted",    label: "Offers sent",   icon: Send        },
  { id: "hired",        label: "Hired",         icon: CheckCircle },
];

function ActivityTabs({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ACTIVITY_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 h-9 px-3.5 rounded-full text-[13px] font-medium transition-all duration-150 ${
              isActive
                ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterDashboardHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]               = useState("all");
  const [searchHistory, setSearchHistory]       = useState<SearchHistoryItem[]>([]);
  const [pipeline, setPipeline]                 = useState<PipelineData | null>(null);
  const [stats, setStats]                       = useState<RecruiterStats | null>(null);
  const [loadingHistory, setLoadingHistory]     = useState(true);
  const [loadingPipeline, setLoadingPipeline]   = useState(true);
  const [loadingStats, setLoadingStats]         = useState(true);
  const [errorHistory, setErrorHistory]         = useState(false);
  const [errorPipeline, setErrorPipeline]       = useState(false);
  const [errorStats, setErrorStats]             = useState(false);
  const [firstName, setFirstName]               = useState<string>("");
  const [watchlistRunning, setWatchlistRunning] = useState(false);

  // Fetch recruiter's first name from talent profile
  useEffect(() => {
    if (!user?.user_id) return;
    fetch(`/api/talents/my-profile?user_id=${user.user_id}`)
      .then((r) => r.json())
      .then((data) => {
        // my-profile returns first_name at the top level of the response
        const fn = data?.first_name ?? "";
        if (fn) setFirstName(fn);
      })
      .catch(() => {});
  }, [user?.user_id]);

  const displayName = firstName || user?.email?.split("@")[0] || "Recruiter";
  const initials    = firstName
    ? firstName[0].toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "R");

  // ── Fetch search history ──
  const fetchHistory = useCallback(() => {
    setLoadingHistory(true);
    setErrorHistory(false);
    fetch("/api/recruiter/search-history")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSearchHistory(res.data ?? []);
        else setErrorHistory(true);
      })
      .catch(() => setErrorHistory(true))
      .finally(() => setLoadingHistory(false));
  }, []);

  // ── Fetch pipeline ──
  const fetchPipeline = useCallback(() => {
    setLoadingPipeline(true);
    setErrorPipeline(false);
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPipeline(res.data);
        else setErrorPipeline(true);
      })
      .catch(() => setErrorPipeline(true))
      .finally(() => setLoadingPipeline(false));
  }, []);

  // ── Fetch real stats ──
  const fetchStats = useCallback(() => {
    setLoadingStats(true);
    setErrorStats(false);
    fetch("/api/recruiter/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
        else setErrorStats(true);
      })
      .catch(() => setErrorStats(true))
      .finally(() => setLoadingStats(false));
  }, []);

  /** Called by WatchlistCard — runs an AI search with the saved description */
  const runWatchlistSearch = useCallback(async (description: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/recruiter/top-talents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: description }),
      }).then((r) => r.json());
      return !!res.success;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => { fetchHistory();  }, [fetchHistory]);
  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);
  useEffect(() => { fetchStats();    }, [fetchStats]);

  // ── Derived values ──
  const totalPipeline = pipeline
    ? Object.values(pipeline).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  const todayCount = searchHistory.filter((h) =>
    new Date(h.created_at).toDateString() === new Date().toDateString()
  ).length;

  // Real deltas from stats
  const searchDelta      = stats ? formatDelta(stats.searches.thisWeek, stats.searches.lastWeek)       : { label: "—", dir: "flat" as const };
  const pipelineDelta    = stats ? formatDelta(stats.pipeline.addedThisWeek, stats.pipeline.addedLastWeek) : { label: "—", dir: "flat" as const };
  const interviewDelta   = stats ? formatDelta(stats.interviewing.current, stats.interviewing.lastWeek)   : { label: "—", dir: "flat" as const };
  const hiredDelta       = stats ? formatDelta(stats.hired.thisMonth, stats.hired.lastMonth)             : { label: "—", dir: "flat" as const };

  // Which pipeline stage to show when a non-"all" tab is active
  const activePipelineStage = activeTab !== "all" ? (activeTab as keyof PipelineData) : null;
  const activePipelineEntries = activePipelineStage && pipeline
    ? pipeline[activePipelineStage] ?? []
    : [];

  return (
    <div className="space-y-5">

      {/* ── Greeting header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="mt-0.5 text-[13.5px] text-slate-500">
            {formatDashboardDate()}
            {todayCount > 0 && (
              <>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-700 font-medium">
                  {todayCount} new talent {todayCount === 1 ? "search" : "searches"} today
                </span>
              </>
            )}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[13px] shadow-sm shrink-0 select-none">
          {initials}
        </div>
      </motion.div>

      {/* ── Activity filter tabs ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <ActivityTabs active={activeTab} onChange={setActiveTab} />
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          hero
          title="Total Searches"
          icon={Search}
          value={loadingStats ? "—" : (stats?.searches.total ?? searchHistory.length)}
          delta={searchDelta.label}
          deltaDir={searchDelta.dir}
          sub="vs last week"
          sparkline={stats?.searches.sparkline ?? []}
          delay={0.12}
          loading={loadingStats}
        />
        <StatCard
          title="Talents in Pipeline"
          icon={Users}
          value={loadingPipeline ? "—" : totalPipeline}
          delta={pipelineDelta.label}
          deltaDir={pipelineDelta.dir}
          sub="vs last week"
          sparkline={stats?.pipeline.sparkline ?? []}
          delay={0.2}
          loading={loadingStats}
        />
        <StatCard
          title="Interviewing"
          icon={Calendar}
          value={loadingPipeline ? "—" : (stats?.interviewing.current ?? pipeline?.interviewing?.length ?? 0)}
          delta={interviewDelta.label}
          deltaDir={interviewDelta.dir}
          sub="vs last week"
          sparkline={stats?.interviewing.sparkline ?? []}
          delay={0.28}
          loading={loadingStats}
        />
        <StatCard
          title="Hired This Month"
          icon={Trophy}
          value={loadingStats ? "—" : (stats?.hired.thisMonth ?? 0)}
          delta={hiredDelta.label}
          deltaDir={hiredDelta.dir}
          sub="vs last month"
          sparkline={stats?.hired.sparkline ?? []}
          delay={0.36}
          loading={loadingStats}
        />
      </div>

      {/* ── Error cards ── */}
      {errorStats    && <ErrorCard message="Could not load activity stats."     onRetry={fetchStats}    />}
      {errorPipeline && <ErrorCard message="Could not load pipeline data."      onRetry={fetchPipeline} />}
      {errorHistory  && <ErrorCard message="Could not load search history."     onRetry={fetchHistory}  />}

      {/* ── Pipeline health bar (always shown) ── */}
      {!errorPipeline && <PipelineHealthBar data={pipeline} />}

      {/* ── Daily talent watchlist ── */}
      <WatchlistCard
        onRunSearch={runWatchlistSearch}
        onRefreshHistory={fetchHistory}
        onRunningChange={setWatchlistRunning}
      />

      {/* ── Bottom section — switches based on active tab ── */}
      {activeTab === "all" ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-5">
          {!errorHistory && (
            <TopTalentsSection
              searchHistory={searchHistory}
              loading={loadingHistory || watchlistRunning}
            />
          )}
          {!errorHistory && (
            <RecentSearchesSection history={searchHistory} loading={loadingHistory} />
          )}
        </div>
      ) : (
        <PipelineStageSection
          stage={activePipelineStage!}
          entries={activePipelineEntries}
          loading={loadingPipeline}
        />
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between text-[11.5px] text-slate-400 pb-2">
        <span>© GoodHive · Recruiter workspace</span>
        <span>
          Shortcut:{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10.5px] text-slate-500">
            ⌘K
          </kbd>{" "}
          to search
        </span>
      </div>
    </div>
  );
}
