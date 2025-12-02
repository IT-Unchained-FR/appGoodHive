"use client";

import { useEffect, useState } from "react";
import CompanyAdminView from "@/app/components/CompanyAdminView/CompanyAdminView";
import { EditCompanyModal } from "@/app/components/admin/EditCompanyModal";
import { ActionHistory } from "@/app/components/admin/ActionHistory";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";

type CompanyAdminViewProfileProps = {
  params: {
    user_id: string;
  };
};

export default function CompaniesPage({
  params,
}: CompanyAdminViewProfileProps) {
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user_id } = params;
  const breadcrumbLabels = company
    ? { [user_id]: company.designation || "Company Detail" }
    : undefined;

  useEffect(() => {
    fetchData();
  }, [user_id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/companies/${user_id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch company data");
      }
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      console.error("Error fetching company data:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedCompany: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/admin/companies/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCompany),
      });

      if (!response.ok) {
        throw new Error("Failed to update company");
      }

      toast.success("Company updated successfully");
      await fetchData();
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company");
      throw error;
    }
  };

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Company Details"
        subtitle="Manage company profile"
        breadcrumbLabels={breadcrumbLabels}
      >
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC905]"></div>
        </div>
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout
        title="Company Details"
        subtitle="Manage company profile"
        breadcrumbLabels={breadcrumbLabels}
      >
        <div className="text-red-500">Error: {error}</div>
      </AdminPageLayout>
    );
  }

  if (!company) {
    return (
      <AdminPageLayout
        title="Company Details"
        subtitle="Manage company profile"
        breadcrumbLabels={breadcrumbLabels}
      >
        <div>No company data found</div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={company.designation || "Company Details"}
      subtitle="Company profile details"
      breadcrumbLabels={breadcrumbLabels}
    >
      <div className="w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Company Details</h1>
          <Button
            variant="outline"
            onClick={() => setShowEditModal(true)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Company
          </Button>
        </div>

        <CompanyAdminView {...company} />

        <Card>
          <CardHeader>
            <CardTitle>Action History</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionHistory targetType="company" targetId={user_id} />
          </CardContent>
        </Card>

        <EditCompanyModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          company={company}
          onSave={handleSave}
        />
      </div>
    </AdminPageLayout>
  );
}
