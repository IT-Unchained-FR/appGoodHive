import Image from "next/image";
import { FC, useEffect, useState } from "react";

type SocialLinkProps = {
  name: string;
  icon: string;
  placeholder: string;
  defaultValue: string;
  isRequired?: boolean;
  setValue: (name: string, value: string) => void;
  errorMessage?: string;
};

export const SocialLink: FC<SocialLinkProps> = (props) => {
  const {
    name,
    icon,
    placeholder,
    defaultValue,
    isRequired = false,
    setValue,
    errorMessage,
  } = props;

  const [inputValue, setInputValue] = useState(defaultValue || "");

  // Update local state when default value changes
  useEffect(() => {
    setInputValue(defaultValue || "");
  }, [defaultValue]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    // Always pass the value to parent component, even if it's empty
    setValue(name, newValue);
  };

  return (
    <div className="flex w-full mt-9">
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden">
        <Image src={icon} alt="social-icon" fill />
      </div>
      <div className="w-full">
        <input
          className="form-control block w-full px-4 py-2 ml-3 text-base font-normal text-gray-600 bg-white bg-clip-padding border-b border-solid hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:outline-none"
          placeholder={placeholder}
          type="text"
          name={name}
          maxLength={255}
          value={inputValue}
          required={isRequired}
          onChange={handleChange}
        />
        {errorMessage && (
          <span className="text-red-500 text-sm mt-1">{errorMessage}</span>
        )}
      </div>
    </div>
  );
};
