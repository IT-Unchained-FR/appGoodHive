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
    href: "/recruiter/dashboard/find-talents",
    label: "Find Talents",
    icon: UserRoundCheck,
    exact: false,
  },
];

const pageTitles: Record<string, string> = {
  "/recruiter/dashboard/find-talents": "Find Talents",
};

export default function RecruiterDashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const isActiveRoute = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const pageTitle = pageTitles[pathname] ?? "Recruiter Dashboard";

  return (
    <AuthLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

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
            <div className={`flex mb-1 px-2 ${isCollapsed ? "justify-center" : "justify-between items-center"}`}>
              {!isCollapsed && (
                <span className="lg:hidden px-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Menu
                </span>
              )}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
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
                          ${isActive ? "text-amber-500" : "text-gray-400 group-hover:text-amber-500"}
                        `}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>

                    {isCollapsed && (
                      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        {item.label}
                        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="bg-white border-b border-gray-100 shadow-sm px-4 py-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
                <p className="text-sm text-gray-400 mt-0.5">Recruiter Dashboard</p>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-4 py-6 lg:px-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}
