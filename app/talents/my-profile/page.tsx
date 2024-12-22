"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { uploadFileToBucket } from "@/app/utils/upload-file-bucket";
import Image from "next/image";
import { Button } from "@/app/components/button";
import { useRouter } from "next/navigation";
import { ToggleButton } from "@/app/components/toggle-button";
import Link from "next/link";
import { resumeUploadSizeLimit } from "./constants";
import { SelectInput } from "@/app/components/select-input";
import { countries } from "@/app/constants/countries";
import { AutoSuggestInput } from "@/app/components/autosuggest-input";
import { skills } from "@/app/constants/skills";
import { createJobServices } from "@/app/constants/common";
import { socialLinks } from "./constant";
import { SocialLink } from "./social-link";
import DragAndDropFile from "@/app/components/drag-and-drop-file";
import Cookies from "js-cookie";
import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";

export type ProfileData = {
  first_name: string;
  last_name: string;
  image_url?: string;
  cv_url?: string;
  title?: string;
  description?: string;
  country?: string;
  city?: string;
  phone_country_code?: string;
  phone_number?: string;
  email: string;
  about_work?: string;
  rate?: number;
  freelance_only?: boolean;
  remote_only?: boolean;
  skills?: string[];
  linkedin?: string;
  github?: string;
  twitter?: string;
  stackoverflow?: string;
  portfolio?: string;
  telegram?: string;
  talent?: boolean;
  mentor?: boolean;
  recruiter?: boolean;
  talent_status?: string;
  mentor_status?: string;
  recruiter_status?: string;
  hide_contact_details?: boolean;
  referrer?: string;
  availability?: boolean;
  wallet_address?: string;
  approved: boolean;
};

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData>(
    {} as ProfileData,
  );
  const unapprovedProfile = profileData && profileData.approved === false;
  const imageInputValue = useRef(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);
  const [reviewProfileLoading, setReviewProfileLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isUploadedCvLink, setIsUploadedCvLink] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [isProfileDataFetching, setIsProfileDataFetching] = useState(false);

  const { register, handleSubmit, setValue, reset, watch } = useForm();
  const router = useRouter();

  const user_id = Cookies.get("user_id");

  const fetchProfile = async () => {
    try {
      setIsProfileDataFetching(true);
      const response = await fetch(
        `/api/talents/my-profile?user_id=${user_id}`,
      );

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        reset(data);
        if (data.country) {
          setSelectedCountry({ value: data.country, label: data.country });
        }
        console.log(data, "data of profile page...");
        if (data.skills) {
          setSelectedSkills(
            data.skills.split(", ").map((skill: string) => skill.trim()),
          );
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsProfileDataFetching(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsProfileDataFetching(true);
        const response = await fetch(
          `/api/talents/my-profile?user_id=${user_id}`,
        );

        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          reset(data);
          if (data.country) {
            setSelectedCountry({ value: data.country, label: data.country });
          }
          if (data.skills) {
            setSelectedSkills(
              data.skills.split(", ").map((skill: string) => skill.trim()),
            );
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsProfileDataFetching(false);
      }
    };
    fetchProfile();
  }, [reset, user_id]);

  const handleFormSubmit = async (data: any) => {
    try {
      let imageUrl = profileData.image_url;
      let cvUrl = profileData.cv_url;

      setSaveProfileLoading(true);

      if (profileImage) {
        imageUrl = (await uploadFileToBucket(profileImage)) as string;
      }

      if (cvFile) {
        cvUrl = (await uploadFileToBucket(cvFile)) as string;
      }

      const formData = {
        title: data.title,
        description: data.description,
        first_name: data["first-name"],
        last_name: data["last-name"],
        country: selectedCountry?.value,
        city: data.city,
        phone_country_code: data["phone-country-code"],
        phone_number: data["phone-number"],
        email: data.email,
        about_work: data["about-work"],
        rate: data.rate,
        freelance_only: data["freelance-only"],
        remote_only: data["remote-only"],
        skills: selectedSkills,
        image_url: imageUrl,
        cv_url: cvUrl,
        wallet_address: walletAddress,
        linkedin: data.linkedin,
        github: data.github,
        twitter: data.twitter,
        stackoverflow: data.stackoverflow,
        portfolio: data.portfolio,
        telegram: data.telegram,
        talent: data.talent,
        mentor: data.mentor,
        recruiter: data.recruiter,
        hide_contact_details: data["hide-contact-details"],
        // referral_code: isAlreadyReferred ? null : referralCode,
        availability: data.availability,
      };

      // Filter out undefined, null, and empty string values
      // eslint-disable-next-line prefer-const
      const filteredData = Object.fromEntries(
        Object.entries(formData).filter(
          ([, value]) => value !== undefined && value !== null && value !== "",
        ),
      );

      // Adding Skills to the filteredData
      if (filteredData.skills && Array.isArray(filteredData.skills)) {
        filteredData.skills = filteredData.skills
          .map(
            (skill: string) =>
              skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase(),
          )
          .join(", ");
      }

      filteredData.user_id = Cookies.get("user_id");

      const profileResponse = await fetch("/api/talents/my-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filteredData),
      });

      if (profileResponse.ok) {
        toast.success("Profile saved successfully");
        fetchProfile();
      } else {
        toast.error("Something went wrong while saving your profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while saving your profile");
    } finally {
      setSaveProfileLoading(false);
      setReviewProfileLoading(false);
    }
  };

  const onCvInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const cvFile = event.target.files[0];

    if (cvFile.size > 1024 * 1024 * Number(resumeUploadSizeLimit)) {
      toast.error(`File size should be less than ${resumeUploadSizeLimit} MB`);
      return;
    }
    setCvFile(cvFile);
  };

  if (isProfileDataFetching) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Loading Your Profile..."} />;
  }
  if (saveProfileLoading) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Saving Your Profile..."} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 ">
      {unapprovedProfile && (
        <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
          🚀 Your profile is pending approval. Check your email to schedule your
          interview.
        </p>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* // TODO: Add image upload functionality */}
        <div className="flex flex-col items-center justify-center w-full mt-10">
          {profileData.image_url ? (
            <div
              className="relative h-[230px] w-[230px] flex items-center mt-10 justify-center cursor-pointer bg-gray-100"
              style={{
                clipPath:
                  "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
              }}
            >
              <Image
                className="object-cover"
                src={profileData.image_url}
                alt="profile-picture"
                fill
              />
            </div>
          ) : (
            <DragAndDropFile
              file={profileImage}
              setFile={setProfileImage}
              isRenderedPage={isRenderedPage}
              setIsRenderedPage={setIsRenderedPage}
              imageInputValue={imageInputValue}
            />
          )}
        </div>
        <div className="w-full flex justify-center mt-7">
          <Button
            text="Public View"
            type="secondary"
            size="medium"
            onClickHandler={() => router.push(`/talents/${walletAddress}`)}
          />
        </div>
        <div className="flex w-full justify-center mt-5">
          <label
            htmlFor="availability"
            className="inline-block ml-3 mr-5 text-base text-black form-label"
          >
            Set Availability*
          </label>
          <ToggleButton
            label="Active"
            name="availability"
            tooltip="If Seeking Jobs"
            checked={profileData.availability}
            setValue={setValue}
          />
        </div>
        <div className="flex flex-col w-full mt-10">
          <div>
            <label
              htmlFor="title"
              className="inline-block ml-3 text-base text-black form-label"
            >
              Profile header *
            </label>
          </div>
          <input
            className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
            placeholder="Title"
            type="text"
            maxLength={100}
            defaultValue={profileData?.title}
            {...register("title")}
          />
          <div className="mt-5">
            <textarea
              className="form-control block w-full px-4 py-2 pb-4 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
              placeholder="Describe your skills and experience in a few words*"
              maxLength={5000}
              rows={8}
              defaultValue={profileData?.description}
              {...register("description")}
            />
            <p
              className="text-[13px] mt-2 text-right w-full"
              style={{ color: "#FFC905" }}
            >
              {watch("description")?.length}/5000
            </p>
          </div>
          <div className="flex gap-4 mt-4 sm:flex-col">
            <div className="flex-1">
              <label
                htmlFor="first-name"
                className="inline-block ml-3 text-base text-black form-label"
              >
                First Name*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="First Name"
                type="text"
                pattern="[a-zA-Z -]+"
                maxLength={100}
                defaultValue={profileData?.first_name}
                {...register("first-name")}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="last-name"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Last Name*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Last Name"
                type="text"
                pattern="[a-zA-Z -]+"
                maxLength={100}
                defaultValue={profileData?.last_name}
                {...register("last-name")}
              />
            </div>
          </div>
          <div className="flex sm:flex-col gap-4 mt-4">
            <div className="flex-1">
              <SelectInput
                required={false}
                labelText="Country"
                name="country"
                inputValue={selectedCountry}
                setInputValue={setSelectedCountry}
                options={countries}
                defaultValue={
                  countries[
                    countries.findIndex(
                      (country) => country.value === profileData?.country,
                    )
                  ]
                }
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="city"
                className="inline-block ml-3 text-base text-black form-label"
              >
                City*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="City"
                type="text"
                pattern="[a-zA-Z -]+"
                maxLength={100}
                defaultValue={profileData?.city}
                {...register("city")}
              />
            </div>
          </div>
          <div className="flex sm:flex-col gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="phone-country-code"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Phone Country Code*
              </label>
              <div className="relative">
                <input
                  className="pl-8 form-control block w-full py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Phone Country Code"
                  type="text"
                  value={selectedCountry?.phoneCode || "+1"}
                  defaultValue={
                    countries[
                      countries.findIndex(
                        (country) => country.value === profileData?.country,
                      )
                    ]?.phoneCode
                  }
                  readOnly
                  {...register("phone-country-code")}
                />
              </div>
            </div>
            <div className="flex-1">
              <label
                htmlFor="phone-number"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Phone Number*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Phone Number"
                type="number"
                maxLength={20}
                defaultValue={profileData?.phone_number}
                {...register("phone-number")}
              />
            </div>
          </div>
          <div className="flex sm:flex-col gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="email"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Email*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Email"
                type="email"
                maxLength={255}
                defaultValue={profileData?.email}
                {...register("email")}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="rate"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Rate (USD/Hour)
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Your rate per hour"
                type="number"
                maxLength={255}
                defaultValue={profileData?.rate}
                {...register("rate")}
              />
            </div>
          </div>
          <div className="w-full mt-5 pl-2">
            <ToggleButton
              label="Hide my contact details"
              name="hide-contact-details"
              checked={profileData?.hide_contact_details ?? false}
              setValue={setValue}
            />
          </div>
          <div className="mt-4">
            <label
              htmlFor="about-work"
              className="inline-block ml-3 text-base text-black form-label"
            >
              About your Work*
            </label>
            <textarea
              className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
              placeholder="What you are looking for?"
              rows={8}
              maxLength={5000}
              defaultValue={profileData?.about_work}
              {...register("about-work")}
            />
            <p
              className="text-[13px] mt-2 text-right w-full"
              style={{ color: "#FFC905" }}
            >
              {watch("about-work")?.length}/5000
            </p>
          </div>
          <div className="mt-4">
            <label
              htmlFor="cv"
              className="inline-block ml-3 text-base text-black form-label"
            >
              CV*
            </label>
            {isUploadedCvLink || profileData.cv_url ? (
              <div className="flex items-center gap-3 p-3">
                <Link
                  href={{ pathname: profileData.cv_url }}
                  target="_blank"
                  className="text-base font-normal text-blue-300 underline"
                >
                  Your uploaded cv
                </Link>
                <button
                  type="button"
                  onClick={() => setIsUploadedCvLink(false)}
                  className="w-6 text-black bg-gray-400 rounded-full"
                >
                  &#10005;
                </button>
              </div>
            ) : (
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="CV"
                type="file"
                name="cv"
                accept=".pdf"
                onChange={onCvInputChange}
              />
            )}
          </div>

          <div className="flex w-full justify-between mt-9 sm:flex-wrap sm:gap-3">
            <ToggleButton
              label="Freelance Only"
              name="freelance-only"
              checked={profileData?.freelance_only ?? false}
              setValue={setValue}
            />
            <ToggleButton
              label="Remote Only"
              name="remote-only"
              checked={profileData?.remote_only ?? false}
              setValue={setValue}
            />
          </div>

          <div className="relative flex flex-col gap-4 mt-12 mb-2 z-30 sm:flex-row">
            <div className="flex-1">
              <label
                htmlFor="skills"
                className="inline-block ml-3 text-base font-bold text-black form-label"
              >
                Skills*
              </label>
              <div className="absolute w-full pt-1 pr-10 text-base font-normal text-gray-600 bg-white form-control ">
                <AutoSuggestInput
                  inputs={skills}
                  selectedInputs={selectedSkills}
                  setSelectedInputs={setSelectedSkills}
                />
              </div>
              <div className="pt-10">
                {!!selectedSkills && selectedSkills?.length > 0 && (
                  <div className="flex flex-wrap mt-4 ">
                    {selectedSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="border border-[#FFC905] flex items-center bg-gray-200 rounded-full py-1 px-3 m-1"
                      >
                        <span className="mr-2">{skill}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSkills(
                              selectedSkills.filter((_, i) => i !== index),
                            );
                          }}
                          className="w-6 text-black bg-gray-400 rounded-full"
                        >
                          &#10005;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <p className="my-4">I want to be:</p>
            <div className="w-1/2 sm:w-full mb-5 px-3 flex justify-between sm:px-1 sm:flex-wrap sm:gap-3">
              {createJobServices.map((service) => {
                const { label, value } = service;
                const isChecked = profileData[value];
                return (
                  <ToggleButton
                    key={value}
                    label={label}
                    name={value}
                    checked={isChecked ?? false}
                    setValue={setValue}
                  />
                );
              })}
            </div>
          </div>

          {/* Social media links: Linkedin, github, stackoverflow, telegram, portfolio */}
          <div className="flex w-full flex-col mt-7 mb-12">
            <h3 className="inline-block mt-7 mb-2 ml-1 text-base font-medium text-black form-label">
              Social Media Links:
            </h3>
            {socialLinks.map((socialLink) => (
              <SocialLink
                key={socialLink.name}
                name={socialLink.name}
                icon={socialLink.icon}
                placeholder={socialLink.placeholder}
                value={
                  profileData[
                    socialLink.name as keyof typeof profileData
                  ] as string
                }
                isRequired={socialLink.isRequired}
                setValue={setValue}
              />
            ))}
          </div>

          {/* {isShowReferralSection && <ReferralSection />} */}

          <div className="mt-10 mb-16 text-center flex gap-4 justify-center">
            <>
              <button
                className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                type="submit"
                name="save-talent-only"
                disabled={saveProfileLoading}
              >
                {saveProfileLoading ? "Saving Profile..." : "Save Profile"}
              </button>
              <button
                className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                type="submit"
                name="send-for-review"
                disabled={reviewProfileLoading}
              >
                {reviewProfileLoading
                  ? "Sending Profile To Review..."
                  : "Send Profile To Review"}
              </button>
            </>
          </div>
        </div>
      </form>
    </div>
  );
}
