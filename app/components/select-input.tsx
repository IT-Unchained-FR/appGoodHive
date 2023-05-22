import React, { FC, useState } from "react";

// TODO: move to a separate file
interface Option {
  value: string;
  label: string;
}

interface Props {
  labelText?: string;
  required: boolean;
  disabled?: boolean;
  inputValue: Option | null;
  setInputValue: any; // TODO: fix type
  options: Option[];
}

export const SelectInput: FC<Props> = ({
  labelText,
  required, // TODO: add logic
  disabled,
  inputValue,
  setInputValue,
  options,
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const handleInputClickAndCloseOptions = (option: Option) => {
    setInputValue(option);
    setIsOptionsOpen(false);
  };

  const renderOptions = options.map((option) => (
    <div
      key={option.value}
      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
      onClick={() => handleInputClickAndCloseOptions(option)}
    >
      {option.label}
    </div>
  ));

  let selectStyle =
    "block w-full mr-3 px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none";
  if (disabled) {
    selectStyle =
      "form-control block w-full px-4 py-2 text-base font-light text-gray-200 bg-white bg-clip-padding border border-solid border-[#FFF2CE] rounded-full";
  }

  return (
    <div className="relative">
      <label className="inline-block ml-3 text-base text-black form-label">
        {labelText}
      </label>
      <div className="flex items-center">
        <p
          className={selectStyle}
          onClick={() => setIsOptionsOpen(() => !isOptionsOpen)}
        >
          {inputValue ? inputValue.value : "Select on Option"}
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
          {renderOptions}
        </div>
      )}
    </div>
  );
};
