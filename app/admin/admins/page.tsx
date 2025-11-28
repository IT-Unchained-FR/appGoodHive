"use client";

import { useState, useEffect } from "react";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { EnhancedTable, Column } from "@/app/components/admin/EnhancedTable";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { Button } from "@/components/ui/button";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Plus, RefreshCw } from "lucide-react";

// Update the Spinner component
const Spinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="relative w-10 h-10">
      <div className="w-10 h-10 rounded-full border-4 border-gray-200"></div>
      <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-[#FFC905] border-t-transparent animate-spin"></div>
    </div>
  </div>
);

interface Admin {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, []);

  const getAuthHeaders = () => {
    const token = Cookies.get("admin_token");
    if (!token) {
      router.push("/admin/login");
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchAdmins = async () => {
    setLoading(true); // Set loading to true when fetching starts
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch("/api/admin/admins", {
        headers,
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false); // Set loading to false when fetching ends
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("formData", formData);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setIsOpen(false);
        setFormData({ name: "", email: "", password: "" });
        fetchAdmins();
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (error) {
      setError("Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Admin>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <AdminPageLayout
      title="Manage Admins"
      subtitle="Add and manage platform administrators"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admins</h1>
        <Button onClick={() => setIsOpen(true)} className="gap-2 bg-[#FFC905] hover:bg-[#FFC905]/80 text-black">
          <Plus className="h-4 w-4" />
          Create New Admin
        </Button>
      </div>

      <EnhancedTable
        data={admins}
        columns={columns}
        searchable
        searchPlaceholder="Search admins by name or email..."
        pagination
        itemsPerPage={10}
        loading={loading}
        emptyMessage="No admins found"
        getRowId={(row) => row.id}
        mobileCardView
        renderMobileCard={(admin) => (
          <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm space-y-2">
            <div className="font-semibold text-gray-900">{admin.name}</div>
            <div className="text-sm text-gray-600 break-words">{admin.email}</div>
            <div className="text-xs text-gray-500">
              Created {new Date(admin.created_at).toLocaleDateString()}
            </div>
          </div>
        )}
      />

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-8">
            <Dialog.Title className="text-lg font-medium mb-4">
              Create New Admin
            </Dialog.Title>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC905] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC905] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC905] focus:border-transparent"
                    required
                  />
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#FFC905] text-black hover:bg-[#FFC905]/80"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Admin"}
                  </Button>
                </div>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
      <QuickActionFAB
        actions={[
          {
            icon: Plus,
            label: "New admin",
            onClick: () => setIsOpen(true),
          },
          {
            icon: RefreshCw,
            label: "Refresh list",
            onClick: fetchAdmins,
          },
        ]}
      />
    </AdminPageLayout>
  );
}
