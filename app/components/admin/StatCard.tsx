"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: "blue" | "green" | "yellow" | "purple" | "red" | "orange";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = "blue",
}: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    red: "bg-red-50 text-red-600 border-red-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 flex-wrap">
              <span
                className={`text-xs sm:text-sm font-medium ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 truncate">{description || "vs last period"}</span>
            </div>
          )}
          {description && !trend && (
            <p className="text-xs text-gray-500 mt-1 sm:mt-2">{description}</p>
          )}
        </div>
        <div
          className={`p-2 sm:p-3 rounded-lg border ${colorClasses[color]} flex-shrink-0`}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
}
