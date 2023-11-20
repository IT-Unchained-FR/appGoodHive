import Image from "next/image";
import type { FC } from "react";

import { FeatureCardProps } from "./feature-card.types";

export const FeatureCard: FC<FeatureCardProps> = (props) => {
  const { id, title, description, imageSrc, btnText, onClickHandler } = props;

  const onCtaClickHandler = () => {
    onClickHandler(id);
  };

  return (
    <div className="w-full flex max-w-[470px] sm:max-w-[300px]">
      <div className="relative w-[353px] h-[117px] mr-5 sm:w-[360px] sm:h-[87px]">
        <Image alt="feature card polygon image" src={imageSrc} fill={true} />
      </div>
      <div className="flex flex-col">
        <h3 className="text-black text-xl font-bold mb-4 sm:text-base">
          {title}
        </h3>
        <p className="text-black text-base font-normal mb-3 sm:text-sm">
          {description}
        </p>
        <button
          className="w-[120px] h-10 rounded-2xl bg-[#ffc905] border-none text-black text-base font-normal sm:w-24 sm:h-8 sm:text-xs"
          onClick={onCtaClickHandler}
        >
          {btnText}
        </button>
      </div>
    </div>
  );
};
