"use client";

import { AlertCircle, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface YourMatchScoreCardProps {
  jobId: string;
  talentId: string;
}

interface MatchScoreData {
  score: number | null;
  reasons: string[];
  gaps: string[];
}

function getScoreTone(score: number) {
  if (score >= 75) {
    return {
      accent: "bg-emerald-500",
      badge: "Strong fit",
      badgeClass: "bg-emerald-50 text-emerald-700",
      summary:
        "AI sees a strong overlap between your profile and this role. You likely match the core expectations well.",
    };
  }

  if (score >= 50) {
    return {
      accent: "bg-amber-500",
      badge: "Promising fit",
      badgeClass: "bg-amber-50 text-amber-700",
      summary:
        "AI sees a solid baseline fit, with a few areas you should highlight or strengthen before applying.",
    };
  }

  return {
    accent: "bg-rose-500",
    badge: "Emerging fit",
    badgeClass: "bg-rose-50 text-rose-700",
    summary:
      "AI found some alignment, but there are visible gaps. You may still be relevant if you can explain adjacent experience well.",
  };
}

export function YourMatchScoreCard({ jobId, talentId }: YourMatchScoreCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [matchScore, setMatchScore] = useState<MatchScoreData | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadMatchScore = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/ai/match-score", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId, talentId }),
        });

        if (!response.ok) {
          if (isActive) {
            setMatchScore(null);
          }
          return;
        }

        const payload = await response.json();
        const data = payload?.data as
          | {
              score?: number | null;
              reasons?: string[];
              gaps?: string[];
            }
          | undefined;

        if (!isActive) return;

        const reasons = data?.reasons;
        const gaps = data?.gaps;

        setMatchScore({
          score: typeof data?.score === "number" ? data.score : null,
          reasons: Array.isArray(reasons)
            ? reasons
                .filter((reason): reason is string => typeof reason === "string")
                .map((reason) => reason.trim())
                .filter(Boolean)
                .slice(0, 3)
            : [],
          gaps: Array.isArray(gaps)
            ? gaps
                .filter((gap): gap is string => typeof gap === "string")
                .map((gap) => gap.trim())
                .filter(Boolean)
                .slice(0, 3)
            : [],
        });
      } catch {
        if (isActive) {
          setMatchScore(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadMatchScore();

    return () => {
      isActive = false;
    };
  }, [jobId, talentId]);

  if (isLoading) {
    return (
      <section className="rounded-[30px] border border-[#e6e0d5] bg-white/95 p-6 shadow-sm sm:p-7">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 h-20 animate-pulse rounded-[24px] bg-slate-100" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
          <div className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!matchScore || matchScore.score === null) {
    return null;
  }

  const score = Math.max(0, Math.min(100, matchScore.score));
  const tone = getScoreTone(score);

  return (
    <section className="rounded-[30px] border border-[#e6e0d5] bg-white/95 p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI Match Analysis
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Why you match this role
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${tone.badgeClass}`}
        >
          <TrendingUp className="h-4 w-4" />
          {tone.badge}
        </span>
      </div>

      <div className="mt-5 rounded-[26px] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f4ea_100%)] p-5 ring-1 ring-[#eee2cb]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600">Fit for this role</p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-slate-950">
              {score}%
            </p>
          </div>
          <p className="max-w-md text-right text-sm leading-6 text-slate-600">
            {tone.summary}
          </p>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${tone.accent}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[26px] bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">
              Pros
            </p>
          </div>
          {matchScore.reasons.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {matchScore.reasons.map((reason, index) => (
                <li
                  key={`reason-${index}`}
                  className="rounded-2xl bg-white/90 px-4 py-3 text-sm leading-6 text-slate-700 ring-1 ring-emerald-100"
                >
                  {reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              AI could confirm a general fit score, but it did not return detailed strengths for this role yet.
            </p>
          )}
        </div>

        <div className="rounded-[26px] bg-rose-50/60 p-5 ring-1 ring-rose-100">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">
              Cons
            </p>
          </div>
          {matchScore.gaps.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {matchScore.gaps.map((gap, index) => (
                <li
                  key={`gap-${index}`}
                  className="rounded-2xl bg-white/90 px-4 py-3 text-sm leading-6 text-slate-700 ring-1 ring-rose-100"
                >
                  {gap}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              AI did not flag a clear weakness here, which usually means your profile is reasonably aligned with the role.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
