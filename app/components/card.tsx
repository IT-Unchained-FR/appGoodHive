"use client";

import Image from "next/image";
import Link from "next/link";
import { BigNumberish } from "ethers";

import type { FC } from "react";
import { Button } from "../components/button";

interface Props {
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  image: string;
  countryFlag: string;
  city: string;
  rate: number;
  currency: string;
  description: string;
  skills: string[];
  buttonText: string;
  escrowAmount?: BigNumberish;
  escrowCurrency?: string;
  walletAddress?: string;
}

export const Card: FC<Props> = ({
  title,
  postedBy,
  postedOn,
  image,
  countryFlag,
  city,
  description,
  skills,
  rate,
  currency = "$", // TODO: Add mapping with currencies (USD, EUR, etc.)
  escrowAmount,
  escrowCurrency = "ETH",
  walletAddress,
}) => {
  const ratePerHour = rate && currency ? `${rate}${currency}/Hour` : null;
  const croppedTitle =
    title.length > 28 ? title.substring(0, 28) + "..." : title;
  const croppedDescription =
    description.length > 100
      ? description.substring(0, 100) + "..."
      : description;
  const profileImage = image ? image : "/img/placeholder-image.png";

  return (
    <div className="box-border block p-6 mt-11 bg-white bg-blend-darken rounded-3xl shadow-[2px_7px_20px_4px_#e2e8f0]">
      <div className="pl-4 pr-5">
        <div className="flex md:flex-row">
          <div
            className="relative flex items-center justify-center bg-yellow-300 cursor-pointer h-28 w-28"
            style={{
              clipPath:
                "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
            }}
          >
            <Image
              className="object-cover"
              src={profileImage}
              alt="avatar"
              fill
            />
          </div>
          <div className="pt-2 pl-8 md:ml-2">
            <p className="text-xl font-semibold text-gray-800">
              {croppedTitle}
            </p>
            <p className="text-base text-gray-600">{postedBy}</p>
            <p className="mb-5 text-base font-bold text-gray-600">{postedOn}</p>
          </div>
          <div className="flex flex-col items-end pt-2 grow">
            <div className="flex mb-1">
              <div className="relative w-10 mr-3 h-7">
                <Image alt="balance" src="/icons/money.svg" fill />
              </div>
              <div className="relative h-6 w-9">
                <Image src={countryFlag} alt="country" fill />
              </div>
            </div>
            <p className="mb-1 font-light text-gray-500">{city}</p>
            <div className="flex space-between">
              <div className="text-base font-bold">{ratePerHour}</div>
              {!!escrowAmount && (
                <div>
                  {escrowAmount?.toString()} {escrowCurrency}
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="flex pt-5 mb-5 h-20 text-base overflow-hidden text-ellipsis font-light text-[#151414]">
          {croppedDescription}
        </p>
        <div className="flex flex-wrap mb-5">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="px-3 py-1 mb-2 mr-2 rounded-full bg-amber-100"
            >
              <span className="flex items-center">{skill}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end w-full gap-3 sm:flex-col md:flex-col">
          <Link href={`/talents/${walletAddress}`}>
            <Button text="Know more..." type="secondary" size="medium" />
          </Link>

          <Button text="Apply Now" type="primary" size="medium" />
        </div>
      </div>
    </div>
  );
};
