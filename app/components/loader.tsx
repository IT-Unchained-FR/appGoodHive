import type { FC } from "react";

interface LoaderProps {
  color?: string;
}

export const Loader: FC<LoaderProps> = ({ color }) => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div
        className={`animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent ${
          color ? `text-[${color}]` : "text-[#ffc905]"
        } rounded-full ${
          color ? `dark:text-[${color}]` : "dark:text-[#ffc905]"
        }`}
        role="status"
        aria-label="loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};
