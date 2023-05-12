"use client";

import { useRef, useState, FormEvent } from "react";
import React from "react";

import Autosuggest from "react-autosuggest";

import toast from "react-hot-toast";

import { Button } from "../../../components/button";

export default function CreateJob() {
  const invoiceInputValue = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [value, setValue] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const dataForm = {
      title: formData.get("title"),
      typeEmployment: formData.get("type-employment"),
      designation: formData.get("designation"),
      location: formData.get("location"),
      start: formData.get("start"),
      end: formData.get("end"),
      description: formData.get("description"),
      skills: formData.get("skills"),
    };
    // TODO: POST formData to the server with fetch
    const experienceResponse = await fetch("/api/companies/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    const experienceData = await experienceResponse.json();

    setIsLoading(false);

    if (!experienceResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success("Profile Saved!");
    }
  };

  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300">
        Professional Experience
      </h1>
      <section>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col w-full mt-4">
            <div className="flex flex-col gap-4 mt-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="title"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Title*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Try Developer Solidity, Rust, C++..."
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="type-employment"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Employment Type*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Please select"
                  name="type-employment"
                  type="text"
                  required
                  pattern="[a-zA-Z ]+"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="designation"
                  className="inline-block ml-3 text-base text-black form-label mt-4"
                >
                  Company Name*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Try Developer Solidity, Rust, C++..."
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="location"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Location*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="text"
                  name="location"
                  placeholder="Paris, London, Remote..."
                  required
                  maxLength={100}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="start"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Start Date*
                </label>
                <input
                  className="form-control block me-5 w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="number"
                  name="start"
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="end"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  End Date*
                </label>
                <input
                  className="form-control block me-5 w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="number"
                  name="end"
                  maxLength={100}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="designation"
                className="inline-block ml-3 text-base text-black form-label mt-4"
              ></label>
            </div>
            <div>
              <textarea
                name="designation"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Description of the past assignement / projects"
                maxLength={255}
                rows={5}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="skills"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Skills
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                type="text"
                name="skills"
                placeholder="JavaScript, NextJS..."
                required
                maxLength={100}
              />
            </div>
            <div className="mt-10 text-right">
              {isLoading ? (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
                  type="submit"
                  disabled
                >
                  Saving...
                </button>
              ) : (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
