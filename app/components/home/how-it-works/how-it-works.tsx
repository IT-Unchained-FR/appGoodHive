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
      <h1 className="text-black text-center text-3xl font-bold mb-6 sm:text-2xl">
        {TRANSLATION.title}
      </h1>
      <p className="text-black text-center text-lg font-normal mb-16 sm:text-base sm:mb-8">
        {TRANSLATION.description}
      </p>
      <div className="mb-12">
        <div className="relative w-[1350px] h-[534px] lg:w-[720px] lg:h-[350px] md:w-[640px] md:h-[360px] sm:w-[350px] sm:h-[180px]">
          <Image src="/img/goodhive-mechanism.jpg" alt="Goodhive Mechanism" fill={true} />
        </div>
        {/* <iframe
          className="w-[950px] h-[534px] lg:w-[720px] lg:h-[480] md:w-[640px] md:h-[360px] sm:w-[320px] sm:h-[180px]"
          src={videoLink}
          title="GoodHive"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe> */}
      </div>
      <Button
        text="Join our Discord"
        type="primary"
        size="medium"
        onClickHandler={onJoinTodayClick}
      />
    </div>
  );
};
