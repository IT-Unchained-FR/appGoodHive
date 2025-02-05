import { Tooltip } from "@nextui-org/tooltip";
import { FC, useEffect, useState } from "react";
import { FieldValues, UseFormSetValue } from "react-hook-form";

interface ToggleButtonProps {
  label: string;
  name: string;
  checked?: boolean;
  tooltip?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  setValue?: UseFormSetValue<FieldValues>;
  errorMessage?: string;
}

export const ToggleButton: FC<ToggleButtonProps> = (props) => {
  const { label, name, checked, tooltip, setValue, errorMessage, onChange } =
    props;

  const [isChecked, setIsChecked] = useState(checked || false);

  useEffect(() => {
    setIsChecked(checked || false);
  }, [checked]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
    setValue && setValue(name, event.target.checked);
  };

  return (
    <div className="flex flex-col">
      <label className="relative inline-flex items-center me-5 cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={isChecked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
        <span className="ms-3 text-base text-black">{label}</span>
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full text-center text-base text-white bg-[#FFC905] cursor-pointer">
              ?
            </span>
          </Tooltip>
        )}
      </label>
      {errorMessage && (
        <span className="text-sm text-red-500 mt-1">{errorMessage}</span>
      )}
    </div>
  );
};
