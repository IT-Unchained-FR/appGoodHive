import React, { FC, useState, useRef } from "react";
import { HiChevronDown } from "react-icons/hi";

interface Option {
  value: string;
  label: string;
}

interface Props {
  labelText?: string;
  placeholder: string;
  required: boolean;
  name?: string;
  disabled?: boolean;
  value?: Option | null;
  onChange?: (value: Option | null) => void;
  options: Option[]; // Dynamic options
}

export const SelectInput: FC<Props> = ({
  labelText,
  placeholder,
  required,
  disabled,
  value,
  onChange,
  options,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setIsOptionsOpen(true);
  };

  const handleSelect = (option: Option) => {
    if (onChange) {
      onChange(option);
    }
    setInputValue(option.label);
    setIsOptionsOpen(false);
  };

  const handleFocus = () => {
    setIsOptionsOpen(true);
  };

  const handleBlur = () => {
    // Delay the closing of options to allow the click event on options to trigger
    setTimeout(() => {
      setIsOptionsOpen(false);
    }, 200);
  };

  let inputStyle =
    "form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none";
  if (disabled) {
    inputStyle =
      "form-control block w-full px-4 py-2 text-base font-light text-gray-200 bg-white bg-clip-padding border border-solid border-[#FFF2CE] rounded-full";
  }

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="inline-block ml-3 text-base text-black form-label">
        {labelText}
      </label>
      <div className="flex items-center">
        <input
          className={inputStyle}
          placeholder={placeholder}
          type="text"
          required={required}
          disabled={disabled}
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={inputRef}
        />
        <div className="absolute right-3 pointer-events-none">
          <HiChevronDown className="text-gray-400" />
        </div>
      </div>
      {isOptionsOpen && (
        <ul className="absolute w-full z-10 mt-2 bg-white rounded-md shadow-md max-h-48 overflow-y-auto">
          {filteredOptions.map((option) => (
            <li
              key={option.value}
              className="py-2 px-4  cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
