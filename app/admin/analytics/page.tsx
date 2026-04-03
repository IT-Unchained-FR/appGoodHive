"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { UserGrowthChart } from "@/app/components/admin/UserGrowthChart";
import { JobTrendsChart } from "@/app/components/admin/JobTrendsChart";
import { ReportGenerator } from "@/app/components/admin/ReportGenerator";
import { StatCard } from "@/app/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Spinner from "@/app/components/Spinner/Spinner";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>;
  jobTrends: Array<{ date: string; count: number }>;
  approvalRates: Array<{
    type: string;
    approved: number;
    pending: number;
    total: number;
    approvalRate: string;
  }>;
  usersByRole: {
    talents: number;
    mentors: number;
    recruiters: number;
  };
  dailyActivity: Array<{ date: string; type: string; count: number }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);

      const response = await fetch(`/api/admin/analytics?${params.toString()}`);

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (params: {
    type: "talents" | "companies" | "jobs";
    format: "csv";
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        type: params.type,
        format: params.format,
      });

      if (params.startDate) {
        query.set("startDate", params.startDate);
      }

      if (params.endDate) {
        query.set("endDate", params.endDate);
      }

      const response = await fetch(`/api/admin/reports?${query.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `goodhive-${params.type}-report.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    fetchAnalytics();
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-lg font-medium text-gray-900 mb-2">
          Error loading analytics
        </p>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAnalytics}>Retry</Button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const talentApproval = analytics.approvalRates.find((r) => r.type === "talents");
  const companyApproval = analytics.approvalRates.find(
    (r) => r.type === "companies"
  );

  return (
    <AdminPageLayout
      title="Analytics Dashboard"
      subtitle="Platform insights and performance metrics"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Date Range Filter */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="w-full sm:flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="w-full sm:flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button onClick={handleDateRangeChange} className="gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4" />
                Apply Filter
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setDateRange({ startDate: "", endDate: "" });
                  fetchAnalytics();
                }}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReportGenerator(true)}
                className="gap-2 w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
            title="Total Talents"
            value={analytics.usersByRole.talents.toLocaleString()}
          icon={Users}
            color="blue"
            description="Approved talent users"
        />
        <StatCard
            title="Total Mentors"
            value={analytics.usersByRole.mentors.toLocaleString()}
            icon={Users}
            color="green"
            description="Approved mentor users"
        />
        <StatCard
            title="Total Recruiters"
            value={analytics.usersByRole.recruiters.toLocaleString()}
            icon={Users}
            color="purple"
            description="Approved recruiter users"
          />
          {talentApproval && (
        <StatCard
              title="Talent Approval Rate"
              value={`${talentApproval.approvalRate}%`}
              icon={CheckCircle2}
              color="green"
              description={`${talentApproval.approved} approved, ${talentApproval.pending} pending`}
        />
          )}
      </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <UserGrowthChart data={analytics.userGrowth} loading={loading} />
          <JobTrendsChart data={analytics.jobTrends} loading={loading} />
        </div>

        {/* Approval Rates */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Approval Rates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {talentApproval && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Talents</span>
                  <Badge variant="outline">{talentApproval.approvalRate}%</Badge>
          </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                    className="bg-green-500 h-2 rounded-full"
                        style={{
                      width: `${talentApproval.approvalRate}%`,
                        }}
                  />
                      </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{talentApproval.approved} approved</span>
                  <span>{talentApproval.pending} pending</span>
                  </div>
              </div>
            )}
            {companyApproval && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Companies</span>
                  <Badge variant="outline">{companyApproval.approvalRate}%</Badge>
          </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                    className="bg-blue-500 h-2 rounded-full"
                        style={{
                      width: `${companyApproval.approvalRate}%`,
                        }}
                  />
                      </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{companyApproval.approved} approved</span>
                  <span>{companyApproval.pending} pending</span>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReportGenerator
        open={showReportGenerator}
        onOpenChange={setShowReportGenerator}
        onGenerate={handleGenerateReport}
      />
      <QuickActionFAB
        actions={[
          {
            icon: Download,
            label: "Export report",
            onClick: () => setShowReportGenerator(true),
          },
          {
            icon: TrendingUp,
            label: "Refresh data",
            onClick: fetchAnalytics,
          },
          {
            icon: Users,
            label: "Talent approvals",
            href: "/admin/talent-approval",
          },
        ]}
      />
    </AdminPageLayout>
  );
}
