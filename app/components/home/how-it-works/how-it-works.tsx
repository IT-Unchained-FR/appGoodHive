"use client";

import { TRANSLATION, videoLink } from "./how-it-works.constants";
import { Button } from "@components/button";

import { generateVideoWidthHeight } from "./how-it-works.utils";

export const HowItWorks = () => {

  const onJoinTodayClick = () => {
    /* TODO: Implement Join Today Link */
  };

  return (
    <div className="container mx-auto w-full pt-12 pb-12 flex flex-col items-center">
      <h1 className="text-black text-center text-3xl font-bold mb-6">{TRANSLATION.title}</h1>
      <p className="text-black text-center text-lg font-normal mb-16">{TRANSLATION.description}</p>
      <div className="mb-12">
        <iframe
          width="720"
          height="480"
          src={videoLink}
          title="GoodHive"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <Button
        text="Join Today"
        type="primary"
        size="medium"
        onClickHandler={onJoinTodayClick}
      />
    </div>
  );
};
