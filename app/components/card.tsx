"use client";

import Image from "next/image";

import { FC } from "react";

import { BigNumberish } from "ethers";

import { Button } from "../components/button";

interface Props {
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  image: string;
  countryFlag: string;
  city: string;
  rate: BigNumberish;
  currency: string;
  description: string;
  skills: string[];
  buttonText: string;
  escrowFee: string;
}

export const Card: FC<Props> = ({
  type,
  title,
  postedBy,
  postedOn,
  image,
  countryFlag,
  city,
  rate,
  currency,
  description,
  skills,
  buttonText,
  escrowFee,
}) => {
  let escrowIcon = "/img/escrow_icon.png";
  let ratePerHour = `$${rate} ${currency}/Hour`;
  let escrowDescription = `$${escrowFee}`;

  if (type === "talent") {
    escrowIcon = "/img/white_space.png";
    escrowDescription = "";
  } else {
    ratePerHour = "";
  }

  return (
    <div className="mt-11">
      <div className="block p-6 bg-blend-darken shadow-gray-300 rounded-3xl shadow-xl box-border border-r-2 border-l-2 border-radius bg-white">
        <div className="pl-4 pr-5">
          <div className="flex">
            <div
              className="mt-7 w-20 h-20 flex items-center mb-6 lg:mb-0 mx-auto md:mx-0 relative"
              style={{
                clipPath:
                  "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
              }}
            >
              {image && (
                <Image src={image} alt="avatar" width={157} height={166} />
              )}
            </div>
            <div className="md:ml-2 pl-8 pt-7">
              <p className="font-semibold text-xl text-gray-800">{title}</p>
              <p className="text-base text-gray-600">{postedBy}</p>
              <p className="text-base text-gray-600 mb-5">{postedOn}</p>
            </div>
            <div className="pt-7 flex flex-row grow justify-end md:ml-5">
              <div className="flex flex-col items-end">
                <Image
                  className="mt-1 h-5 w-8 mb-1"
                  src={countryFlag}
                  alt="country"
                  width={34}
                  height={23}
                />
                <div className="text-gray-500 font-light">{city}</div>
              </div>
            </div>
          </div>
          <div className="pt-2 flex text-gray-500 font-light">
            {description}
          </div>
          <div className="flex flex-wrap mt-4">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="bg-amber-100 rounded-full py-1 px-3 mr-2 mb-2"
              >
                <span className="flex items-center">{skill}</span>
              </div>
            ))}
          </div>
          <div className="space-x-3 flex justify-end">
            <Button text="Know more..." type="secondary" size="medium" />
            <Button text="Apply Now" type="primary" size="medium" />
          </div>
        </div>
      </div>
    </div>
  );
};
