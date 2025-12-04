"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";

interface DataPoint {
  date: string;
  count: number;
}

interface UserGrowthChartProps {
  data: DataPoint[];
  loading?: boolean;
}

export function UserGrowthChart({ data, loading }: UserGrowthChartProps) {
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    if (data.length > 0) {
      const max = Math.max(...data.map((d) => d.count));
      console.log("UserGrowthChart - Max value:", max, "Data points:", data.length);
      console.log("UserGrowthChart - Sample data:", data.slice(0, 5));
      setMaxValue(max);
    }
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Growth
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
            <Users className="h-5 w-5" />
            User Growth
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

  const totalGrowth = data.reduce((sum, point) => sum + point.count, 0);
  const averagePerDay = (totalGrowth / data.length).toFixed(1);
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
          <Users className="h-5 w-5" />
          User Growth
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Total: {totalGrowth} users</span>
          <span>Avg: {averagePerDay} per day</span>
        </div>
      </CardHeader>
      <CardContent>
        {allZeros ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">No user registrations in this period</p>
            <p className="text-xs mt-1">Try selecting a different date range</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Simple bar chart */}
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
                        className="w-full bg-gradient-to-t from-[#FFC905] to-yellow-400 rounded-t hover:from-yellow-500 hover:to-yellow-400 transition-all cursor-pointer shadow-sm"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${point.date}: ${point.count} users`}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {point.count} users
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
