"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@components/button";
import { TRANSLATION } from "./hero.constants";

import "./hero.styles.scss";

export const Hero = () => {
  const router = useRouter();

  const onFindJobBtnClick = () => {
    router.push("/companies/search-talents");
  };

  const onFindTalentBtnClick = () => {
    router.push("/talents/job-search");
  };

  return (
    <div className="hero-section">
      <div className="container mx-auto">
        <div className="client-bee">
          <Image alt="client bee" src="/img/client-bee.png" fill={true} />
        </div>
        <div className="swarm">
          <Image alt="swarm" src="/img/swarm.png" fill={true} />
        </div>
        <div className="goodhive-logo">
          <Image alt="logo" src="/img/goodhive-logo.png" fill={true} />
        </div>
        <div className="polygon-frame">
          <Image alt="honeycomb" src="/img/polygons-frame.png" fill={true} />
        </div>

        <h1>{TRANSLATION.title}</h1>
        <h4>{TRANSLATION.slogan}</h4>
        <div className="polygon-footer">
          <Image
            alt="honeycomb-footer"
            src="/img/grey-polygons.png"
            fill={true}
          />
        </div>
        <div className="action-buttons">
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
