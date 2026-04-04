"use client";

import React from "react";
import Image from "next/image";
import toast from "react-hot-toast";

type Stats = { talents: number | null; companies: number | null; jobs: number | null };

const AdminLogin = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [stats, setStats] = React.useState<Stats>({ talents: null, companies: null, jobs: null });

  React.useEffect(() => {
    fetch("/api/admin/public-stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
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

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: "Talents", value: stats.talents },
              { label: "Companies", value: stats.companies },
              { label: "Jobs Posted", value: stats.jobs },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-white">
                  {stat.value === null ? (
                    <span className="inline-block h-7 w-10 animate-pulse rounded bg-white/10" />
                  ) : (
                    stat.value.toLocaleString()
                  )}
                </div>
                <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
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
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-[#f9fafb] p-8">
        <div className="w-full max-w-sm">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500">Sign in to your admin dashboard</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905] transition-shadow"
                  placeholder="admin@goodhive.io"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905] transition-shadow"
                  placeholder="••••••••"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                className={`mt-2 h-11 w-full rounded-xl font-semibold text-sm text-black transition-all ${
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
                  "Sign in"
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Restricted access. Authorized personnel only.
          </p>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
