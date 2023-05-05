"use client";
import React from "react";

import JobResult from "./job-result";
import CompaniesResult from "./companies-result";

export default function JobListing() {
  return (
    <main className="mx-5">
      <section>
        <div className="flex flex-row">
          <div className="flex flex-col w-2/6">
            <CompaniesCard />
          </div>
          <div className="flex flex-col w-4/6 bg-white p-5 rounded-lg shadow-md mt-10 mx-2">
            <h1 className="text-2xl font-bold">Job listing</h1>
            <div className="flex flex-col">
              <JobResult />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
