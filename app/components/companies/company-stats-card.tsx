"use client";

import { Briefcase, Users, Star, Clock } from "lucide-react";
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
        className={`modern-card p-6 ${
          isVisible ? "animate-slide-in-up" : "opacity-0"
        }`}
      >
        {/* Header */}
        <div className="section-header">
          <div className="section-icon">
            <span className="text-white text-lg">📊</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Company Insights</h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgColor} p-6 hover-lift hover-glow transition-all duration-300 cursor-pointer ${
                isVisible ? "animate-scale-in-center" : "opacity-0"
              }`}
              style={{
                animationDelay: `${(index + 1) * 0.1}s`,
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="honeycomb-pattern w-full h-full"></div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div
                  className={`${stat.color} mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {stat.icon}
                </div>

                <div className="space-y-1">
                  <p
                    className={`text-3xl font-bold ${stat.color} group-hover:animate-pulse`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    {stat.label}
                  </p>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

              {/* Floating Bee Particle on Hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity duration-300">
                <div className="bee-particle animate-float"></div>
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
        <div className="absolute top-4 right-4 opacity-10">
          <div className="w-8 h-8 animate-float-slow">
            <span className="text-2xl">🍯</span>
          </div>
        </div>
      </div>
    </div>
  );
};
