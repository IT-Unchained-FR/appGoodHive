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
  console.log("Search params received:", searchParams);

  const query = { items: itemsPerPage, ...searchParams };
  const { jobs, count } = (await fetchJobs(query)) || {
    jobs: [],
    count: 0,
  };

  console.log("Jobs found:", jobs.length);
  console.log("Total count:", count);
  console.log("First job:", jobs[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-yellow-50/20 to-orange-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Search Results
              </h1>
              <p className="text-gray-600">
                Discover the latest Web3 and blockchain opportunities
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-600">
                {count > 0 ? count : 0}
              </div>
              <div className="text-sm text-gray-500">
                {count === 1 ? "job found" : "jobs found"}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {Object.keys(searchParams).some(
            (key) =>
              key !== "page" &&
              key !== "items" &&
              searchParams[key as keyof typeof searchParams],
          ) && (
            <div className="bg-white/70 rounded-lg p-4 mb-6 border border-amber-200/30">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Active Filters:
              </h3>
              <div className="flex flex-wrap gap-2">
                {searchParams.search && (
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    Skills: {searchParams.search}
                  </span>
                )}
                {searchParams.location && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Location: {searchParams.location}
                  </span>
                )}
                {searchParams.name && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Company: {searchParams.name}
                  </span>
                )}
                {searchParams.recruiter === "true" && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                    Open to Recruiter
                  </span>
                )}
                {searchParams.mentor === "true" && (
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                    Open to Mentor
                  </span>
                )}
              </div>
            </div>
          )}

          {jobs.length > 0 ? (
            <JobResult jobOffers={jobs} />
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🐝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No jobs found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search criteria or check back later for new
                opportunities.
              </p>
              <a
                href="/talents/job-search"
                className="inline-flex items-center px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Clear Filters
              </a>
            </div>
          )}

          {count > itemsPerPage && (
            <div className="mt-8">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={count}
                query={query}
                activePage={Number(searchParams.page) || 1}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
