"use client";

import { useRef, useState, FormEvent, ChangeEvent } from "react";
import React from "react";

import Autosuggest from "react-autosuggest";

import toast from "react-hot-toast";

import { Button } from "../../components/button";

interface FileData {
  name: string;
  type: string;
  data: string | ArrayBuffer | null;
}

export default function CreateJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

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

    const jobData = await jobResponse.json();

    setIsLoading(false);

    if (!jobResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success("Profile Saved!");
    }
  };

  //TODO: Put the following code in a Autosuggest Input component
  const skills = process.env.NEXT_PUBLIC_SKILLS?.split(",") ?? [];

  const AutosuggestInput = () => {
    const [value, setValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const getSuggestions = (value: string) => {
      const inputValue = value.trim().toLowerCase();
      const inputLength = inputValue.length;

      return inputLength === 0
        ? []
        : skills.filter(
            (skill) => skill.toLowerCase().slice(0, inputLength) === inputValue
          );
    };

    const onSuggestionsFetchRequested = ({ value }: any) => {
      setSuggestions(getSuggestions(value));
    };

    const onSuggestionsClearRequested = () => {
      setSuggestions([]);
    };

    const onSuggestionSelected = (
      event: React.FormEvent<HTMLInputElement>,
      { suggestion }: Autosuggest.SuggestionSelectedEventData<any>
    ) => {
      if (selectedSkills.indexOf(suggestion) === -1) {
        setSelectedSkills([...selectedSkills, suggestion]);
      }
      setValue("");
    };

    const renderSuggestion = (suggestion: string) => (
      <div className="mx-1 px-2 bg-gray-100 hover:text-[#FFC905] ">
        {suggestion}
      </div>
    );

    const inputProps = {
      placeholder: "JavaScript, NextJS,...",
      type: "text",
      maxLength: 255,
      name: "skills",
      value,
      onChange: (
        event: React.FormEvent<HTMLElement>,
        { newValue }: { newValue: string }
      ) => {
        setValue(newValue);
      },
      className:
        " rounded-lg block me-5 w-full px-4 py-2 text-base font-normal text-gray-600 bg-clip-padding transition ease-in-out focus:text-black bg-gray-100 focus:outline-none focus:ring-0",
    };

    return (
      <div className="relative">
        <Autosuggest
          suggestions={getSuggestions(value)}
          onSuggestionsFetchRequested={onSuggestionsFetchRequested}
          onSuggestionsClearRequested={onSuggestionsClearRequested}
          getSuggestionValue={(skill) => skill}
          onSuggestionSelected={onSuggestionSelected}
          renderSuggestion={renderSuggestion}
          inputProps={inputProps}
        />
      </div>
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
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
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
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
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
                className="inline-block ml-3 text-base text-black form-label mt-4"
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
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
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
                  className="form-control block me-5 w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
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
                  className="form-control block me-5 w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="number"
                  name="budget"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="skills"
                  className="inline-block font-bold ml-3 text-base text-black form-label"
                >
                  Mandatory Skills
                </label>
                <div className=" absolute pr-10 pt-1 form-control w-full text-base font-normal text-gray-600 bg-white ">
                  <AutosuggestInput />
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
                            onClick={() =>
                              setSelectedSkills(
                                selectedSkills.filter((_, i) => i !== index)
                              )
                            }
                            className="text-black bg-gray-400 rounded-full w-6 focus:outline-none"
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
