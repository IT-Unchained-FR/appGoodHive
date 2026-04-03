"use client";

export const dynamic = "force-dynamic";

import Spinner from "@/app/components/Spinner/Spinner";
import { StatCard } from "@/app/components/admin/StatCard";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Statistics {
  overview: {
    totalUsers: number;
    totalTalents: number;
    totalCompanies: number;
    totalJobs: number;
    totalAdmins: number;
  };
  approvals: {
    pendingTalents: number;
    pendingCompanies: number;
    approvedTalents: number;
    approvedCompanies: number;
  };
  jobs: {
    total: number;
    published: number;
    unpublished: number;
  };
  recent: {
    usersLast7Days: number;
    jobsLast7Days: number;
  };
  profiles: {
    usersWithTalentProfiles: number;
    usersWithoutProfiles: number;
  };
}

const sectionCardClass =
  "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6";

const sectionHeaderClass = "mb-5 flex items-center justify-between";
const sectionTitleClass =
  "text-sm font-semibold uppercase tracking-wide text-gray-600";

export default function AdminDashboard() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/statistics", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <p className="mb-2 text-lg font-medium text-gray-900">
          {error || "Failed to load dashboard"}
        </p>
        <Button onClick={fetchStatistics} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const totalPending =
    statistics.approvals.pendingTalents +
    statistics.approvals.pendingCompanies;

  const quickActions = [
    {
      href: "/admin/talent-approval",
      icon: UserCheck,
      label: "Approve Talents",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      href: "/admin/company-approval",
      icon: Building2,
      label: "Approve Companies",
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
    {
      href: "/admin/talents",
      icon: Users,
      label: "All Talents",
      bg: "bg-green-50",
      text: "text-green-600",
    },
    {
      href: "/admin/companies",
      icon: Building2,
      label: "All Companies",
      bg: "bg-orange-50",
      text: "text-orange-600",
    },
    {
      href: "/admin/all-jobs",
      icon: Briefcase,
      label: "All Jobs",
      bg: "bg-yellow-50",
      text: "text-yellow-600",
    },
    {
      href: "/admin/users",
      icon: Users,
      label: "All Users",
      bg: "bg-red-50",
      text: "text-red-600",
    },
  ];

  return (
    <AdminPageLayout
      title="Dashboard"
      subtitle="Overview of your GoodHive platform"
      actions={
        <Button
          onClick={fetchStatistics}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={statistics.overview.totalUsers.toLocaleString()}
            icon={Users}
            trend={{
              value: statistics.recent.usersLast7Days,
              isPositive: true,
            }}
            description="new in last 7 days"
          />
          <StatCard
            title="Total Talents"
            value={statistics.overview.totalTalents.toLocaleString()}
            icon={UserCheck}
            trend={{
              value: statistics.approvals.approvedTalents,
              isPositive: true,
            }}
            description="approved"
            color="green"
          />
          <StatCard
            title="Total Companies"
            value={statistics.overview.totalCompanies.toLocaleString()}
            icon={Building2}
            trend={{
              value: statistics.approvals.approvedCompanies,
              isPositive: true,
            }}
            description="approved"
            color="yellow"
          />
          <StatCard
            title="Total Jobs"
            value={statistics.overview.totalJobs.toLocaleString()}
            icon={Briefcase}
            trend={{
              value: statistics.recent.jobsLast7Days,
              isPositive: true,
            }}
            description="new in last 7 days"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h3 className={sectionTitleClass}>Pending Approvals</h3>
              <AlertCircle className="h-4 w-4 text-gray-300" />
            </div>
            <div>
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <UserCheck className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Talents</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">
                    {statistics.approvals.pendingTalents}
                  </span>
                  <Link href="/admin/talent-approval">
                    <button className="whitespace-nowrap rounded-lg bg-[rgba(255,201,5,0.12)] px-3 py-1.5 text-xs font-semibold text-[#8a6d00] transition-colors hover:bg-[rgba(255,201,5,0.2)]">
                      Review
                    </button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <Building2 className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Companies</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">
                    {statistics.approvals.pendingCompanies}
                  </span>
                  <Link href="/admin/company-approval">
                    <button className="whitespace-nowrap rounded-lg bg-[rgba(255,201,5,0.12)] px-3 py-1.5 text-xs font-semibold text-[#8a6d00] transition-colors hover:bg-[rgba(255,201,5,0.2)]">
                      Review
                    </button>
                  </Link>
                </div>
              </div>
              {totalPending > 0 ? (
                <div className="pt-4">
                  <Link href="/admin/talent-approval">
                    <Button className="w-full" variant="outline">
                      View All Pending ({totalPending})
                    </Button>
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h3 className={sectionTitleClass}>Jobs Status</h3>
              <Briefcase className="h-4 w-4 text-gray-300" />
            </div>
            <div>
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                    <Briefcase className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Published</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {statistics.jobs.published}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Unpublished</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {statistics.jobs.unpublished}
                </span>
              </div>
              <div className="pt-4">
                <Link href="/admin/all-jobs">
                  <Button variant="outline" className="w-full" size="sm">
                    View All Jobs
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h3 className={sectionTitleClass}>Profile Stats</h3>
              <TrendingUp className="h-4 w-4 text-gray-300" />
            </div>
            <div>
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">With Talent Profiles</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {statistics.profiles.usersWithTalentProfiles}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Without Profiles</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {statistics.profiles.usersWithoutProfiles}
                </span>
              </div>
              <div className="pt-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full" size="sm">
                    View All Users
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h3 className={sectionTitleClass}>Quick Actions</h3>
              <TrendingUp className="h-4 w-4 text-gray-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ href, icon: Icon, label, bg, text }) => (
                <Link key={href} href={href as any}>
                  <div className="group flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} transition-transform group-hover:scale-105`}
                    >
                      <Icon className={`h-5 w-5 ${text}`} />
                    </div>
                    <span className="text-center text-xs font-medium leading-tight text-gray-600">
                      {label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h3 className={sectionTitleClass}>System Overview</h3>
              <Shield className="h-4 w-4 text-gray-300" />
            </div>
            <div>
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <Shield className="h-4 w-4 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Total Admins</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {statistics.overview.totalAdmins}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Approved Talents</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {statistics.approvals.approvedTalents}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                    <Building2 className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Approved Companies</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {statistics.approvals.approvedCompanies}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuickActionFAB
        actions={[
          {
            icon: UserCheck,
            label: "Approve talents",
            href: "/admin/talent-approval",
          },
          {
            icon: Building2,
            label: "Approve companies",
            href: "/admin/company-approval",
          },
          {
            icon: TrendingUp,
            label: "View analytics",
            href: "/admin/analytics",
          },
        ]}
      />
    </AdminPageLayout>
  );
}
