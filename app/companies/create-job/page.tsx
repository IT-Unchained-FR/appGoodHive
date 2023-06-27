"use client";

import { useState, FormEvent } from "react";

import Autosuggest from "react-autosuggest";
import toast from "react-hot-toast";

import { SelectInput } from "../../components/select-input";
import { SearchSelectInput } from "../../components/search-select-input";
// TODO: use button but before add the type of the button component (i.e. type="button" or type="submit")
// import { Button } from "../../components/button";
import { skills } from "@/app/constants/skills";
import { ethereumTokens, polygonTokens, gnosisChainTokens } from "@/app/constants/token-list/index.js";
import { chains } from "@/app/constants/chains";
import LabelOption from "@interfaces/label-option";

export default function CreateJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<LabelOption | null>(null);
  const [selectedChain, setSelectedChain] = useState<LabelOption | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const dataForm = {
      title: formData.get("title"),
      typeEngagement: formData.get("type-engagement"),
      description: formData.get("description"),
      duration: formData.get("duration"),
      ratePerHour: formData.get("rate-per-hour"),
      budget: formData.get("budget"),
      currency: selectedCurrency && selectedChain ? `${selectedChain.value} ${selectedCurrency.value}` : undefined,
      skills: selectedSkills,
    };
    // TODO: POST formData to the server with fetch
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

  //TODO: Put the following code in a Autosuggest Input component
  const AutoSuggestInput = () => {
    const [inputValue, setInputValue] = useState("");

    const getSuggestions = (value: string) => {
      const inputValue = value.trim().toLowerCase();
      const inputLength = inputValue.length;

      return inputLength === 0
        ? []
        : skills.filter(
            (skill) => skill.toLowerCase().slice(0, inputLength) === inputValue
          );
    };

    const onSuggestionSelected = (
      event: React.FormEvent<HTMLInputElement>,
      { suggestion }: Autosuggest.SuggestionSelectedEventData<string>
    ) => {
      if (!selectedSkills.includes(suggestion)) {
        setSelectedSkills([...selectedSkills, suggestion]);
      }
    };

    const renderSuggestion = (suggestion: string) => (
      <div className="mx-1 px-2 py-2 z-10 hover:text-[#FF8C05] bg-white shadow-md max-h-48 overflow-y-auto border-gray-400 border-b-[0.5px] border-solid">
        {suggestion}
      </div>
    );

    const inputProps = {
      placeholder: "JavaScript, NextJS,...",
      type: "text",
      maxLength: 255,
      name: "skills",
      value: inputValue,
      onChange: (
        event: React.FormEvent<HTMLElement>,
        { newValue }: { newValue: string }
      ) => {
        setInputValue(newValue);
      },
      className:
        "relative rounded-lg block w-full px-4 py-2 text-base font-normal text-gray-600 bg-clip-padding transition ease-in-out focus:text-black bg-gray-100 focus:outline-none focus:ring-0",
    };

    return (
      <Autosuggest
        suggestions={getSuggestions(inputValue)}
        onSuggestionsFetchRequested={() => "ewffew"}
        onSuggestionsClearRequested={() => "wef"}
        getSuggestionValue={(skill) => skill}
        onSuggestionSelected={onSuggestionSelected}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
    );
  };

  return (
    <main className="mx-5">
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
                  Job Title*
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
              <div className="flex-1">
                <label
                  htmlFor="type-engagement"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Type of engagement*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Weekly, Monthly..."
                  name="type-engagement"
                  type="text"
                  required
                  pattern="[a-zA-Z ]+"
                  maxLength={100}
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
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
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
                      : selectedChain?.value === "gnosis"
                      ? gnosisChainTokens
                      : []
                  }
                />
              </div>
              </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="skills"
                  className="inline-block ml-3 text-base font-bold text-black form-label"
                >
                  Mandatory Skills
                </label>
                <div className="absolute w-full pt-1 pr-10 text-base font-normal text-gray-600 bg-white form-control ">
                  <AutoSuggestInput />
                </div>
                <div className="pt-10">
                  {selectedSkills.length > 0 && (
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