"use client";

import { useEffect, useState } from "react";

import { BigNumberish } from "ethers";

import Header from "@/app/components/header";
import JobResult from "./job-result";

interface JobOffer {
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  description: string;
  duration: string;
  image: string;
  country: string;
  countryFlag: string;
  city: string;
  rate: BigNumberish;
  typeEngagement: string;
  currency: string;
  skills: string[];
  buttonText: string;
}

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
      <h1 className="text-xl pt-16 mx-5 font-bold">
        Search Results
        <span className="text-base font-normal">- Job Listings</span>
      </h1>
      <JobResult jobOffers={jobOffersData} />
    </main>
  );
}
