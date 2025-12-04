"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Network,
  Building2,
  Briefcase,
  Users,
  Shield,
  BarChart3,
  UserCheck,
  Settings,
  FileText,
  ChevronRight,
} from "lucide-react";

interface BreadcrumbsProps {
  customLabels?: Record<string, string>;
  className?: string;
}

interface RouteConfig {
  label: string;
  icon: React.ElementType;
}

const routeConfig: Record<string, RouteConfig> = {
  "/admin": { label: "Dashboard", icon: Home },
  "/admin/talents": { label: "Talents", icon: Network },
  "/admin/companies": { label: "Companies", icon: Building2 },
  "/admin/all-jobs": { label: "Jobs", icon: Briefcase },
  "/admin/users": { label: "Users", icon: Users },
  "/admin/manage-admins": { label: "Manage Admins", icon: Shield },
  "/admin/analytics": { label: "Analytics", icon: BarChart3 },
  "/admin/talent-approval": { label: "Approve Talents", icon: UserCheck },
  "/admin/company-approval": { label: "Approve Companies", icon: Building2 },
  "/admin/settings": { label: "Settings", icon: Settings },
};

interface Breadcrumb {
  label: string;
  icon: React.ElementType;
  href: string;
  isCurrent: boolean;
}

export function Breadcrumbs({ customLabels, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Breadcrumb[] = [];

    segments.forEach((segment, idx) => {
      const path = "/" + segments.slice(0, idx + 1).join("/");
      const isCurrent = idx === segments.length - 1;

      // Check if this is a dynamic segment (UUID or custom label provided)
      const isDynamic =
        segment.match(/[a-f0-9-]{36}/i) || customLabels?.[segment];

      if (isDynamic) {
        // For dynamic routes, use custom label or fallback
        const label = customLabels?.[segment] || "Detail";
        crumbs.push({
          label,
          icon: FileText,
          href: path,
          isCurrent: true,
        });
      } else {
        // For static routes, look up in route config
        const config = routeConfig[path];
        if (config) {
          crumbs.push({
            label: config.label,
            icon: config.icon,
            href: path,
            isCurrent,
          });
        }
      }
    });

    return crumbs;
  }, [pathname, customLabels]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile Breadcrumbs - Icon only */}
      <nav
        className={`md:hidden flex items-center gap-1 overflow-x-auto scrollbar-hide ${className}`}
        aria-label="Breadcrumb"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {breadcrumbs.map((crumb, idx) => {
          const Icon = crumb.icon;
          const isLast = idx === breadcrumbs.length - 1;

          return (
            <React.Fragment key={crumb.href}>
              {!isLast ? (
                <Link
                  href={crumb.href}
                  className="flex items-center text-gray-500 hover:text-[#FFC905] transition-colors"
                  aria-label={crumb.label}
                >
                  <Icon size={16} />
                </Link>
              ) : (
                <span
                  className="flex items-center text-[#FFC905]"
                  aria-current="page"
                  aria-label={crumb.label}
                >
                  <Icon size={16} />
                </span>
              )}

              {!isLast && (
                <ChevronRight
                  size={12}
                  className="text-gray-400 flex-shrink-0"
                />
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Desktop Breadcrumbs - Full text with icons */}
      <nav
        className={`hidden md:flex items-center gap-2 text-sm ${className}`}
        aria-label="Breadcrumb"
      >
        {breadcrumbs.map((crumb, idx) => {
          const Icon = crumb.icon;
          const isLast = idx === breadcrumbs.length - 1;

          return (
            <React.Fragment key={crumb.href}>
              {!isLast ? (
                <Link
                  href={crumb.href}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-[#FFC905] transition-colors"
                >
                  <Icon size={14} />
                  <span>{crumb.label}</span>
                </Link>
              ) : (
                <span
                  className="flex items-center gap-1.5 text-[#FFC905] font-medium"
                  aria-current="page"
                >
                  <Icon size={14} />
                  <span>{crumb.label}</span>
                </span>
              )}

              {!isLast && (
                <ChevronRight
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                />
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
}
