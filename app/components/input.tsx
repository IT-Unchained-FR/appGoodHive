import clsx from "clsx";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  labelText?: string;
};

export function Input({ labelText, ...props }: Props) {
  const baseClasses = [
    "form-control",
    "block",
    "w-full",
    "px-4",
    "py-2",
    "text-base",
    "bg-white",
    "bg-clip-padding",
    "border",
    "border-solid",
    "rounded-full",
  ];

  const comlementaryClasses = props.disabled
    ? ["font-light", "text-gray-200", "border-[#FFF2CE] "]
    : [
        "font-normal",
        "text-gray-600",
        "border-[#FFC905]",
        "hover:shadow-lg",
        "transition",
        "ease-in-out",
        "m-0",
        "focus:text-black",
        "focus:bg-white",
        "focus:border-[#FF8C05]",
        "focus:outline-none",
      ];

  return (
    <div>
      <label className="inline-block ml-3 text-base text-black form-label">
        {labelText}
      </label>
      <input className={clsx(baseClasses, comlementaryClasses)} {...props} />
    </div>
  );
}
