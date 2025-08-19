"use client";

import { Briefcase, Users, Star, Clock, BarChart } from "lucide-react";
import { useEffect, useState } from "react";

interface CompanyStatsCardProps {
  totalJobs: number;
  activeJobs: number;
  completedJobs?: number;
  averageRating?: number;
  responseTime?: string;
  className?: string;
}

interface StatItem {
  id: string;
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  bgColor: string;
}

export const CompanyStatsCard = ({
  totalJobs,
  activeJobs,
  completedJobs = 0,
  averageRating = 0,
  responseTime = "< 24h",
  className = "",
}: CompanyStatsCardProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats: StatItem[] = [
    {
      id: "active",
      icon: <Briefcase className="w-6 h-6" />,
      value: activeJobs,
      label: `Active Job${activeJobs !== 1 ? "s" : ""}`,
      color: "text-[#FFC905]",
      bgColor: "from-amber-100 to-yellow-100",
    },
    {
      id: "total",
      icon: <Users className="w-6 h-6" />,
      value: totalJobs,
      label: `Total Job${totalJobs !== 1 ? "s" : ""} Posted`,
      color: "text-blue-600",
      bgColor: "from-blue-100 to-indigo-100",
    },
    {
      id: "completed",
      icon: <Star className="w-6 h-6" />,
      value: completedJobs,
      label: `Completed Project${completedJobs !== 1 ? "s" : ""}`,
      color: "text-green-600",
      bgColor: "from-green-100 to-emerald-100",
    },
    {
      id: "response",
      icon: <Clock className="w-6 h-6" />,
      value: responseTime,
      label: "Avg Response Time",
      color: "text-purple-600",
      bgColor: "from-purple-100 to-violet-100",
    },
  ];

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`modern-card p-6 hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 cursor-pointer ${
          isVisible ? "animate-slide-in-up" : "opacity-0"
        }`}
      >
        <div className="flex items-center mb-6 group">
          <div className="bg-yellow-400 hover:bg-yellow-500 rounded-full p-3 mr-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg">
            <BarChart className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
          </div>
          <h3 className="text-3xl font-bold text-amber-700 hover:text-amber-600 transition-all duration-300 group-hover:translate-x-1">Company Insights</h3>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid-enhanced">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className={`stat-card stat-${stat.id} ${
                isVisible ? "scale-in" : "opacity-0"
              } delay-${(index + 1) * 100} transform hover:scale-105 transition-transform duration-300`}
            >
              {/* Content */}
              <div className="stat-icon">
                {stat.icon}
              </div>

              <div className="stat-value">
                {stat.value}
              </div>
              <div className="stat-label">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Rating Section (if available) */}
        {averageRating > 0 && (
          <div
            className={`mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 ${
              isVisible ? "animate-slide-in-up delay-500" : "opacity-0"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white fill-current" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Company Rating
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-600">
                      {averageRating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= averageRating
                              ? "text-amber-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">
                  Based on client feedback
                </p>
                <p className="text-sm text-amber-600 font-semibold">
                  Excellent Service
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-10 hover:opacity-30 transition-opacity duration-300">
          <div className="w-8 h-8 animate-float-slow hover:animate-pulse cursor-pointer">
            <span className="text-2xl hover:scale-125 transition-transform duration-300 inline-block">🍯</span>
          </div>
        </div>
      </div>
    </div>
  );
};
