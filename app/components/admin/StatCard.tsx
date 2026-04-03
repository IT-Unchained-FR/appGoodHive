"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  description?: string;
  color?: "blue" | "green" | "yellow" | "purple" | "red" | "orange";
}

const palette = {
  blue: { bg: "#eff6ff", icon: "#2563eb" },
  green: { bg: "#f0fdf4", icon: "#16a34a" },
  yellow: { bg: "#fefce8", icon: "#d97706" },
  purple: { bg: "#f5f3ff", icon: "#7c3aed" },
  red: { bg: "#fef2f2", icon: "#dc2626" },
  orange: { bg: "#fff7ed", icon: "#ea580c" },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = "blue",
}: StatCardProps) {
  const { bg, icon: iconColor } = palette[color];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:mb-2">
            {title}
          </p>
          <p className="mb-1.5 text-2xl font-bold leading-none text-gray-900 sm:mb-2 sm:text-3xl">
            {value}
          </p>
          {trend ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-xs font-semibold ${trend.isPositive ? "text-green-600" : "text-red-500"}`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}
              </span>
              {description ? (
                <span className="text-xs text-gray-400">{description}</span>
              ) : null}
            </div>
          ) : description ? (
            <p className="text-xs text-gray-400">{description}</p>
          ) : null}
        </div>
        <div
          className="flex-shrink-0 rounded-xl p-2 sm:p-2.5"
          style={{ backgroundColor: bg }}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
