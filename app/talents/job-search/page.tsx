import { Metadata } from "next";

import JobResult from "./job-result";
import Header from "@/app/components/header";
export const metadata: Metadata = {
  title: "Job Search | Talents | GoodHive",
  description: "The Decentralized Freelancing Plateforme",
};

export default function JobSearch() {
  return (
    <main className="mx-5">
      <Header />
      <h1 className="text-xl pt-16 mx-5 font-bold">
        Search Results
        <span className="text-base font-normal">- Job Listings</span>
      </h1>
      <JobResult />
    </main>
  );
}
