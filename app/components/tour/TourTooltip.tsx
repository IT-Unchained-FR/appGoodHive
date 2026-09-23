"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import type { TooltipRenderProps } from "react-joyride";

export function TourTooltip({
  index,
  size,
  step,
  isLastStep,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const progress = ((index + 1) / size) * 100;

  return (
    <div
      {...tooltipProps}
      className="relative w-[380px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl bg-white text-left shadow-[0_24px_60px_-12px_rgba(17,24,39,0.35)] ring-1 ring-black/5"
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-amber-100">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200">
            Step {index + 1} of {size}
          </span>
          <button
            {...closeProps}
            type="button"
            className="-mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step.title && (
          <h3 className="mb-2 text-lg font-semibold leading-snug tracking-tight text-gray-900">
            {step.title}
          </h3>
        )}
        <div className="text-[15px] leading-relaxed text-gray-600">
          {step.content}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          {!isLastStep ? (
            <button
              {...skipProps}
              type="button"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-gray-700 focus:outline-none focus-visible:underline"
            >
              Skip tour
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                {...backProps}
                type="button"
                aria-label="Back"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <button
              {...primaryProps}
              type="button"
              className="group inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 transition-all hover:shadow-lg hover:shadow-amber-500/35 hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
            >
              {isLastStep ? (
                <>
                  Let&apos;s go
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  {index === 0 ? "Start tour" : "Next"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
