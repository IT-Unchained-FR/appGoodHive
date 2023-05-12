"use client";

import { useRef, useState, FormEvent } from "react";
import React from "react";

import Autosuggest from "react-autosuggest";

import toast from "react-hot-toast";

import { Button } from "../../../components/button";

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
      typeEmployment: formData.get("type-employment"),
      designation: formData.get("designation"),
      location: formData.get("location"),
      start: formData.get("start"),
      end: formData.get("end"),
      description: formData.get("description"),
      skills: selectedSkills,
    };

    const experienceResponse = await fetch(
      "/api/talents/my-profile/experience",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataForm),
      }
    );

    const experienceData = await experienceResponse.json();

    setIsLoading(false);

    if (!experienceResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success("Profile Saved!");
    }
  };

  //TODO: Put the following code in a Autosuggest Input component
  const languages = [
    "JavaScript",
    "Solidity",
    "SQL",
    "C#",
    "Tailwind",
    "EtherJS",
    "TypeScript",
    "IPFS",
    "ReactJS",
    "NextJS",
    // Add more skills here if needed...
  ];

  const AutosuggestInput = () => {
    const [value, setValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const getSuggestions = (value: string) => {
      const inputValue = value.trim().toLowerCase();
      const inputLength = inputValue.length;

      return inputLength === 0
        ? []
        : languages.filter(
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
      if (!selectedSkills.includes(suggestion))
        setSelectedSkills([...selectedSkills, suggestion]);
      setValue("");
    };
    const renderSuggestion = (suggestion: string) => (
      <div className="mx-4 hover:text-[#FFC905] ">{suggestion}</div>
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
        "ml-3 ml-1 pl-1 border-b border-gray-600 block me-5 w-full px-4 py-2 text-base font-normal text-gray-600 bg-clip-padding transition ease-in-out focus:text-black focus:outline-none focus:ring-0",
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
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 rounded-full bg-clip-padding border border-solid border-[#FFC905]  hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
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
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Please select"
                  name="type-employment"
                  type="text"
                  required
                  pattern="[a-zA-Z ]+"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-6 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="designation"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Company Name*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
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
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="text"
                  name="location"
                  placeholder="Paris, London, Remote..."
                  required
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-6 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="start"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Start Date*
                </label>
                <input
                  className="form-control block me-5 w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 rounded-full bg-clip-padding border border-solid border-[#FFC905]  hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
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
                  className="form-control block me-5 w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="number"
                  name="end"
                  maxLength={100}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="inline-block ml-3 text-base text-black form-label mt-6"
              ></label>
            </div>
            <div>
              <textarea
                name="description"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Description of the past assignement / projects"
                maxLength={255}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-4 mt-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="skills"
                  className="inline-block font-bold ml-3 text-base text-black form-label"
                >
                  Skills
                </label>
                <div className="absolute pr-10 pt-1 form-control w-full text-base font-normal text-gray-600 bg-white ">
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
