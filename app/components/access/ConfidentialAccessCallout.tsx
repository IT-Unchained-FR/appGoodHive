import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

import type { ConfidentialAccessNotice } from "@/lib/auth/confidential-access-notice";

interface ConfidentialAccessCalloutProps {
  className?: string;
  notice: ConfidentialAccessNotice;
  /**
   * "banner" is the full-width listing header (steps laid out as a stepper).
   * "compact" fits a narrow sidebar column (steps stack vertically).
   */
  variant?: "banner" | "compact";
}

export function ConfidentialAccessCallout({
  className,
  notice,
  variant = "banner",
}: ConfidentialAccessCalloutProps) {
  const isCompact = variant === "compact";

  return (
    <section
      className={[
        "relative overflow-hidden rounded-3xl border border-amber-200/70 bg-white/90 backdrop-blur-sm",
        isCompact
          ? "p-5 shadow-sm"
          : "p-6 shadow-[0_18px_45px_-24px_rgba(180,120,10,0.45)] sm:p-7",
        className || "",
      ].join(" ")}
    >
      {/* Warm ambient wash — keeps the card on-brand without a heavy fill. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-amber-200/50 to-yellow-100/0 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent"
      />

      <div className="relative">
        <div
          className={
            isCompact
              ? "flex flex-col gap-4"
              : "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8"
          }
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-[0_8px_20px_-8px_rgba(217,119,6,0.8)]">
              <LockKeyhole className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Restricted
              </p>
              <h3
                className={[
                  "mt-2 font-semibold leading-tight text-gray-900",
                  isCompact ? "text-base" : "text-lg sm:text-xl",
                ].join(" ")}
              >
                {notice.title}
              </h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-600">
                {notice.description}
              </p>
            </div>
          </div>

          {notice.ctaHref ? (
            <Link
              href={notice.ctaHref}
              className={[
                "group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(217,119,6,0.9)] transition hover:from-amber-600 hover:to-yellow-600",
                isCompact ? "w-full" : "w-full lg:w-auto",
              ].join(" ")}
            >
              {notice.ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>

        <ol
          className={[
            "mt-6 gap-3",
            isCompact ? "grid grid-cols-1" : "grid grid-cols-1 sm:grid-cols-3",
          ].join(" ")}
        >
          {notice.steps.map((step, index) => (
            <li
              key={step}
              className="relative flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-amber-600 ring-1 ring-amber-200">
                {index + 1}
              </span>
              <span className="text-[13px] leading-5 text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
