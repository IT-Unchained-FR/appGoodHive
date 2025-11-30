"use client";

export const dynamic = "force-dynamic";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { AdminFilters } from "@/app/components/admin/AdminFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IJobOffer } from "@/interfaces/job-offer";
import Image from "next/image";
import { Download, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AdminAllJobs() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<IJobOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Build URL with filter params
      const params = new URLSearchParams(searchParams.toString());
      const url = `/api/admin/jobs${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url);
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchParams]);

  const jobCards = useMemo(() => {
    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company_name,
      chain: job.chain,
      status: job.published ? "Published" : "Not Published",
      created: job.created_at,
      location: [job.city, job.country].filter(Boolean).join(", "),
      image: job.image_url,
      skills: job.skills,
    }));
  }, [jobs]);

  const columns: Column<IJobOffer>[] = [
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
      sortable: true,
    },
    {
      key: "company_name",
      header: "Company Name",
      width: "20%",
      sortable: true,
    },
    {
      key: "chain",
      header: "Chain",
      width: "10%",
      sortable: true,
    },
    {
      key: "published",
      header: "Status",
      width: "15%",
      sortable: true,
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

  const jobActions = [
    {
      icon: Download,
      label: "Export jobs",
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
    {
      icon: Filter,
      label: "Filter & sort",
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
  ];

  return (
    <AdminPageLayout
      title="All Jobs"
      subtitle="Browse and manage all job listings"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">All Job Listings</h2>
          <p className="text-sm text-muted-foreground">
            {jobs?.length || 0} jobs
          </p>
        </div>
      </div>

      {/* Admin Filters */}
      <AdminFilters
        config={{
          dateFilter: true,
          statusFilter: [
            { value: 'all', label: 'All jobs' },
            { value: 'published', label: 'Published' },
            { value: 'unpublished', label: 'Unpublished' },
          ],
          customFilters: [
            {
              key: 'location',
              label: 'Location',
              type: 'text',
              placeholder: 'Search by city or country...',
            },
          ],
          sortOptions: [
            { value: 'latest', label: 'Latest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'title-asc', label: 'Title A-Z' },
            { value: 'title-desc', label: 'Title Z-A' },
            { value: 'company-asc', label: 'Company A-Z' },
            { value: 'company-desc', label: 'Company Z-A' },
          ],
        }}
        basePath="/admin/all-jobs"
      />

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Listings Overview
              </h2>
              <p className="text-sm text-gray-600">
                Search, sort, and export all posted jobs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                Table View
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("cards")}
              >
                Card View
              </Button>
            </div>
          </div>
          {viewMode === "table" ? (
            <EnhancedTable
              data={jobs}
              columns={columns}
              searchable={true}
              searchPlaceholder="Search by title, company, or chain..."
              pagination={true}
              itemsPerPage={10}
              pageSizeOptions={[10, 25, 50]}
              exportable={true}
              loading={loading}
              emptyMessage="No jobs found"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {loading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse border border-gray-200 rounded-lg p-4 h-[220px] bg-gray-50"
                    />
                  ))
                : jobCards.map((job) => (
                    <div
                      key={job.id}
                      className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white flex flex-col gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <Image
                          src={job.image || "/img/placeholder.png"}
                          alt={job.title}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-gray-900">
                              {job.title}
                            </div>
                            <Badge
                              variant={job.status === "Published" ? "default" : "destructive"}
                              className={
                                job.status === "Published"
                                  ? "bg-black text-white"
                                  : "bg-red-500 text-white"
                              }
                            >
                              {job.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {job.company || "N/A"} • {job.chain || "Chain N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {job.location || "Location N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(job.skills || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .slice(0, 4)
                          .map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                          Created:{" "}
                          {job.created
                            ? new Date(job.created).toLocaleDateString()
                            : "N/A"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/admin/job/${job.id}`, "_blank")}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>
      <QuickActionFAB actions={jobActions} />
    </AdminPageLayout>
  );
}
