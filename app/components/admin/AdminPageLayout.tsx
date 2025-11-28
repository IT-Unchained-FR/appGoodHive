"use client";

import { ReactNode } from "react";

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AdminPageLayout({
  title,
  subtitle,
  children,
}: AdminPageLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full max-w-[1480px] mx-auto px-3 sm:px-4 lg:px-6 py-5 lg:py-6 gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
