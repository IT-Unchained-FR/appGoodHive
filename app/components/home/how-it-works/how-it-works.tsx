"use client";

import Image from "next/image";
import { TRANSLATION, videoLink } from "./how-it-works.constants";
import { Button } from "@components/button";

export const HowItWorks = () => {
  const onJoinTodayClick = () => {
    window.open("https://discord.gg/5PU89fhn9b", "_blank");
  };

  return (
    <div className="container mx-auto w-full pt-12 pb-12 flex flex-col items-center sm:pt-5">
      <iframe
        className="w-[640px] h-[360px] lg:w-[720px] lg:h-[480px] md:w-[640px] md:h-[360px] sm:w-[320px] sm:h-[180px] mb-8"
        src="https://www.youtube.com/embed/JoAFVaxu3q4"
        title="GoodHive: Revolutionizing Recruitment for Clients and Web3 Talent!"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      <h1 className="text-black text-center text-3xl font-bold mb-6 sm:text-2xl">
        {TRANSLATION.title}
      </h1>
      <p className="text-black text-center text-lg font-normal mb-16 sm:text-base sm:mb-8">
        {TRANSLATION.description}
      </p>

      <Button
        text="Join our Discord"
        type="primary"
        size="medium"
        onClickHandler={onJoinTodayClick}
      />
    </div>
  );
};
