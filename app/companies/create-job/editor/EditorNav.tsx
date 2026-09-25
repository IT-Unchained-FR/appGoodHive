"use client";

import { useEffect, useState } from "react";

export interface EditorStep {
  id: string;
  label: string;
  done: boolean;
}

/**
 * Left-hand section nav. For a job that's still being written it reads as
 * numbered steps; once submitted it's an "on this page" index where an
 * unfinished section shows a warning mark.
 */
export function EditorNav({ steps, mode }: { steps: EditorStep[]; mode: "steps" | "index" }) {
  const [activeId, setActiveId] = useState(steps[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    for (const step of steps) {
      const el = document.getElementById(step.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // Re-observe only when the set of sections changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.map((s) => s.id).join("|")]);

  return (
    <nav aria-label="Form sections" className="sticky top-24 flex flex-col gap-0.5">
      <div className="px-3 pb-2 text-[11px] font-extrabold tracking-[1px] text-[#8A8474]">
        {mode === "steps" ? "STEPS" : "ON THIS PAGE"}
      </div>
      {steps.map((step, index) => {
        const active = step.id === activeId;
        return (
          <a
            key={step.id}
            href={`#${step.id}`}
            aria-current={active ? "step" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold no-underline transition-colors hover:bg-[#EFEDE6] hover:text-[#1C1B17] ${
              active && mode === "steps" ? "bg-[#FFF6DB] text-[#1C1B17]" : "text-[#4A463C]"
            }`}
          >
            {step.done ? (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1F9D4C] text-[11px] text-white">
                ✓
              </span>
            ) : mode === "index" ? (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#F5B800] text-xs font-extrabold text-[#1C1B17]">
                !
              </span>
            ) : (
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-extrabold ${
                  active ? "bg-[#F5B800] text-[#1C1B17]" : "border border-[#C9C3B2]"
                }`}
              >
                {index + 1}
              </span>
            )}
            {step.label}
          </a>
        );
      })}
    </nav>
  );
}
