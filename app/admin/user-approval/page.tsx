"use client";

import { useEffect, useState } from "react";
import { UserTable } from "./components/UserTable";
import { UserProfileModal } from "./components/UserProfileModal";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleProfileClick = (user: any) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  const handleUpdateUserRoles = (
    userId: number,
    roles: { talent: boolean; recruiter: boolean; mentor: boolean },
  ) => {
    setUsers(
      users.map((user) => (user.id === userId ? { ...user, roles } : user)),
    );
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/talents/pending");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.log("💥", error);
      throw new Error("Failed to fetch data from the server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">
          Talents Join Requests
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
          ) : (
            <UserTable
              users={users}
              fetchData={fetchPendingUsers}
              loading={loading}
              setLoading={setLoading}
            />
          )}
        </div>
      </div>
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUpdateRoles={handleUpdateUserRoles}
        />
      )}
    </div>
  );
}
