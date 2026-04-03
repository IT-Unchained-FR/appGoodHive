"use client";

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
        const reasons = data?.reasons;
        const gaps = data?.gaps;

        if (!isActive) return;
        setMatchScore({
          score: typeof data?.score === "number" ? data.score : null,
          reasons: Array.isArray(reasons)
            ? reasons.filter((reason): reason is string => typeof reason === "string").slice(0, 3)
            : [],
          gaps: Array.isArray(gaps)
            ? gaps.filter((gap): gap is string => typeof gap === "string").slice(0, 3)
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mb-4 h-3 w-full animate-pulse rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
        </div>
      </section>
    );
  }

  if (!matchScore || matchScore.score === null) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Your Match Score</h2>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
          <span>Fit for this role</span>
          <span>{matchScore.score}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-200">
          <div
            className="h-2.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, matchScore.score))}%` }}
          />
        </div>
      </div>

      {matchScore.reasons.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-semibold text-emerald-700">Why it matches</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {matchScore.reasons.map((reason, index) => (
              <li key={`reason-${index}`}>{"\u2713"} {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {matchScore.gaps.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-sm font-semibold text-rose-700">Gaps</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {matchScore.gaps.map((gap, index) => (
              <li key={`gap-${index}`}>{"\u2717"} {gap}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
