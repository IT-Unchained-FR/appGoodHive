import Image from "next/image";

import { FC } from "react";
import { generateJobTypeEngage } from "@utils/generate-job-type-engage";
import { jobTypes } from "../constants/common";

interface Props {
  type: string;
  title: string;
  postedBy: string;
  details: string;
  duration: string;
  image: string;
  country: string;
  countryFlag: string;
  city: string;
  ratePerHour: string;
  typeEngagement: string;
  skills: string[];
  buttonText: string;
  jobType: string;
}

export const JobCard: FC<Props> = ({
  title,
  postedBy,
  details,
  duration,
  image,
  country,
  countryFlag,
  city,
  typeEngagement,
  jobType,
  skills,
}) => {
  const typeEngagementMsg = generateJobTypeEngage(typeEngagement);
  const jobTypeMsg = jobTypes.find((job) => job.value === jobType)?.label;

  return (
    <div className="mt-11 ">
      <div className="block relative p-6 bg-blend-darken rounded-3xl box-border border-r-2 border-l-2 border-radius  bg-white shadow-[2px_7px_20px_4px_#e2e8f0]">
        <div className="absolute w-32 h-40 top-5 right-7 flex flex-col items-end">
          <p className="text-base mb-2">• {jobTypeMsg}</p>
          <div className="flex gap-2">
            <p className="text-sm">2500$</p>
            <div className="relative mt-1 h-3 w-5 mb-4">
              <Image src={countryFlag} alt="country" fill />
            </div>
          </div>
        </div>
        {/* <div className="flex items-center justify-end">
          <a href="" className="inline-block mr-2">
            <img src="/img/bin.png" alt="bin" width="25" height="25" />
          </a>
          <a href="" className="inline-block">
            <img src="/img/edit.png" alt="edit" width="25" height="25" />
          </a>
        </div> */}
        <div className="pl-4 pr-5">
          <div className="flex flex-col">
            <div
              className="relative h-20 w-20 flex items-center justify-center sm:mb-6 mb-0 cursor-pointer bg-gray-100"
              style={{
                clipPath:
                  "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
              }}
            >
              <Image
                className="object-cover"
                src={image || "/img/placeholder-image.png"}
                alt="profile-picture"
                fill
              />
            </div>
            <div className="mt-5">
              <p className="font-semibold text-xl  text-gray-800 ">
                {postedBy}
              </p>
              <p className="text-base text-gray-600 ">
                {typeEngagementMsg} - {duration}
              </p>
              <div className="flex flex-row">
                <p className="text-base text-gray-600 mb-5">
                  {city}, {country}
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="pt-2 ">
              <p className="font-bold text-base pr-1 whitespace-nowrap ">
                {" "}
                Job header
              </p>
              <p className=" flex text-justify text-gray-500 font-light">
                {title}
              </p>
            </div>
            <div className="pt-2 ">
              <p className="font-bold text-base pr-1 whitespace-nowrap">
                {" "}
                Job description
              </p>
              <span className=" flex text-justify text-gray-500 font-light">
                {details}
              </span>
            </div>
            <div className="flex flex-col pt-4 ">
              <p className="font-bold text-base whitespace-nowrap">
                Mandatory Skill:
              </p>
              <div className="pt-3 grid grid-cols-7 grid-flow-row sm:grid-cols-5 gap-1">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-block bg-gray-100 border border-solid border-[#FFC905] rounded-full py-1 text-xs font-semibold text-center mr-1 mb-1"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
