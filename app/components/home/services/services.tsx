"use client";

import { FeatureCard } from "@/app/components/feature-card";
import { TRANSLATION, allServices } from "./services.constants";

export const Services = () => {
  const onCtaClickHandler = (id: string) => {
    /* TODO: Implement Service Card click handler */
  };
  return (
    <div className="container mx-auto w-full pt-12">
      <h1 className="text-black text-center text-3xl font-bold mb-4 sm:text-2xl">
        {TRANSLATION.title}
      </h1>
      <p className="text-black text-center text-lg font-normal mb-24 sm:text-base sm:mb-12">
        {TRANSLATION.description}
      </p>
      <div className="w-full flex flex-wrap justify-center gap-12 mb-24 sm:mb-12">
        {allServices.map((service) => {
          const { id, title, description, imageSrc, btnText } = service;
          return (
            <FeatureCard
              key={id}
              id={id}
              title={title}
              description={description}
              imageSrc={imageSrc}
              btnText={btnText}
              onClickHandler={onCtaClickHandler}
            />
          );
        })}
      </div>
    </div>
  );
};
