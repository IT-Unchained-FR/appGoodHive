import { SearchFilters } from "@/app/components/search-filters";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Job Search - Find Web3 & Blockchain Opportunities | GoodHive",
  description:
    "Search and discover the latest Web3 jobs, blockchain opportunities, and crypto positions. Find your next role in the decentralized economy with our comprehensive job search platform.",
  keywords:
    "Web3 jobs, blockchain jobs, crypto jobs, decentralized jobs, tech recruitment, remote jobs, freelance opportunities",
};

export default function JobSearchLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/40 to-yellow-50/30">
      <main className="">
        <SearchFilters />
        {children}
      </main>
    </div>
  );
}
