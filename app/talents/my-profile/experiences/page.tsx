"use client";

import { FormEvent, useState } from "react";
import { useCombobox } from "downshift";
import toast from "react-hot-toast";

import LabelOption from "@interfaces/label-option";
import { SelectInput } from "../../../components/select-input";
import { employmentType } from "../../../constants/employment-type";
import { skills } from "../../../constants/skills";

export default function CreateJob() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [selectedEmploymentType, setSelectedEmploymentType] =
    useState<LabelOption | null>(null);
  const [selectedStartMonth, setSelectedStartMonth] =
    useState<LabelOption | null>(null);
  const [selectedStartYear, setSelectedStartYear] =
    useState<LabelOption | null>(null);
  const [selectedEndMonth, setSelectedEndMonth] = useState<LabelOption | null>(
    null,
  );
  const [selectedEndYear, setSelectedEndYear] = useState<LabelOption | null>(
    null,
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const startYear = Number(selectedStartYear?.value);
    const startMonth = Number(selectedStartMonth?.value);
    const contractStart = new Date(startYear, startMonth);

    const endYear = Number(selectedEndYear?.value);
    const endMonth = Number(selectedEndMonth?.value);
    const contractEnd = new Date(endYear, endMonth);

    const dataForm = {
      title: formData.get("title"),
      typeEmployment: selectedEmploymentType?.value,
      designation: formData.get("designation"),
      address: formData.get("address"),
      contractStart,
      contractEnd,
      description: formData.get("description"),
      skills: selectedSkills,
    };

    const experienceResponse = await fetch("/api/talents/experiences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    setIsLoading(false);

    if (!experienceResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success("Experience Saved!");
    }
  };

  // Get the months names as LabelOptions
  const month: LabelOption[] = Array.from({ length: 12 }, (_, index) => {
    const monthName = new Date(0, index).toLocaleString("en-US", {
      month: "long",
    });
    return { value: String(index + 1), label: monthName };
  });

  const startYear = parseInt(process.env.NEXT_PUBLIC_START_YEAR || "0");
  const endYear = parseInt(process.env.NEXT_PUBLIC_END_YEAR || "0");

  const year: LabelOption[] = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => {
      const yearValue = String(startYear + index);
      return { value: yearValue, label: yearValue };
    },
  );

  const AutoSuggestInput = () => {
    const [inputValue, setInputValue] = useState("");

    const filteredSkills = skills.filter(
      (skill) =>
        skill.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedSkills.includes(skill),
    );

    const {
      isOpen,
      getMenuProps,
      getInputProps,
      getItemProps,
      highlightedIndex,
    } = useCombobox({
      items: filteredSkills,
      inputValue,
      onInputValueChange: ({ inputValue }) => setInputValue(inputValue || ""),
      onSelectedItemChange: ({ selectedItem }) => {
        if (selectedItem && !selectedSkills.includes(selectedItem)) {
          setSelectedSkills([...selectedSkills, selectedItem]);
        }
        setInputValue("");
      },
    });

    return (
      <div className="relative">
        <input
          {...getInputProps()}
          className="relative rounded-lg block w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 focus:outline-none focus:ring-0"
          placeholder="JavaScript, NextJS,..."
        />
        <ul
          {...getMenuProps()}
          className={`absolute z-10 w-full bg-white shadow-md max-h-48 overflow-y-auto border border-gray-300 rounded-md mt-1 ${
            isOpen ? "" : "hidden"
          }`}
        >
          {isOpen &&
            filteredSkills.map((skill, index) => (
              <li
                key={skill}
                {...getItemProps({ item: skill, index })}
                className={`px-4 py-2 cursor-pointer ${
                  highlightedIndex === index
                    ? "bg-gray-200"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {skill}
              </li>
            ))}
          {isOpen && filteredSkills.length === 0 && (
            <li className="px-4 py-2 text-gray-500">No suggestions found</li>
          )}
        </ul>
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
          {/* Form contents remain the same */}
          <div className="flex flex-col w-full mt-4">
            {/* Other input fields */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="skills"
                  className="inline-block ml-3 text-base font-bold text-black form-label"
                >
                  Skills
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
                            onClick={() =>
                              setSelectedSkills(
                                selectedSkills.filter((_, i) => i !== index),
                              )
                            }
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
