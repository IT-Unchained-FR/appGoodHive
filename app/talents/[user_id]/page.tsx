"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { TalentSocialMedia } from "@/app/components/talents/profile-social-media";
import { TalentContactBtn } from "@/app/components/talents/talent-contact-btn";
import { TalentProfileData } from "./types";
import { generateAvailabilityStatus } from "./utils";
import ProfileAboutWork from "@/app/components/talents/ProfileAboutWork";
import TalentsCVSection from "@/app/components/talents/TalentsCVSection";
import GoodHiveSpinner from "@/app/components/spinners/hoodhive-spinner/goodhive-spinner";

interface MyProfilePageProps {
  params: {
    user_id: string;
  };
}

export default async function MyProfilePage(context: MyProfilePageProps) {
  const { params } = context;
  const [profileData, setProfileData] = useState<TalentProfileData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await fetch(
          `/api/talents/my-profile?user_id=${params.user_id}`,
        );
        const userProfileData = await data.json();
        setProfileData(userProfileData);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to load profile data.");
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [params.user_id]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (isLoading || !profileData) {
    return <GoodHiveSpinner size="large" />;
  }

  const {
    skills,
    title,
    first_name,
    last_name,
    image_url,
    about_work,
    cv_url,
    description,
    email,
    city,
    rate,
    country,
    linkedin,
    telegram,
    github,
    stackoverflow,
    portfolio,
    freelance_only,
    remote_only,
    talent_status,
    mentor_status,
    recruiter_status,
    twitter,
    talent,
    recruiter,
    mentor,
    approved,
  } = profileData;

  console.log(talent, recruiter, mentor, "Status...");
  const availabilityStatus = generateAvailabilityStatus(
    freelance_only,
    remote_only,
  );

  console.log(skills, "skills...");

  if (!approved) {
    return (
      <div>
        <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
          🚀 This account is still under review. Account will be live soon.
        </p>
      </div>
    );
  }

  return (
    <main className="relative pt-16">
      <div className="container mx-auto mb-20 bg-white w-full relative rounded-2xl flex flex-col items-center p-5 z-20 shadow-[2px_7px_20px_4px_#e2e8f0]">
        <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
          <div
            className="relative h-[180px] w-[180px] flex items-center justify-center cursor-pointer bg-gray-100"
            style={{
              clipPath:
                "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
            }}
          >
            <Image
              className="object-cover"
              src={image_url || "/img/placeholder-image.png"}
              alt="profile-picture"
              fill
            />
          </div>
        </div>
        <h1 className="text-[#4E4E4E] text-3xl font-bold mb-3">
          {`${first_name} ${last_name}`}
        </h1>
        <h3 className="text-[#4E4E4E] text-xl font-bold mb-3">{title}</h3>
        <h4 className="text-[#4E4E4E] text-base mb-4">
          {city}, {country}
        </h4>
        {rate && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            {rate} USD/hr
          </h4>
        )}
        {availabilityStatus && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            {availabilityStatus}
          </h4>
        )}

        {talent && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            • I can help you as a talent
          </h4>
        )}

        {mentor && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            • I can help you as a mentor
          </h4>
        )}

        {recruiter && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            • I can help you as a recruiter
          </h4>
        )}
        <div className="flex w-full justify-center gap-5 mb-12">
          <TalentContactBtn toEmail={email} toUserName={first_name} />
        </div>
        <div className="flex flex-col w-1/2">
          <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">Bio:</h3>
          <p className="w-full max-h-52 mb-10 text-ellipsis overflow-hidden">
            {description}
          </p>
          <ProfileAboutWork about_work={about_work} />
          <TalentSocialMedia
            twitter={twitter}
            linkedin={linkedin}
            telegram={telegram}
            github={github}
            stackoverflow={stackoverflow}
            portfolio={portfolio}
          />
          <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">
            Specialization and Skills
          </h3>
          <div className="flex flex-wrap gap-2 mb-10">
            {skills &&
              skills.split(",").map((skill) => (
                <div
                  key={skill}
                  className="border-[#FFC905] flex items-center bg-gray-200 rounded-full px-4 py-1 text-sm m-1"
                >
                  <p>{skill}</p>
                </div>
              ))}
          </div>
          <TalentsCVSection cv_url={cv_url} talent_status={talent_status} />
        </div>
      </div>
    </main>
  );
}
