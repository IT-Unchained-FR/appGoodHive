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
    <div className="flex flex-col h-full w-full max-w-[1200px] mx-auto p-8">
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="rounded-lg shadow-sm p-6">{children}</div>
    </div>
  );
}
