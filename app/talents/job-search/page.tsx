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
    <div className="min-h-screen bg-gradient-to-br from-amber-50/20 via-white to-yellow-50/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl mb-6 shadow-lg">
            <span className="text-2xl">💼</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Job Opportunities
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Discover the latest Web3 and blockchain opportunities from top
            companies
          </p>

          {/* Stats Card */}
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-lg border border-amber-100">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-2xl font-bold text-amber-600">
                {count > 0 ? count : 0}
              </span>
              <span className="text-gray-600 font-medium">
                {count === 1
                  ? "opportunity available"
                  : "opportunities available"}
              </span>
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
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-100/50">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg mr-3 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Active Filters
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {searchParams.search && (
                  <span className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
                    <span className="mr-1">🔧</span> Skills:{" "}
                    {searchParams.search}
                  </span>
                )}
                {searchParams.location && (
                  <span className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
                    <span className="mr-1">📍</span> Location:{" "}
                    {searchParams.location}
                  </span>
                )}
                {searchParams.name && (
                  <span className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
                    <span className="mr-1">🏢</span> Company:{" "}
                    {searchParams.name}
                  </span>
                )}
                {searchParams.recruiter === "true" && (
                  <span className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
                    <span className="mr-1">👔</span> Open to Recruiters
                  </span>
                )}
                {searchParams.mentor === "true" && (
                  <span className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
                    <span className="mr-1">🎓</span> Open to Mentors
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Jobs Section */}
        <div className="">
          {jobs.length > 0 ? (
            <JobResult jobOffers={jobs} />
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  No opportunities found
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We couldn't find any jobs matching your criteria. Try
                  adjusting your filters or check back later for new
                  opportunities.
                </p>
                <a
                  href="/talents/job-search"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <span className="mr-2">🗂️</span>
                  Clear All Filters
                </a>
              </div>
            </div>
          )}

          {count > itemsPerPage && (
            <div className="mt-12 flex justify-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-100">
                <Pagination
                  itemsPerPage={itemsPerPage}
                  totalItems={count}
                  query={query}
                  activePage={Number(searchParams.page) || 1}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
