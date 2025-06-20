"use client";

import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { AdminTable } from "@/app/components/admin/AdminTable";
import { SearchInput } from "@/app/components/admin/SearchInput";
import { Spinner } from "@/app/components/admin/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/app/components/ui/icon";
import { IJobOffer } from "@/interfaces/job-offer";
import Image from "next/image";

export default function AdminAllJobs() {
  const [jobs, setJobs] = useState<IJobOffer[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<IJobOffer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      key: "image_url",
      header: "Image",
      width: "10%",
      render: (value: any, row: IJobOffer) => (
        <Image
          src={row.image_url || "/img/placeholder.png"}
          alt={row.title}
          width={40}
          height={40}
          className="rounded-full"
        />
      ),
    },
    {
      key: "title",
      header: "Title",
      width: "25%",
    },
    {
      key: "company_name",
      header: "Company Name",
      width: "20%",
    },
    {
      key: "chain",
      header: "Chain",
      width: "10%",
    },
    // {
    //   key: "budget",
    //   header: "Budget",
    //   width: "10%",
    //   render: (value: any, row: IJobOffer) => (
    //     <span>
    //       {row.budget} {row.currency}
    //     </span>
    //   ),
    // },
    {
      key: "published",
      header: "Status",
      width: "15%",
      render: (value: any, row: IJobOffer) => (
        <Badge variant={row.published ? "default" : "destructive"}>
          {row.published ? "Published" : "Not Published"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "15%",
      render: (value: any, row: IJobOffer) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/admin/job/${row.id}`, "_blank")}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/jobs");
      const data = await response.json();
      setJobs(data);
      setFilteredJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const filtered = jobs.filter((job) => {
      const searchStr =
        `${job.title} ${job.company_name} ${job.chain}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
    setFilteredJobs(filtered);
  }, [searchQuery, jobs]);

  return (
    <AdminPageLayout
      title="All Jobs"
      subtitle="Browse and manage all job listings"
    >
      <div className="space-y-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title, company, or chain..."
        />

        {loading ? (
          <div className="py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <AdminTable columns={columns} data={filteredJobs} />
            {filteredJobs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No jobs found
              </div>
            )}
          </>
        )}
      </div>
    </AdminPageLayout>
  );
}
