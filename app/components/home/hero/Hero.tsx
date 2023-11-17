"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@components/button";
import { TRANSLATION } from "./hero.constants";

export const Hero = () => {
  const router = useRouter();

  const onFindJobBtnClick = () => {
    router.push("/companies/search-talents");
  };

  const onFindTalentBtnClick = () => {
    router.push("/talents/job-search");
  };

  return (
    <div className="min-h-[600px] w-full relative flex bg-gradient-to-b from-[#d6c2bc] to-[#d9d9d9]">
      <div className="container flex flex-col justify-center items-center">
        <div className="absolute left-4 top-12 w-[300px] h-[315px]">
          <Image alt="client bee" src="/img/client-bee.png" fill={true} />
        </div>
        <div className="absolute right-10 top-24 w-[350px] h-[236px] z-20">
          <Image alt="swarm" src="/img/swarm.png" fill={true} />
        </div>
        <div className="h-16 w-64 mb-6 relative">
          <Image alt="logo" src="/img/goodhive-logo.png" fill={true} />
        </div>
        <div className="absolute right-0 bottom-0 w-[450px] h-[556px] z-10">
          <Image alt="honeycomb" src="/img/polygons-frame.png" fill={true} />
        </div>

        <h1 className="text-black text-center text-3xl font-bold mb-2">{TRANSLATION.title}</h1>
        <h4 className="text-black text-lg font-normal mb-4 text-center">{TRANSLATION.slogan}</h4>
        <div className="absolute left-[-10px] bottom-[-162px] w-[300px] h-[397px]">
          <Image
            alt="honeycomb-footer"
            src="/img/grey-polygons.png"
            fill={true}
          />
        </div>
        <div className="flex gap-5 mb-8">
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
