import { fetchJobs } from "@/lib/jobsearch";
import JobResult from "./job-result";
import { Pagination } from "@/app/components/pagination";

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
    <div className="mb-12">
      <h1 className="pt-16 text-xl font-bold">
        Search Results
        <span className="text-base font-normal">- Job Listings</span>
      </h1>

      <JobResult jobOffers={jobs} />

      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={count}
        query={query}
        activePage={Number(searchParams.page) || 1}
      />
    </div>
  );
}
