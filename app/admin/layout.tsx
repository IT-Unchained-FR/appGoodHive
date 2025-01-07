import React from "react";
import { Users, Building2, UserCheck, Layout, Network } from "lucide-react";
import Link from "next/link";

interface RootLayoutProps {
  children: React.ReactNode;
}
const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen bg-gray-100">
          <div className="w-64 bg-white shadow-lg">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Admin Dashboard
              </h2>
            </div>

            <nav className="mt-4">
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
                href="/admin/users"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              >
                <Users className="w-5 h-5 mr-3" />
                All Users
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          {children}
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
