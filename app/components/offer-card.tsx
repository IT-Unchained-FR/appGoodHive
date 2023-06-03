import Image from "next/image";

import { FC } from "react";

import { Button } from "../components/button";

interface Props {
  image: string;
  title: string;
  postedBy: string;
  postedOn: string;
  countryFlag: string;
  jobDescription: string;
  skills: string[];
  designation: string;
  companyDescription: string;
}

export const OfferCard: FC<Props> = ({
  image,
  title,
  postedBy,
  postedOn,
  countryFlag,
  jobDescription,
  skills,
  designation,
  companyDescription,
}) => {
  return (
    <div className="mt-11 ">
      <div className="block p-6 bg-blend-darken shadow-gray-300 rounded-3xl shadow-xl box-border border-r-2 border-l-2  border-radius  bg-white">
        <div className="pl-4 pr-5">
          <div className="md:flex-row flex">
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
              </div>
            </div>
          </div>
          <div>
            <div className="pt-2 ">
              <p className="font-bold text-base pr-1 whitespace-nowrap">
                {" "}
                Job description
              </p>
              <span className=" flex text-justify text-gray-500 font-light">
                {jobDescription}
              </span>
            </div>
            <div className="flex flex-col pt-4 ">
              <p className="font-bold text-base whitespace-nowrap">
                Mandatory Skills:
              </p>
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
            </div>
            <div className="pt-2 ">
              <p className="font-bold text-base pr-1 whitespace-nowrap">
                {" "}
                About company
              </p>
              <span className=" flex text-justify text-gray-500 font-light">
                {designation}
              </span>
            </div>
            <div className="pt-2 ">
              <p className="font-bold text-base pr-1 whitespace-nowrap">
                {" "}
                Company services
              </p>
              <span className=" flex text-justify text-gray-500 font-light">
                {companyDescription}
              </span>
            </div>
            <div className="flex justify-between">
              <div className="flex space-x-3">
                <Button
                  text="Discuss on Telegram"
                  type="primary"
                  size="medium"
                />
                <Button text="Discuss on Mail" type="primary" size="medium" />
              </div>
              <div>
                <Button
                  text="See jobs posted by Goodhive"
                  type="secondary"
                  size="medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
