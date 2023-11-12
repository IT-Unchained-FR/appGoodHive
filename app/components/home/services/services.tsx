"use client";

import { FeatureCard } from "@components/featureCard";
import { TRANSLATION, allServices } from "./services.constants";

import "./services.styles.scss";

export const Services = () => {
  const onCtaClickHandler = (id: string) => {
    console.log("onCtaClickHandler", id);
  };
  return (
    <div className="container mx-auto services-section">
      <h1>{TRANSLATION.title}</h1>
      <p>
        {TRANSLATION.description}
      </p>
      <div className="service-cards">
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
