"use client";

import { useEffect, useState } from "react";

import Header from "@/app/components/header";
import JobResult from "./job-result";

import { JobOffer } from "./job-result";

export default function JobSearch() {
  const [jobOffersData, setJobOffersData] = useState<JobOffer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobOffersResponse = await fetch("/api/talents/job-search");
        if (!jobOffersResponse.ok) {
          throw new Error("Failed to fetch data from the server");
        }
        const jobOffers = await jobOffersResponse.json();
        setJobOffersData(jobOffers);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="mx-5">
      <Header />
      <h1 className="pt-16 mx-5 text-xl font-bold">
        Search Results
        <span className="text-base font-normal">- Job Listings</span>
      </h1>
      <JobResult jobOffers={jobOffersData} />
    </main>
  );
}
