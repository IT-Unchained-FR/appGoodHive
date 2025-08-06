import React, { FC, useEffect, useState, useRef } from "react";
import LabelOption from "@interfaces/label-option";

interface Props {
  labelText?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  inputValue: LabelOption | null;
  setInputValue: (option: LabelOption | null) => void;
  options: LabelOption[];
  defaultValue?: LabelOption;
  placeholder?: string;
}

export const SearchableSelectInput: FC<Props> = ({
  labelText,
  required = false,
  disabled,
  inputValue,
  options,
  defaultValue,
  setInputValue,
  placeholder = "Search...",
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValue) {
      setInputValue(defaultValue);
    }
  }, [defaultValue, setInputValue]);

  // Filter options when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOptionsOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isOptionsOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOptionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputClickAndCloseOptions = (option: LabelOption) => {
    setInputValue(option);
    setIsOptionsOpen(false);
    setSearchTerm("");
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOptionsOpen(!isOptionsOpen);
      if (!isOptionsOpen) {
        setSearchTerm("");
      }
    }
  };

  let selectStyle =
    "block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none";
  if (disabled) {
    selectStyle =
      "form-control pointer-events-none block w-full px-4 py-2 text-base font-light text-gray-200 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full";
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {labelText && (
        <label className="inline-block ml-3 text-base text-black form-label">
          {labelText}
          {required && <span>*</span>}
        </label>
      )}
      <div className="flex items-center">
        <p
          className={selectStyle}
          onClick={toggleDropdown}
          style={{
            color:
              inputValue && inputValue.label !== "Select on options"
                ? "black"
                : "gray",
          }}
        >
          {inputValue ? inputValue.label : placeholder}
        </p>
        <div className="absolute pointer-events-none right-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 text-gray-400"
          >
            <path
              fillRule="evenodd"
              d="M6.293 7.293a1 1 0 0 1 1.414 0L10 9.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {isOptionsOpen && (
        <div className="absolute z-10 w-full mt-2 overflow-y-auto bg-white rounded-md shadow-md max-h-48">
          {/* Search input */}
          <div className="sticky top-0 z-20 p-2 bg-white border-b">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-300 focus:outline-none focus:border-[#FF8C05]"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-40">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleInputClickAndCloseOptions(option)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
