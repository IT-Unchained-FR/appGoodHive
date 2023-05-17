import React, { FC, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  labelText?: string;
  placeholder: string;
  required: boolean;
  name?: string;
  inputValue: string | null;
  setInputValue: any;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  options: Option[];
}

export const SelectInput: FC<Props> = ({
  labelText,
  placeholder,
  required,
  disabled,
  inputValue,
  setInputValue,
  onChange,
  options,
}) => {
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const handleSelectInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedValue = event.target.value;
    const option = options.find((option) => option.value === selectedValue);
    setInputValue(option || null);

    console.log(inputValue);
    console.log(selectedValue);
  };

  const handleInputClick = (option: Option) => {
    setInputValue(option.label);
    setIsOptionsOpen(false);
  };

  const renderOptions = filteredOptions.map((option) => (
    <div
      key={option.value}
      className="py-2 px-4 cursor-pointer hover:bg-gray-100"
      onClick={() => handleInputClick(option)}
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
        <input
          className={selectStyle}
          disabled={false}
          value={inputValue || ""}
          onChange={handleSelectInputChange}
          onFocus={() => setIsOptionsOpen(true)}
        />
        <div className="absolute right-6 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5 text-gray-400"
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
        <div className="absolute w-full z-10 mt-2 bg-white rounded-md shadow-md max-h-48 overflow-y-auto">
          {renderOptions}
        </div>
      )}
    </div>
  );
};
