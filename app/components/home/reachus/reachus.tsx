"use client";

import Image from "next/image";

import { Button } from "@components/button";
import { TRANSLATION } from "./reachus.constants";

import "./reachus.styles.scss";

export const ReachUs = () => {
  const onContactUsClick = () => {
    /* console.log("onContactUsClick"); */
  };
  return (
    <div className="container mx-auto reach-us-section">
      <h1>{TRANSLATION.title}</h1>
      <p>{TRANSLATION.description}</p>
      <Button
        text="Contact Us"
        type="primary"
        size="medium"
        onClickHandler={onContactUsClick}
      />
      <div className="polygon-img">
        <Image alt="reach-us" src="/img/polygon.png" fill={true} />
      </div>
    </div>
  );
};
