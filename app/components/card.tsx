"use client";

import Image from "next/image";

import { FC, useContext } from "react";

import { BigNumberish } from "ethers";

import { Button } from "../components/button";

import { useRouter } from "next/navigation";
import { AddressContext } from "./context";
import Link from "next/link";

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

  return (
    <div className="mt-11">
      <div className="box-border block p-6 bg-white border-l-2 border-r-2 shadow-xl bg-blend-darken shadow-gray-300 rounded-3xl border-radius">
        <div className="pl-4 pr-5">
          <div className="flex md:flex-row">
            <div className="relative w-28 h-28 overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-yellow-500 transform rotate-45"></div>
              {image && (
                <Image
                  className="object-cover absolute inset-0 transform rotate-45"
                  src={image}
                  alt="avatar"
                  fill
                />
              )}
            </div>
            <div className="pl-8 md:ml-2 pt-2">
              <p className="text-xl font-semibold text-gray-800">{title}</p>
              <p className="text-base text-gray-600">{postedBy}</p>
              <p className="mb-5 text-base font-bold text-gray-600">
                {postedOn}
              </p>
            </div>
            <div className="flex flex-col items-end pt-2 grow">
              <div className="flex mb-1">
                <div className="w-10 h-7 mr-3 relative">
                  <Image alt="balance" src="/icons/money.svg" fill />
                </div>
                <div className="w-9 h-6 relative">
                  <Image src={countryFlag} alt="country" fill />
                </div>
              </div>
              <p className="font-light mb-1 text-gray-500">{city}</p>
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
          <div className="flex pt-5 mb-5 text-base font-light text-[#151414]">
            {description}
          </div>
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

          <div className="w-full gap-3 flex justify-end">
            <Link href={`/talents/${walletAddress}`}>
              <div className="flex justify-center lg:items-center">
                <Button text="Know more..." type="secondary" size="medium" />
              </div>
            </Link>

            <div className="flex justify-center lg:items-center">
              <Button text="Apply Now" type="primary" size="medium" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
