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
            <CompaniesResult />
          </div>
          <div className="flex flex-col w-4/6 bg-blend-darken shadow-gray-300 p-5 rounded-3xl shadow-xl mt-10 mx-2 box-border border-r-2 border-l-2  border-radius  bg-white">
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
