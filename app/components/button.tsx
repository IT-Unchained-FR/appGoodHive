import type { FC } from "react";
import { Loader } from "./loader";

interface Props {
  text: string;
  type: string;
  size: string;
  loading?: boolean;
  onClickHandler?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export const Button: FC<Props> = (props) => {
  const { text, type, size, loading = false, onClickHandler, ...rest } = props;
  let styleType = `${type}${size}`;

  switch (styleType) {
    case "primarylarge": {
      styleType =
        "my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    case "primarymedium": {
      styleType =
        "my-2 text-base bg-[#FFC905] h-12 w-44 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    case "primarysmall": {
      styleType =
        "my-2 text-base bg-[#FFC905] h-10 w-36 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    case "secondarylarge": {
      styleType =
        "my-2 text-base font-semibold border-2 border-[#FFC905] bg-[#FFC905] bg-opacity-0 h-14 w-56 rounded-full hover:bg-opacity-20 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    case "secondarymedium": {
      styleType =
        "my-2 text-base border-2 border-[#FFC905] bg-[#FFC905] bg-opacity-0 h-12 w-44 rounded-full hover:bg-opacity-20 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    case "secondarysmall": {
      styleType =
        "my-2 text-base border-2 border-[#FFC905] bg-[#FFC905] bg-opacity-0 h-10 w-36 rounded-full hover:bg-opacity-20 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    default: {
      styleType =
        "my-2 text-base bg-[#FFC905] h-12 w-44 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
  }

  return (
    <button
      className={styleType}
      onClick={onClickHandler}
      type="button"
      disabled={loading}
      {...rest}
    >
      {loading ? <Loader color="#ffffff" /> : text}
    </button>
  );
};
