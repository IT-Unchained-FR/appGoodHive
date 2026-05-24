"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { TrendingUp, Users, Search, Award } from "lucide-react";

interface AnalyticsData {
  funnel: { stage: string; count: number }[];
  weeklySearches: { week: string; searches: number }[];
  topSkills: { skill: string; count: number }[];
  hired: number;
  rejected: number;
}

const FUNNEL_COLORS = ["#f59e0b", "#3b82f6", "#a855f7", "#10b981", "#f43f5e"];
const PIE_COLORS = ["#10b981", "#f43f5e"];

export default function RecruiterAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/recruiter/analytics")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const totalPipeline = data?.funnel.reduce((s, f) => s + f.count, 0) ?? 0;
  const totalSearches = data?.weeklySearches.reduce((s, w) => s + w.searches, 0) ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Failed to load analytics. <button onClick={() => window.location.reload()} className="text-amber-600 underline">Retry</button></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Recruiter Dashboard</p>
        <h1 className="text-2xl font-semibold text-slate-900 mt-0.5">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your recruiting performance at a glance.</p>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total in Pipeline", value: totalPipeline, icon: Users, color: "text-amber-500" },
            { label: "Total Searches", value: totalSearches, icon: Search, color: "text-blue-500" },
            { label: "Hired", value: data?.hired ?? 0, icon: Award, color: "text-emerald-500" },
            { label: "Top Skill", value: data?.topSkills[0]?.skill ?? "—", icon: TrendingUp, color: "text-purple-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline Funnel + Hired/Rejected donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Pipeline Funnel</h2>
            {totalPipeline === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">No pipeline data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <FunnelChart>
                  <Tooltip formatter={(v: number) => [`${v} candidates`, ""]} />
                  <Funnel dataKey="count" data={data!.funnel} isAnimationActive>
                    {data!.funnel.map((_, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                    ))}
                    <LabelList position="center" fill="#fff" fontSize={12} fontWeight={600} dataKey="stage" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Hired vs Rejected</h2>
            {(data?.hired ?? 0) + (data?.rejected ?? 0) === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Hired", value: data?.hired ?? 0 },
                      { name: "Rejected", value: data?.rejected ?? 0 },
                    ]}
                    cx="50%" cy="45%"
                    innerRadius={60} outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly searches bar chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Search Activity (Last 8 Weeks)</h2>
          {(data?.weeklySearches.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No search history yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data!.weeklySearches} barSize={28}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="searches" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top skills */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Top Skills Across Searches</h2>
          {(data?.topSkills.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No skills data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data!.topSkills} layout="vertical" barSize={16}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}
