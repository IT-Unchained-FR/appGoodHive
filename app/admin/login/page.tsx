"use client";

import React from "react";
import Image from "next/image";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Hexagon,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

type Stats = { talents: number | null; companies: number | null; jobs: number | null };

function isValidStatsResponse(value: unknown): value is Stats {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  const isNullableNumber = (entry: unknown) => entry === null || typeof entry === "number";

  return (
    isNullableNumber(candidate.talents) &&
    isNullableNumber(candidate.companies) &&
    isNullableNumber(candidate.jobs)
  );
}

const AdminLogin = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [stats, setStats] = React.useState<Stats>({ talents: null, companies: null, jobs: null });
  const formRef = React.useRef<HTMLFormElement>(null);
  const platformStats = [
    { label: "Talents", value: stats.talents, icon: Users },
    { label: "Companies", value: stats.companies, icon: Building2 },
    { label: "Jobs Posted", value: stats.jobs, icon: BriefcaseBusiness },
  ];

  React.useEffect(() => {
    fetch("/api/admin/public-stats")
      .then((r) => r.json())
      .then((data) => {
        if (isValidStatsResponse(data)) {
          setStats(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseBody = await response.json();

      if (response.ok) {
        if (responseBody.user?.email) {
          localStorage.setItem("admin_email", responseBody.user.email);
        }
        toast.success("Login successful!");
        window.location.assign("/admin");
      } else {
        toast.error(responseBody.message || "Login failed");
      }
    } catch (_error) {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;

    const target = e.target as HTMLElement | null;
    if (target?.tagName === "TEXTAREA") return;

    e.preventDefault();
    formRef.current?.requestSubmit();
  };

  return (
    <main className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#111111] flex-col justify-between p-12 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] rounded-full bg-[#FFC905] opacity-10 blur-[120px]" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-[#FFC905] opacity-5 blur-[100px]" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Image
            src="/img/goodhive_logo_icon.png"
            alt="GoodHive"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span className="text-xl font-bold text-white tracking-tight">GoodHive</span>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFC905]" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-widest">Admin Portal</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your<br />
            <span className="text-[#FFC905]">talent platform</span>
          </h1>
          <p className="text-white/40 text-base leading-relaxed max-w-xs">
            Full visibility over talents, companies, jobs, and platform activity — all in one place.
          </p>

          <div className="mt-7 space-y-3">
            {[
              { icon: ShieldCheck, label: "Protected admin workflows" },
              { icon: BriefcaseBusiness, label: "Review jobs, companies, and talent" },
              { icon: Sparkles, label: "Live platform pulse at a glance" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm text-white/55">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#FFC905]">
                  <item.icon className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {platformStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">{stat.label}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[#FFC905]">
                    <stat.icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {stat.value === null ? (
                    <span className="inline-block h-7 w-10 animate-pulse rounded bg-white/10" />
                  ) : (
                    stat.value.toLocaleString()
                  )}
                </div>
                <div className="mt-1 text-xs text-white/40">Live platform count</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-xs text-white/20">
          © {new Date().getFullYear()} GoodHive. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex w-full overflow-hidden bg-[linear-gradient(180deg,#fffdf7_0%,#fffaf0_28%,#f8fafc_100%)] p-8 lg:w-1/2 lg:items-center lg:justify-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,201,5,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(17,17,17,0.06),transparent_30%)]" />
          <div className="absolute right-[-80px] top-16 h-64 w-64 rounded-full bg-[#FFC905]/12 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-40px] h-72 w-72 rounded-full bg-slate-200/60 blur-3xl" />
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-black/8 to-transparent" />
          <div className="absolute right-10 top-12 hidden h-40 w-40 rounded-[2rem] border border-white/70 bg-white/35 backdrop-blur-sm lg:block" />
          <div className="absolute bottom-14 right-12 hidden h-24 w-24 rounded-full border border-white/70 bg-white/25 backdrop-blur-sm lg:block" />
          <div className="absolute right-16 top-24 hidden lg:block">
            <div className="relative h-44 w-44 text-[#d7a500]/30">
              <Hexagon className="absolute left-14 top-0 h-10 w-10" strokeWidth={1.25} />
              <Hexagon className="absolute left-0 top-16 h-10 w-10" strokeWidth={1.25} />
              <Hexagon className="absolute left-28 top-16 h-10 w-10" strokeWidth={1.25} />
              <Hexagon className="absolute left-14 top-32 h-10 w-10" strokeWidth={1.25} />
              <Hexagon className="absolute left-14 top-16 h-12 w-12 text-[#FFC905]/55" strokeWidth={1.5} />
            </div>
          </div>
          <div
            className="absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(17,17,17,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.035) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
              maskImage: "radial-gradient(circle at center, black 35%, transparent 85%)",
              WebkitMaskImage: "radial-gradient(circle at center, black 35%, transparent 85%)",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <Image
              src="/img/goodhive_logo_icon.png"
              alt="GoodHive"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-lg font-bold text-gray-900">GoodHive Admin</span>
          </div>

          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FFC905]/25 bg-[#FFC905]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#a07800]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure access
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500">Sign in to your admin dashboard</p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    className="h-11 w-full rounded-xl border border-gray-200 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905] transition-shadow"
                    placeholder="admin@goodhive.io"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    className="h-11 w-full rounded-xl border border-gray-200 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905] transition-shadow"
                    placeholder="••••••••"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                className={`mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold text-sm text-black transition-all ${
                  isLoading
                    ? "cursor-not-allowed bg-[#FFC905] opacity-60"
                    : "bg-[#FFC905] hover:bg-[#e6b400] active:scale-[0.98]"
                }`}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 hidden items-center justify-center gap-2 text-xs text-slate-500 lg:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-[#a07800]" />
            <span>Protected with admin session verification</span>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Restricted access. Authorized personnel only.
          </p>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
