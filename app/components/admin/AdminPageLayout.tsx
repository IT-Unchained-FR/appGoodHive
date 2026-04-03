"use client";

import { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  breadcrumbLabels?: Record<string, string>;
}

export function AdminPageLayout({
  title,
  subtitle,
  children,
  actions,
  breadcrumbLabels,
}: AdminPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <div className="border-b border-gray-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <Breadcrumbs customLabels={breadcrumbLabels} />
        <div className="mt-1 flex items-start justify-between gap-3 sm:items-center">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-gray-900 sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-[1480px] space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
        {children}
      </div>
    </div>
  );
}
