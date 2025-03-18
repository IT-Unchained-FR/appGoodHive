"use client";

import { FC, useState, useEffect } from "react";
import { useCombobox } from "downshift";
import clsx from "clsx";

interface AutoSuggestInputProps {
  inputs: string[];
  classes?: string;
  placeholder?: string;
  selectedInputs: string[];
  setSelectedInputs: (inputs: string[]) => void;
  isSingleInput?: boolean;
}

export const AutoSuggestInput: FC<AutoSuggestInputProps> = (props) => {
  const {
    inputs,
    classes,
    placeholder = "JavaScript, NextJS,...",
    selectedInputs,
    setSelectedInputs,
    isSingleInput = false,
  } = props;

  const [inputValue, setInputValue] = useState("");

  const filteredInputs = inputs.filter(
    (input) =>
      input.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedInputs?.includes(input),
  );

  const addCustomSkill = () => {
    if (!inputValue || inputValue.trim() === "") return;

    const trimmedValue = inputValue.trim();

    // Check if value already exists in selected inputs
    if (!selectedInputs.includes(trimmedValue)) {
      if (isSingleInput) {
        setSelectedInputs([trimmedValue]);
      } else {
        setSelectedInputs([...selectedInputs, trimmedValue]);
      }
    }

    // Clear input and reset combobox
    setInputValue("");
    setTimeout(() => {
      reset();
    }, 0);
  };

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    reset,
  } = useCombobox({
    items: filteredInputs,
    inputValue,
    onInputValueChange: ({ inputValue }) => setInputValue(inputValue || ""),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        if (isSingleInput) {
          setSelectedInputs([selectedItem]);
        } else if (!selectedInputs.includes(selectedItem)) {
          setSelectedInputs([...selectedInputs, selectedItem]);
        }

        // Clear input immediately after selection
        setInputValue("");
        // Force reset the combobox state
        setTimeout(() => {
          reset();
        }, 0);
      }
    },
  });

  return (
    <div className="relative">
      <input
        {...getInputProps()}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className={clsx(
          "relative rounded-lg block w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 focus:outline-none focus:ring-0",
          classes,
        )}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            inputValue.trim() !== "" &&
            filteredInputs.length === 0
          ) {
            e.preventDefault();
            addCustomSkill();
          }
        }}
      />
      <ul
        {...getMenuProps()}
        className={clsx(
          "absolute z-10 w-full bg-white shadow-md max-h-48 overflow-y-auto border border-gray-300 rounded-md mt-1",
          { hidden: !isOpen },
        )}
      >
        {isOpen &&
          filteredInputs.map((item, index) => (
            <li
              key={index}
              {...getItemProps({ item, index })}
              className={clsx(
                "px-4 py-2 cursor-pointer",
                highlightedIndex === index
                  ? "bg-gray-200"
                  : "bg-white hover:bg-gray-100",
              )}
            >
              {item}
            </li>
          ))}
        {isOpen &&
          filteredInputs.length === 0 &&
          inputValue.trim() !== "" &&
          inputValue.trim().length > 2 && (
            <li
              className="px-4 py-2 cursor-pointer text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center"
              onClick={addCustomSkill}
            >
              <span className="mr-2">+</span>
              Add "{inputValue.trim()}" Skill
            </li>
          )}
        {isOpen &&
          (inputValue.trim() === "" || inputValue.trim().length <= 2) && (
            <li className="px-4 py-2 text-gray-500">No suggestions found</li>
          )}
      </ul>

      {/* Selected Items */}
      {/* <div className="mt-2 flex flex-wrap gap-2">
        {selectedInputs.map((input, index) => (
          <span
            key={index}
            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
          >
            {input}
            {!isSingleInput && (
              <button
                type="button"
                className="ml-2 text-blue-500 hover:text-blue-700"
                onClick={() =>
                  setSelectedInputs(
                    selectedInputs.filter((selected) => selected !== input),
                  )
                }
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div> */}
    </div>
  );
};
