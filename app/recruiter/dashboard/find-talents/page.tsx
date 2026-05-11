"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Star,
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

const MIN_DESC_LENGTH = 50;
const MAX_DESC_LENGTH = 5000;

export default function FindTalentsPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [talents, setTalents] = useState<TopTalent[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<TopTalent | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastScoredCount, setLastScoredCount] = useState<number | null>(null);

  const charCount = jobDescription.length;
  const canSubmit = charCount >= MIN_DESC_LENGTH && charCount <= MAX_DESC_LENGTH && !isSearching;

  const findTopTalents = async () => {
    if (!canSubmit) return;

    setIsSearching(true);
    setTalents([]);
    setLastScoredCount(null);

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to find top talents");
    } finally {
      setIsSearching(false);
    }
  };

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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {talents.map((talent, index) => {
            const rateLabel = formatRateRange({
              minRate: talent.minRate ?? undefined,
              maxRate: talent.maxRate ?? undefined,
            });
            const locationLabel = getLocationLabel(talent);
            const visibleSkills = talent.skills.slice(0, 3);
            const hiddenSkillsCount = Math.max(talent.skills.length - visibleSkills.length, 0);
            const description =
              truncateText(talent.description, 160) || "No profile summary available.";

            return (
              <button
                key={talent.userId}
                type="button"
                onClick={() => setSelectedTalent(talent)}
                className="group relative flex h-[344px] w-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-amber-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,251,235,0.98)_100%)] p-5 text-left shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_28px_80px_rgba(245,158,11,0.16)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_58%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_46%)] opacity-90 transition duration-300 group-hover:opacity-100" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/80 bg-amber-100 shadow-[0_12px_30px_rgba(245,158,11,0.18)] ring-1 ring-amber-100/80">
                        <Image
                          src={talent.imageUrl || "/img/client-bee.png"}
                          alt={getDisplayName(talent)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-slate-950">
                          {getDisplayName(talent)}
                        </p>
                        <p className="line-clamp-2 break-words text-sm leading-5 text-slate-500">
                          {talent.title || "Talent"}
                        </p>
                      </div>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200/70 bg-white/85 text-sm font-bold text-amber-700 shadow-sm backdrop-blur">
                      {index + 1}
                    </span>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-white/70 bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ring-1 ${getScoreClasses(talent.score)}`}>
                        <Star className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {talent.score === null ? "No score yet" : `${talent.score}% match`}
                        </span>
                      </span>
                      <span
                        className="max-w-[42%] truncate text-xs font-medium text-slate-500"
                        title={locationLabel}
                      >
                        {locationLabel}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getScoreBarClass(talent.score)}`}
                        style={{ width: `${Math.min(Math.max(talent.score ?? 18, 12), 100)}%` }}
                      />
                    </div>

                    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 overflow-hidden">
                      <AvailabilityBadge status={talent.availabilityStatus} />
                    </div>
                  </div>

                  <p className="mt-4 min-h-[72px] flex-1 overflow-hidden break-words text-sm leading-6 text-slate-600 line-clamp-3">
                    {description}
                  </p>

                  <div className="mt-3 min-h-[52px]">
                    <div className="flex flex-wrap gap-2 overflow-hidden">
                      {visibleSkills.map((skill) => (
                        <span
                          key={skill}
                          className="max-w-full truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                          title={skill}
                        >
                          {skill}
                        </span>
                      ))}
                      {hiddenSkillsCount > 0 && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          +{hiddenSkillsCount} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-200/80 pt-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Rate
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {rateLabel ? `${talent.currency} ${rateLabel}/hr` : locationLabel}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-amber-600">
                      Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

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
