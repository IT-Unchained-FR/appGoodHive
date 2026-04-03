"use client";

import React from "react";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const [isLoading, setIsLoading] = React.useState(false);

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
        headers: {
          "Content-Type": "application/json",
        },
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
    <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFC905]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-black">
              <path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2zm6 14.27L12 19.9l-6-3.63V7.73L12 4.1l6 3.63v8.54z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">GoodHive Admin</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-1 text-lg font-bold text-gray-900">Sign in</h2>
          <p className="mb-6 text-sm text-gray-400">Access your admin dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905]"
                placeholder="Enter admin email"
                name="email"
                type="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905]"
                placeholder="Enter password"
                name="password"
                type="password"
                required
              />
            </div>

            <button
              className={`h-11 w-full rounded-xl font-semibold text-black transition-colors ${
                isLoading
                  ? "cursor-not-allowed bg-[#FFC905] opacity-50"
                  : "bg-[#FFC905] hover:bg-[#e6b400]"
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
