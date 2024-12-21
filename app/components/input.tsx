import clsx from "clsx";
import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  labelText?: string;
  classes?: string;
};

export function Input({ labelText, classes, ...props }: Props) {
  const baseClasses = [
    "relative",
    "block",
    "w-full",
    "px-4",
    "py-2",
    "text-base",
    "font-normal",
    "text-gray-600",
    "bg-gray-100",
    "rounded-lg",
    "focus:outline-none",
    "focus:ring-0",
  ];

  const stateClasses = props.disabled
    ? ["font-light", "text-gray-200", "bg-gray-50", "cursor-not-allowed"]
    : [
        "hover:bg-gray-50",
        "transition-colors",
        "duration-200",
        "ease-in-out",
        "focus:text-black",
        "focus:bg-white",
      ];

  return (
    <div className="relative">
      {labelText && (
        <label className="block mb-1 ml-1 text-sm text-gray-600">
          {labelText}
        </label>
      )}
      <input className={clsx(baseClasses, stateClasses, classes)} {...props} />
    </div>
  );
}
