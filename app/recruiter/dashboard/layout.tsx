"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  UserRoundCheck,
  Kanban,
  LayoutDashboard,
  Hexagon,
  BarChart2,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";

import { AuthLayout } from "@/app/components/AuthLayout/AuthLayout";
import { useAuth } from "@/app/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems: Array<{
  href: Route;
  label: string;
  icon: typeof UserRoundCheck;
  exact: boolean;
}> = [
  {
    href: "/recruiter/dashboard" as Route,
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/recruiter/dashboard/find-talents",
    label: "Find Talents",
    icon: UserRoundCheck,
    exact: false,
  },
  {
    href: "/recruiter/dashboard/pipeline",
    label: "Talent Pipeline",
    icon: Kanban,
    exact: false,
  },
  {
    href: "/recruiter/dashboard/watchlist",
    label: "Daily Feed",
    icon: Target,
    exact: false,
  },
  {
    href: "/recruiter/dashboard/analytics",
    label: "Analytics",
    icon: BarChart2,
    exact: false,
  },
];

const pageTitles: Record<string, string> = {
  "/recruiter/dashboard": "Dashboard",
  "/recruiter/dashboard/find-talents": "Find Talents",
  "/recruiter/dashboard/pipeline": "Talent Pipeline",
  "/recruiter/dashboard/watchlist": "Daily Feed",
  "/recruiter/dashboard/analytics": "Analytics",
};

export default function RecruiterDashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pipelineCount, setPipelineCount] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.recruiter_status !== "approved") {
      toast.error("Recruiter access required.");
      router.replace("/talents/my-profile");
    }
  }, [user, isLoading, router]);

  // Live pipeline count for sidebar badge
  useEffect(() => {
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const total = Object.values(res.data as Record<string, unknown[]>)
            .reduce((sum, arr) => sum + arr.length, 0);
          setPipelineCount(total);
        }
      })
      .catch(() => {});
  }, []);

  const isActiveRoute = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const pageTitle = pageTitles[pathname] ?? "Recruiter Dashboard";

  const displayInitial = user?.email?.[0]?.toUpperCase() ?? "R";

  return (
    <AuthLayout>
      {/* ── Mobile overlay ── */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className="flex bg-slate-50">

        {/* ════════════════════════════════
            SIDEBAR
        ════════════════════════════════ */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-[60] flex flex-col
            bg-white border-r border-slate-200
            transition-all duration-300 ease-in-out
            lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
            ${isCollapsed ? "lg:w-[68px]" : "lg:w-[220px]"}
            w-[220px]
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* ── Brand header ── */}
          <div
            className={`flex items-center h-14 shrink-0 border-b border-slate-100 px-3 gap-2.5 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <Hexagon className="w-4 h-4 text-white fill-white/20" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-900 leading-none tracking-tight">
                  GoodHive
                </p>
                <p className="text-[10.5px] text-slate-400 mt-0.5 leading-none">
                  Recruiter Portal
                </p>
              </div>
            )}

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-auto shrink-0"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Navigation ── */}
          <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${isCollapsed ? "px-2" : "px-2.5"}`}>
            {!isCollapsed && (
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 select-none">
                Navigation
              </p>
            )}

            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href, item.exact);

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`
                      flex items-center rounded-xl text-[13px] font-medium transition-all duration-150
                      ${isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"}
                      ${
                        isActive
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      }
                    `}
                  >
                    <Icon
                      className={`flex-shrink-0 h-[17px] w-[17px] transition-colors duration-150 ${
                        isActive
                          ? "text-amber-500"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {/* Pipeline count badge */}
                    {!isCollapsed && item.label === "Talent Pipeline" && pipelineCount !== null && pipelineCount > 0 && (
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                        isActive ? "bg-amber-400/30 text-amber-800" : "bg-amber-100 text-amber-700"
                      }`}>
                        {pipelineCount}
                      </span>
                    )}

                    {/* Active dot when collapsed */}
                    {isCollapsed && isActive && (
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </Link>

                  {/* Tooltip on collapsed */}
                  {isCollapsed && (
                    <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11.5px] font-medium text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {item.label}
                      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ── Sidebar footer / user ── */}
          <div className="shrink-0 border-t border-slate-100 p-2.5">
            <div
              className={`flex items-center rounded-xl px-2 py-2 gap-2.5 hover:bg-slate-50 transition-colors cursor-default ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm">
                {displayInitial}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-slate-700 truncate leading-none">
                    {user?.email?.split("@")[0] ?? "Recruiter"}
                  </p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 leading-none truncate">
                    Recruiter
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ════════════════════════════════
            MAIN CONTENT AREA
        ════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[calc(100vh-4rem)]">

          {/* ── Sticky dashboard header ── */}
          <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-sm shadow-slate-100/80">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[13.5px] min-w-0">
              <span className="text-slate-400 font-medium hidden sm:inline">
                Recruiter
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block shrink-0" />
              <h1 className="font-semibold text-slate-900 truncate">{pageTitle}</h1>
            </div>

            {/* Right slot */}
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-[11.5px] font-semibold text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Live
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="flex-1 bg-slate-50/80">
            <div className="mx-auto max-w-screen-xl px-4 py-6 lg:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}
