import type { FC } from "react";
import Image from "next/image";

import { FeatureCardProps } from "./featureCard.types";
import "./featureCard.styles.scss";

export const FeatureCard: FC<FeatureCardProps> = (props) => {
  const { id, title, description, imageSrc, btnText, onClickHandler } = props;

  const onCtaClickHandler = () => {
    onClickHandler(id);
  }

  return (
    <div className="feature-card">
      <div className="img-container">
        <Image alt="polygon" src={imageSrc} fill={true} />
      </div>
      <div className="card-info">
        <h3>{title}</h3>
        <p>{description}</p>
        <button onClick={onCtaClickHandler}>{btnText}</button>
      </div>
    </div>
  );
};
