"use client";

import { TRANSLATION, videoLink } from "./howitworks.constants";
import { Button } from "@components/button";

import "./howitworks.styles.scss";
import { useScreenSize } from "@hooks/useScreenSize";
import { generateVideoWidthHeight } from "./howitworks.utils";

export const HowItWorks = () => {
  const onJoinTodayClick = () => {
    /* console.log("onJoinTodayClick"); */
  };

  const { isTablet, isMobile } = useScreenSize();

  const [videoWidth, videoHeight] = generateVideoWidthHeight(
    isTablet,
    isMobile
  );

  return (
    <div className="container mx-auto how-it-works-section">
      <h1>{TRANSLATION.title}</h1>
      <p>{TRANSLATION.description}</p>
      <div className="video-section">
        <iframe
          width={videoWidth}
          height={videoHeight}
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
