import type { JobRequestStatus } from "@/interfaces/messenger";
import { REQUEST_FILTER_OPTIONS } from "../../_utils/messenger-helpers";

interface RequestFilterBarProps {
  current: "all" | JobRequestStatus;
  counts: Partial<Record<JobRequestStatus, number>>;
  onChange: (key: "all" | JobRequestStatus) => void;
}

export function RequestFilterBar({ current, counts, onChange }: RequestFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-slate-100">
      {REQUEST_FILTER_OPTIONS.map(({ key, label }) => {
        const count = key === "all" ? undefined : counts[key as JobRequestStatus];
        const isActive = current === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span
                className={`ml-0.5 rounded-full px-1 text-[9px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-300 text-slate-700"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
