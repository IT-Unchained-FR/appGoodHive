"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Search, Award,
  Target, Zap, Clock, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

interface AnalyticsData {
  funnel: { stage: string; count: number }[];
  weeklySearches: { week: string; searches: number }[];
  topSkills: { skill: string; count: number }[];
  hired: number;
  rejected: number;
  totalPipeline: number;
  conversionRate: number;
  totalCandidatesFound: number;
  searchTrend: { thisWeek: number; lastWeek: number; total: number };
  pipelineTrend: { thisWeek: number; lastWeek: number };
  recentActivity: { stage: string; talent_name: string; talent_image: string | null; updated_at: string }[];
}

const FUNNEL_COLORS = ["#f59e0b", "#3b82f6", "#a855f7", "#10b981", "#f43f5e"];
const STAGE_COLORS: Record<string, string> = {
  Shortlisted: "bg-amber-100 text-amber-700",
  Contacted: "bg-blue-100 text-blue-700",
  Interviewing: "bg-purple-100 text-purple-700",
  Hired: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-600",
};

function trend(thisWeek: number, lastWeek: number) {
  if (lastWeek === 0 && thisWeek === 0) return null;
  if (lastWeek === 0) return { pct: 100, up: true };
  const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

function TrendBadge({ thisWeek, lastWeek }: { thisWeek: number; lastWeek: number }) {
  const t = trend(thisWeek, lastWeek);
  if (!t) return <span className="text-[11px] text-slate-400">No data yet</span>;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${t.up ? "text-emerald-600" : "text-rose-500"}`}>
      {t.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {t.pct}% vs last week
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RecruiterAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setLoading(true);
    fetch("/api/recruiter/analytics")
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Loading analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-slate-500">Failed to load analytics.</p>
        <button onClick={load} className="text-sm text-amber-600 underline">Retry</button>
      </div>
    </div>
  );

  const noData = !data || data.totalPipeline === 0 && data.searchTrend.total === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Recruiter Dashboard</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">Your recruiting performance at a glance.</p>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto">

        {noData && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700 flex items-center gap-2">
            <Zap className="w-4 h-4 shrink-0" />
            No data yet — run your first talent search and add candidates to the pipeline to see analytics here.
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Searches */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Searches</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Search className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.searchTrend.total ?? 0}</p>
            <TrendBadge thisWeek={data?.searchTrend.thisWeek ?? 0} lastWeek={data?.searchTrend.lastWeek ?? 0} />
          </div>

          {/* Candidates Found */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidates Found</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.totalCandidatesFound ?? 0}</p>
            <span className="text-[11px] text-slate-400">Across all searches</span>
          </div>

          {/* Pipeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Pipeline</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.totalPipeline ?? 0}</p>
            <TrendBadge thisWeek={data?.pipelineTrend.thisWeek ?? 0} lastWeek={data?.pipelineTrend.lastWeek ?? 0} />
          </div>

          {/* Conversion */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hire Rate</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Award className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.conversionRate ?? 0}%</p>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(data?.conversionRate ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Pipeline Funnel + Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">Pipeline Funnel</h2>
              <span className="text-xs text-slate-400">{data?.totalPipeline} total</span>
            </div>
            {(data?.totalPipeline ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
                <Target className="w-8 h-8" />
                <p className="text-sm">No pipeline data yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={230}>
                  <FunnelChart>
                    <Tooltip formatter={(v: number) => [`${v} candidates`, ""]} />
                    <Funnel dataKey="count" data={data!.funnel} isAnimationActive>
                      {data!.funnel.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i]} />)}
                      <LabelList position="center" fill="#fff" fontSize={12} fontWeight={700} dataKey="stage" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
                {/* Stage breakdown pills */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {data!.funnel.map((f) => (
                    <span key={f.stage} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STAGE_COLORS[f.stage] ?? "bg-slate-100 text-slate-600"}`}>
                      {f.stage}: {f.count}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
            </div>
            {(data?.recentActivity.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
                <Clock className="w-7 h-7" />
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data!.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      {a.talent_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-slate-800 truncate">{a.talent_name}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STAGE_COLORS[a.stage.charAt(0).toUpperCase() + a.stage.slice(1)] ?? "bg-slate-100 text-slate-500"}`}>
                        {a.stage.charAt(0).toUpperCase() + a.stage.slice(1)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(a.updated_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Hired vs Rejected + Weekly Searches ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Hired vs Rejected</h2>
            <p className="text-xs text-slate-400 mb-3">Final pipeline outcomes</p>
            {(data?.hired ?? 0) + (data?.rejected ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
                <Award className="w-7 h-7" />
                <p className="text-sm">No outcomes yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[{ name: "Hired", value: data?.hired ?? 0 }, { name: "Rejected", value: data?.rejected ?? 0 }]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      dataKey="value" paddingAngle={3}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-3 mt-1">
                  <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600">{data?.hired}</p>
                    <p className="text-[10px] text-emerald-500 font-medium">Hired</p>
                  </div>
                  <div className="flex-1 bg-rose-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-rose-500">{data?.rejected}</p>
                    <p className="text-[10px] text-rose-400 font-medium">Rejected</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-700">Search Activity</h2>
              <span className="text-xs text-slate-400">Last 8 weeks</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Number of talent searches per week</p>
            {(data?.weeklySearches.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
                <TrendingUp className="w-7 h-7" />
                <p className="text-sm">No searches yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data!.weeklySearches} barSize={30}>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc", radius: 8 }}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Bar dataKey="searches" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Top Skills ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-700">Top Skills Searched</h2>
            <span className="text-xs text-slate-400">From all candidate searches</span>
          </div>
          {(data?.topSkills.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
              <Zap className="w-7 h-7" />
              <p className="text-sm">No skills data yet</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {data!.topSkills.map((s, i) => {
                const max = data!.topSkills[0].count;
                const pct = Math.round((s.count / max) * 100);
                return (
                  <div key={s.skill} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400 w-4 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-slate-700 truncate">{s.skill}</span>
                        <span className="text-[11px] text-slate-400 ml-2 shrink-0">{s.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
