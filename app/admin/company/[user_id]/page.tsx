"use client";

import { useEffect, useState } from "react";
import CompanyAdminView from "@/app/components/CompanyAdminView/CompanyAdminView";
import { getCompanyData } from "@/lib/fetch-company-data";

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
  const { user_id } = params;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/company?user_id=${user_id}`);
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

    fetchData();
  }, [user_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!company) {
    return <div>No company data found</div>;
  }

  return <CompanyAdminView {...company} />;
}
