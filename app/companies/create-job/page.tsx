"use client";

import { useState, FormEvent, useContext, useEffect } from "react";
import toast from "react-hot-toast";

import { SelectInput } from "@components/select-input";
import { SearchSelectInput } from "@components/search-select-input";
import { AddressContext } from "@components/context";
import { skills } from "@/app/constants/skills";
import {
  ethereumTokens,
  polygonTokens,
  gnosisChainTokens,
} from "@/app/constants/token-list/index.js";
import { chains } from "@/app/constants/chains";
import LabelOption from "@interfaces/label-option";
import { Loader } from "@components/loader";
import { jobTypes, typeEngagements } from "@constants/common";
import { AutoSuggestInput } from "@components/autosuggest-input";

export default function CreateJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<LabelOption | null>(
    null
  );
  const [selectedChain, setSelectedChain] = useState<LabelOption | null>(null);
  const [typeEngagement, setTypeEngagement] = useState<LabelOption | null>(
    null
  );
  const [jobType, setJobType] = useState<LabelOption | null>(null);
  const [companyData, setCompanyData] = useState<any | null>(null);

  const walletAddress = useContext(AddressContext);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const dataForm = {
      title: formData.get("title"),
      typeEngagement: typeEngagement ? typeEngagement.value : "",
      description: formData.get("description"),
      duration: formData.get("duration"),
      ratePerHour: formData.get("rate-per-hour"),
      budget: formData.get("budget"),
      chain: selectedChain ? selectedChain.value : "",
      currency: selectedCurrency ? selectedCurrency.value : "",
      skills: selectedSkills,
      walletAddress,
      city: companyData?.city,
      country: companyData?.country,
      companyName: companyData?.designation,
      imageUrl: companyData?.image_url,
      jobType: jobType ? jobType.value : "",
    };

    const jobResponse = await fetch("/api/companies/create-job", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    setIsLoading(false);

    if (!jobResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success("Job Offer Saved!");
    }
  };

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/companies/my-profile?walletAddress=${walletAddress}`
      );
      const data = await response.json();
      setCompanyData(data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchCompanyData();
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <h3 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 To get started, please connect your wallet. This will enable you to
        create your company profile and create jobs.
      </h3>
    );
  }

  if (walletAddress && companyData && !companyData?.designation) {
    return (
      <h3 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 Complete your company profile first before creating a job.
      </h3>
    );
  }

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <main className="container mx-auto">
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300 ">
        Create Job
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
                  Job Header*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Job Header..."
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                />
              </div>
              <div className="w-full flex gap-5 justify-between">
                <SelectInput
                  labelText="Type of engagement"
                  name="type-engagement"
                  required={true}
                  disabled={false}
                  inputValue={typeEngagement}
                  setInputValue={setTypeEngagement}
                  options={typeEngagements}
                />

                <SelectInput
                  labelText="Job Type"
                  name="job-type"
                  required={true}
                  disabled={false}
                  inputValue={jobType}
                  setInputValue={setJobType}
                  options={jobTypes}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="inline-block mt-4 ml-3 text-base text-black form-label"
              ></label>
            </div>
            <div>
              <textarea
                name="description"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Project Description"
                maxLength={255}
                rows={5}
              />
            </div>
            <div className="relative flex flex-col gap-4 mt-12 mb-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="skills"
                  className="inline-block ml-3 text-base font-bold text-black form-label"
                >
                  Mandatory Skills*
                </label>
                <div className="absolute w-full pt-1 pr-10 text-base font-normal text-gray-600 bg-white form-control ">
                  <AutoSuggestInput
                    inputs={skills}
                    selectedInputs={selectedSkills}
                    setSelectedInputs={setSelectedSkills}
                  />
                </div>
                <div className="pt-10">
                  {!!selectedSkills && selectedSkills.length > 0 && (
                    <div className="flex flex-wrap mt-4 ">
                      {selectedSkills.map((skill, index) => (
                        <div
                          key={index}
                          className="border border-[#FFC905] flex items-center bg-gray-200 rounded-full py-1 px-3 m-1"
                        >
                          <span className="mr-2">{skill}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSkills(
                                selectedSkills.filter((_, i) => i !== index)
                              );
                            }}
                            className="w-6 text-black bg-gray-400 rounded-full"
                          >
                            &#10005;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <label
                  htmlFor="duration"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Project Duration*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="text"
                  name="duration"
                  required
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="rate-per-hour"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Expected rate per hour
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="number"
                  name="rate-per-hour"
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="budget"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Budget of the project
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="number"
                  name="budget"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex sm:w-1/4">
                <SelectInput
                  labelText="Chain"
                  name="chain"
                  required={false}
                  disabled={false}
                  inputValue={selectedChain}
                  setInputValue={setSelectedChain}
                  options={chains}
                />
              </div>
              <div className="flex sm:w-3/4">
                <SearchSelectInput
                  labelText="Currency"
                  name="currency"
                  required={false}
                  disabled={!selectedChain}
                  inputValue={selectedCurrency}
                  setInputValue={setSelectedCurrency}
                  options={
                    selectedChain?.value === "ethereum"
                      ? ethereumTokens
                      : selectedChain?.value === "polygon"
                      ? polygonTokens
                      : selectedChain?.value === "gnosis-chain"
                      ? gnosisChainTokens
                      : []
                  }
                />
              </div>
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
