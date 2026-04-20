"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";

interface CompanyJob {
  id: string;
  title: string;
}

interface JobMatchSelectorProps {
  companyJobs: CompanyJob[];
  selectedJobId: string | null;
}

export default function JobMatchSelector({
  companyJobs,
  selectedJobId,
}: JobMatchSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const nextJobId = event.target.value.trim();

    if (nextJobId) {
      nextParams.set("jobId", nextJobId);
    } else {
      nextParams.delete("jobId");
    }

    const nextQuery = nextParams.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  return (
    <div className="w-full rounded-2xl border border-amber-200/80 bg-white/90 p-5 shadow-lg backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 shadow-sm">
          <BriefcaseBusiness className="h-4 w-4 text-white" />
        </div>
        <div>
          <label
            htmlFor="job-match-selector"
            className="block text-sm font-semibold text-gray-900"
          >
            Match talents to job
          </label>
          <p className="text-xs text-gray-500">
            Pick one of your published roles to load AI match scores.
          </p>
        </div>
      </div>

      <select
        id="job-match-selector"
        value={selectedJobId ?? ""}
        onChange={handleChange}
        disabled={companyJobs.length === 0}
        className="w-full rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      >
        <option value="">
          {companyJobs.length > 0
            ? "Select a published job"
            : "No published jobs available"}
        </option>
        {companyJobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.title}
          </option>
        ))}
      </select>
    </div>
  );
}
