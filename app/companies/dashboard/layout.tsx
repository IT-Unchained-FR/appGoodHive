"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Plus,
  User,
  Settings,
  Menu,
  X,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AuthLayout } from "@/app/components/AuthLayout/AuthLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems: Array<{
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
}> = [
  {
    href: "/companies/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/companies/dashboard/jobs",
    label: "My Jobs",
    icon: Briefcase,
    exact: false,
  },
  {
    href: "/companies/dashboard/messages",
    label: "Messages",
    icon: MessageSquare,
    exact: false,
  },
  {
    href: "/companies/create-job",
    label: "Create Job",
    icon: Plus,
    exact: false,
  },
  {
    href: "/companies/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    exact: false,
  },
  {
    href: "/companies/my-profile",
    label: "Company Profile",
    icon: User,
    exact: false,
  },
  {
    href: "/companies/dashboard/settings",
    label: "Settings",
    icon: Settings,
    exact: false,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const isMessagesPage = pathname === "/companies/dashboard/messages";

  const isActiveRoute = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <AuthLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
        {/* Mobile overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 shadow-sm
            transform transition-all duration-300 ease-in-out
            lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:self-start lg:translate-x-0 lg:overflow-y-auto
            w-60
            ${isCollapsed ? "lg:w-16" : "lg:w-60"}
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="flex flex-col h-full py-3">
            {/* Mobile close + Desktop collapse toggle */}
            <div className={`flex mb-1 px-2 ${isCollapsed ? "justify-center" : "justify-between items-center"}`}>
              {/* Mobile: show label; Desktop collapsed: hide label */}
              {!isCollapsed && (
                <span className="lg:hidden px-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Menu
                </span>
              )}
              {/* Mobile close */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Desktop collapse toggle */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Nav items */}
            <nav className={`flex-1 space-y-0.5 ${isCollapsed ? "px-2" : "px-3"}`}>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href, item.exact);

                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`
                        flex items-center rounded-xl text-sm font-medium transition-all duration-200
                        ${isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"}
                        ${
                          isActive
                            ? "bg-amber-50 text-amber-700"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      <Icon
                        className={`
                          flex-shrink-0 h-[18px] w-[18px] transition-colors duration-200
                          ${isActive
                            ? "text-amber-500"
                            : "text-gray-400 group-hover:text-amber-500"
                          }
                        `}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>

                    {/* Tooltip — only visible when collapsed on desktop */}
                    {isCollapsed && (
                      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        {item.label}
                        {/* Arrow */}
                        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-100 shadow-sm px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile hamburger */}
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {pathname === "/companies/dashboard" && "Dashboard"}
                    {pathname === "/companies/dashboard/jobs" && "My Jobs"}
                    {pathname === "/companies/dashboard/analytics" && "Analytics"}
                    {pathname === "/companies/dashboard/settings" && "Settings"}
                    {pathname === "/companies/dashboard/messages" && "Messages"}
                    {pathname === "/companies/create-job" && "Create Job"}
                    {pathname === "/companies/my-profile" && "Company Profile"}
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Manage your jobs and grow your business
                  </p>
                </div>
              </div>

              <Link
                href={"/companies/create-job" as Route}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Job
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main
            className={
              isMessagesPage
                ? "flex-1 flex flex-col overflow-hidden"
                : "flex-1 overflow-y-auto bg-gray-50"
            }
          >
            {isMessagesPage ? (
              children
            ) : (
              <div className="container mx-auto px-4 py-6 lg:px-6">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}
