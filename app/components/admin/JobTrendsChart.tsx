"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp } from "lucide-react";

interface DataPoint {
  date: string;
  count: number;
}

interface JobTrendsChartProps {
  data: DataPoint[];
  loading?: boolean;
}

export function JobTrendsChart({ data, loading }: JobTrendsChartProps) {
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    if (data.length > 0) {
      const max = Math.max(...data.map((d) => d.count));
      console.log("JobTrendsChart - Max value:", max, "Data points:", data.length);
      console.log("JobTrendsChart - Sample data:", data.slice(0, 5));
      setMaxValue(max);
    }
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Job Posting Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFC905]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Job Posting Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalJobs = data.reduce((sum, point) => sum + point.count, 0);
  const averagePerDay = (totalJobs / data.length).toFixed(1);
  const trend =
    data.length >= 2 ? data[data.length - 1].count - data[0].count : 0;
  const safeMax = Math.max(maxValue, 1);

  // Check if all values are zero
  const allZeros = data.every(point => point.count === 0);

  // Sample data to show fewer points on chart (every nth point based on data length)
  const getSampledData = () => {
    if (data.length <= 14) return data; // Show all if 14 or fewer points

    // For larger datasets, sample to show ~12-15 points
    const sampleRate = Math.ceil(data.length / 14);
    return data.filter((_, index) => index % sampleRate === 0 || index === data.length - 1);
  };

  const sampledData = getSampledData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Job Posting Trends
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Total: {totalJobs} jobs</span>
          <span>Avg: {averagePerDay} per day</span>
          {trend !== 0 && (
            <span className={`flex items-center gap-1 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
              <TrendingUp className={`h-4 w-4 ${trend < 0 ? "rotate-180" : ""}`} />
              {trend > 0 ? "+" : ""}{trend}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {allZeros ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">No job postings in this period</p>
            <p className="text-xs mt-1">Try selecting a different date range</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bar chart representation */}
            <div className="flex items-end gap-1.5 sm:gap-2 h-64 pb-12">
              {sampledData.map((point, index) => {
                const height = (point.count / safeMax) * 100;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div className="w-full flex flex-col items-center relative">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer shadow-sm"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${point.date}: ${point.count} jobs`}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {point.count} jobs
                      </div>
                    </div>
                    {/* Date label - show on all points now that we've sampled */}
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                      {new Date(point.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
