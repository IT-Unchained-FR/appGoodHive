import { Pagination } from "@/app/components/pagination";
import { fetchJobs } from "@/lib/jobsearch";
import { Metadata } from "next";
import JobResult from "./job-result";

export const metadata: Metadata = {
  title: "Job Search - Find Web3 & Blockchain Opportunities | GoodHive",
  description:
    "Search and discover the latest Web3 jobs, blockchain opportunities, and crypto positions. Find your next role in the decentralized economy with our comprehensive job search platform.",
  keywords:
    "Web3 jobs, blockchain jobs, crypto jobs, decentralized jobs, tech recruitment, remote jobs, freelance opportunities",
};

const itemsPerPage = 9;

export const revalidate = 0;

export default async function JobSearchPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    location?: string;
    name?: string;
    page: number;
    recruiter?: string;
    mentor?: string;
  };
}) {
  const query = { items: itemsPerPage, ...searchParams };
  const { jobs, count } = (await fetchJobs(query)) || {
    jobs: [],
    count: 0,
  };

  console.log(jobs, "jobs...", count, "count...");

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-yellow-50/20 to-orange-50/30">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="pt-16 text-xl font-bold text-gray-900">
            Search Results
            <span className="text-base font-normal text-gray-600 ml-2">
              - Job Listings
            </span>
          </h1>
          <div className="pt-16 text-sm text-gray-500">
            {count > 0 ? `${count} jobs found` : "No jobs found"}
          </div>
        </div>

        <JobResult jobOffers={jobs} />

        <Pagination
          itemsPerPage={itemsPerPage}
          totalItems={count}
          query={query}
          activePage={Number(searchParams.page) || 1}
        />
      </div>
    </div>
  );
}
