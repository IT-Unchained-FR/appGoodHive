"use client";

import React from "react";
import {
  Users,
  Building2,
  UserCheck,
  Layout,
  Network,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();

  // If we're on the login page, don't apply the admin layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    Cookies.remove("admin_token");
    toast.success("Logged out successfully");
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Admin Dashboard
          </h2>
        </div>

        <nav className="mt-4 flex-grow">
          <div className="px-4 py-2 text-sm font-medium text-gray-600">
            Navigation
          </div>
          <Link
            href="/admin/talent-approval"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
          >
            <UserCheck className="w-5 h-5 mr-3" />
            Approve Talents
          </Link>
          <Link
            href="/admin/company-approval"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
          >
            <Building2 className="w-5 h-5 mr-3" />
            Approve Companies
          </Link>
          <Link
            href="/admin/talents"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
          >
            <Network className="w-5 h-5 mr-3" />
            All Talents
          </Link>
          <Link
            href="/admin/companies"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
          >
            <Building2 className="w-5 h-5 mr-3" />
            All Companies
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
          >
            <Users className="w-5 h-5 mr-3" />
            All Users
          </Link>
          <Link
            href="/admin/admins"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
          >
            <Users className="w-5 h-5 mr-3" />
            Manage Admins
          </Link>
          {/* Logout Button */}
          <div className="border-t px-0 py-2">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3  hover:bg-gray-50 text-red-600 transition-colors rounded-md"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default RootLayout;
