"use client";

import Image from "next/image";

import { Button } from "@components/button";
import { TRANSLATION } from "./reach-us.constants";

export const ReachUs = () => {
  const onContactUsClick = () => {
    window.open(
      "https://calendly.com/benoit-kulesza/virtual-coffe-10-mins",
      "_blank"
    );
  };

  const onMessageUsClick = () => {
    window.open("mailto:contact@goodhive.io");
  };

  return (
    <div className="container mx-auto bg-[#e5e5e5] w-full min-h-[300px] relative flex flex-col items-start justify-center py-8 pl-16 mb-12 sm:pl-8">
      <h1 className="text-black text-center text-3xl font-bold mb-4 sm:text-2xl">
        {TRANSLATION.title}
      </h1>
      <p className="text-black text-left text-lg font-normal mb-5 max-w-sm sm:text-base">
        {TRANSLATION.description}
      </p>
      <div className="flex gap-5">
        <Button
          text="Book a call"
          type="primary"
          size="medium"
          onClickHandler={onContactUsClick}
        />
        <Button
          text="Message us"
          type="secondary"
          size="medium"
          onClickHandler={onMessageUsClick}
        />
      </div>
      <div className="absolute right-8 top-[-90px] w-48 h-48 sm:w-28 sm:h-28 sm:top-[-50px] sm:right-5">
        <Image alt="reach-us" src="/img/polygon.png" fill={true} />
      </div>
    </div>
  );
};
