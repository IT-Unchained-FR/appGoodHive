"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@components/button";
import { TRANSLATION } from "./hero.constants";

export const Hero = () => {
  const router = useRouter();

  const onFindJobBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push("/talents/job-search");
  };

  const onFindTalentBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push("/companies/search-talents");
  };

  return (
    <div className="min-h-[600px] sm:min-h-[500px] sm:pt-24 w-full relative flex bg-gradient-to-b from-[#d6c2bc] to-[#d9d9d9]">
      <div className="container flex flex-col justify-center items-center">
        <div className="absolute left-4 top-12 w-[300px] h-[315px] sm:top-2.5 sm:left-0 sm:w-24 sm:h-24 md:left-0 md:w-44 md:h-44 lg:top-2.5 lg:left-12 lg:w-[250px] lg:h-[255px] xl:left-1 xl:top-4">
          <Image alt="client bee" src="/img/client-bee.png" fill={true} />
        </div>
        <div className="absolute right-10 top-24 w-[350px] h-[236px] z-20 sm:top-3 sm:right-0 sm:w-[134px] sm:h-[91px] md:right-[-3px] md:top-12 md:w-48 md:h-[135px] lg:w-[250px] lg:h-[168px] xl:w-[250px] xl:h-[168px]">
          <Image alt="swarm" src="/img/swarm.png" fill={true} />
        </div>
        <div className="h-16 w-64 mb-6 relative sm:h-11 sm:w-44">
          <Image alt="logo" src="/img/goodhive-logo.png" fill={true} />
        </div>
        <div className="absolute right-0 bottom-0 w-[400px] h-[494px] z-10 sm:top-[-75px] sm:right-[-20px] sm:w-[147px] sm:h-48 md:right[-10px] md:top-0 md:w-[180px] md:h-[221px] lg:top-0 lg:right-[-10px] lg:w-[250px] lg:h-[308px] xl:w-[250px] xl:h-[308px] xl:top-0 xl:right-[-10px]">
          <Image alt="honeycomb" src="/img/polygons-frame.png" fill={true} />
        </div>

        <h1 className="text-black text-center text-3xl font-bold mb-2 sm:text-2xl">{TRANSLATION.title}</h1>
        <h4 className="text-black text-lg font-normal mb-4 text-center sm:text-base">{TRANSLATION.slogan}</h4>
        <div className="absolute left-[-10px] bottom-[-162px] w-[300px] h-[397px] sm:w-[150px] sm:h-48 sm:left-[-19px] sm:bottom-[-47px]">
          <Image
            alt="honeycomb-footer"
            src="/img/grey-polygons.png"
            fill={true}
          />
        </div>
        <div className="flex gap-5 mb-8 z-20 sm:flex-col sm:gap-0">
          <Button
            text={TRANSLATION.findJobBtnText}
            type="primary"
            size="large"
            onClickHandler={onFindJobBtnClick}
          />
          <Button
            text={TRANSLATION.findTalentBtnText}
            type="primary"
            size="large"
            onClickHandler={onFindTalentBtnClick}
          />
        </div>
      </div>
    </div>
  );
};
