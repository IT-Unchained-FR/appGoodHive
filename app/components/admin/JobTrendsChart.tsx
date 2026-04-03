"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

interface JobTrendsChartProps {
  data: DataPoint[];
  loading?: boolean;
}

export function JobTrendsChart({ data, loading }: JobTrendsChartProps) {
  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Briefcase className="h-4 w-4" />
            Job Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#FFC905]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatted = data.map((point) => ({
    ...point,
    label: new Date(`${point.date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));
  const total = data.reduce((sum, point) => sum + point.count, 0);
  const allZero = data.every((point) => point.count === 0);

  return (
    <Card className="rounded-2xl border border-gray-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Briefcase className="h-4 w-4" />
            Job Trends
          </span>
          <span className="text-xs text-gray-400">{total} jobs posted</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allZero ? (
          <div className="flex h-48 flex-col items-center justify-center text-gray-400">
            <Briefcase className="mb-2 h-10 w-10 text-gray-200" />
            <p className="text-sm">No job postings in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={formatted}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="jobGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number) => [value, "Jobs"]}
                labelFormatter={(label: string | number) => String(label)}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#jobGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
