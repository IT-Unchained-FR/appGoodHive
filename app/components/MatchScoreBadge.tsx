"use client";

interface MatchScoreBadgeProps {
  score: number | null;
  reasons?: string[];
  gaps?: string[];
  showTooltip?: boolean;
  loading?: boolean;
}

export function MatchScoreBadge({
  score,
  reasons = [],
  gaps = [],
  showTooltip = false,
  loading = false,
}: MatchScoreBadgeProps) {
  if (loading) {
    return (
      <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
        --% match
      </span>
    );
  }

  if (score === null) return null;

  const colorClassName =
    score >= 80
      ? "border-emerald-200 bg-emerald-100 text-emerald-800"
      : score >= 50
        ? "border-amber-200 bg-amber-100 text-amber-800"
        : "border-rose-200 bg-rose-100 text-rose-800";

  const badge = (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${colorClassName}`}
    >
      <span>{score}% match</span>
    </span>
  );

  if (!showTooltip || (reasons.length === 0 && gaps.length === 0)) {
    return badge;
  }

  return (
    <div className="group relative inline-block">
      {badge}
      <div className="absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-lg group-hover:block">
        {reasons.length > 0 && (
          <div className="mb-2">
            <p className="mb-1 font-semibold text-emerald-700">Why it matches</p>
            <ul className="space-y-0.5">
              {reasons.map((reason, index) => (
                <li key={`reason-${index}`}>{"\u2713"} {reason}</li>
              ))}
            </ul>
          </div>
        )}

        {gaps.length > 0 && (
          <div>
            <p className="mb-1 font-semibold text-rose-600">Gaps</p>
            <ul className="space-y-0.5">
              {gaps.map((gap, index) => (
                <li key={`gap-${index}`}>{"\u2717"} {gap}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
