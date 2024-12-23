"use client";

import { useRef, useState, FormEvent, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

import DragAndDropFile from "../../components/drag-and-drop-file";
import { AddressContext } from "../../components/context";
import { SelectInput } from "../../components/select-input";
import { countries } from "../../constants/countries";
import LabelOption from "@interfaces/label-option";
import { Button } from "@/app/components/button";
import Link from "next/link";
import Image from "next/image";
import { SocialLink } from "@/app/talents/my-profile/social-link";
import { socialLinks } from "@/app/talents/my-profile/constant";
import { uploadFileToBucket } from "@utils/upload-file-bucket";
import { ReferralSection } from "@/app/components/referral/referral-section";
import { countryCodes } from "@/app/constants/phoneNumberCountryCode";
import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";
import { useForm } from "react-hook-form";
import { companyProfileValidation } from "./validation-schema";

export default function MyProfile() {
  const userId = Cookies.get("user_id");
  const imageInputValue = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    headline: "",
    designation: "",
    address: "",
    country: "",
    city: "",
    phone_country_code: "",
    phone_number: "",
    email: "",
    telegram: "",
    image_url: "",
    linkedin: "",
    github: "",
    twitter: "",
    stackoverflow: "",
    portfolio: "",
    status: "",
    referrer: "",
    approved: false,
  });
  const unapprovedProfile = profileData && profileData.approved === false;
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [noProfileFound, setNoProfileFound] = useState<boolean>(false);
  const [isShowReferralSection, setIsShowReferralSection] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<LabelOption | null>(
    null,
  );

  const walletAddress = useContext(AddressContext);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  console.log(errors, "Errors...");

  const handleImageClick = () => {
    setProfileData({ ...profileData, image_url: "" });
  };

  console.log(profileData, "Profile Data...");

  useEffect(() => {
    setNoProfileFound(false);
    const fetchProfile = async () => {
      setIsLoading(true);

      const profileResponse = await fetch(
        `/api/companies/my-profile?userId=${userId}`,
      );

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();

        setProfileData(profileData);
        reset(profileData);

        if (profileData.country) {
          const countryOption = countries.find(
            (country) => country.value === profileData.country,
          );
          setSelectedCountry(countryOption || null);
        }

        setIsShowReferralSection(true);
      } else {
        setNoProfileFound(true);
      }
      setIsLoading(false);
    };

    if (userId) fetchProfile();
  }, [userId]);

  const handleFormSubmit = async (data: any, validate: boolean) => {
    setIsSaving(true);

    const isNewUser = !profileData.designation;
    const referralCode = Cookies.get("referralCode");
    const imageUrl = await uploadFileToBucket(profileImage);

    const isAlreadyReferred = profileData.referrer ? true : false;

    if (validate) {
      try {
        // Perform validation using the validate method
        await companyProfileValidation.validate(data, { abortEarly: false });
      } catch (err: any) {
        // Set errors for each field that failed validation
        err.inner.forEach((error: any) => {
          setError(error.path, {
            type: "manual",
            message: error.message,
          });
        });

        console.log("Validation failed! Errors:", err.errors);
        toast.error("Please fill in all required fields");
        setIsSaving(false);
        return;
      }
    }

    const dataForm = {
      headline: data.headline,
      user_id: userId,
      designation: data.designation,
      address: data.address,
      country: selectedCountry?.value,
      city: data.city,
      phone_country_code: data["phone_country_code"],
      phone_number: data["phone_number"],
      email: data.email,
      telegram: data.telegram,
      image_url: imageUrl || profileData.image_url,
      wallet_address: walletAddress,
      linkedin: data.linkedin,
      github: data.github,
      stackoverflow: data.stackoverflow,
      twitter: data.twitter,
      portfolio: data.portfolio,
      status: profileData.status || "pending",
      referrer: isAlreadyReferred ? null : referralCode,
    };

    const filteredData = Object.fromEntries(
      Object.entries(dataForm).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    );

    // TODO: POST formData to the server with fetch
    const profileResponse = await fetch("/api/companies/my-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filteredData),
    });

    setIsSaving(false);

    if (!profileResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      if (isNewUser) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: dataForm.email,
            type: "new-company",
            subject: `Welcome to GoodHive, ${dataForm.designation}! 🌟 Let's Connect You with Top IT Talent`,
          }),
        });
      }
      if (validate === false) {
        toast.success("Profile Saved!");
      } else {
        toast.success("Profile sent to review by the core team!");
      }
    }
  };

  const handleFormSaving = (data: any) => {
    handleFormSubmit(data, false);
  };

  const handleFormReview = (data: any) => {
    handleFormSubmit(data, true);
  };

  if (!userId) {
    return (
      <h2 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 To Get Started Please Login First
      </h2>
    );
  }

  if (isLoading) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Loading Your Profile, Please Wait"} />;
  }
  if (isSaving) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Saving Your Profile..."} />;
  }

  return (
    <main className="container mx-auto">
      {noProfileFound ? (
        <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
          🚀 Please Create a Profile To Continue
        </p>
      ) : unapprovedProfile ? (
        <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
          🚀 Your Profile Is Pending Approval. It Will Be Live Soon After
          Review.
        </p>
      ) : null}
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300 pb-2">
        My Profile
      </h1>
      <section>
        <form onSubmit={handleSubmit(handleFormReview)}>
          <div className="flex flex-col items-center justify-center w-full mt-10">
            {profileData.image_url ? (
              <div
                className="relative h-[230px] w-[230px] flex items-center mt-10 justify-center cursor-pointer bg-gray-100"
                style={{
                  clipPath:
                    "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                }}
                onClick={handleImageClick}
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
          <div className="w-full flex justify-center mt-2">
            <Link href={`/companies/${userId}`}>
              <Button text="Public View" type="secondary" size="medium" />
            </Link>
          </div>
          <div className="w-full flex justify-center mt-7">
            {noProfileFound ? (
              <p>Please create a profile before posting jobs!</p>
            ) : unapprovedProfile ? (
              <p>
                You Can&apos;t Add Job Because Your Company Profile Is Not
                Approved Yet!{" "}
              </p>
            ) : (
              <Link href={`/companies/create-job`}>
                <Button text="Create Job" type="secondary" size="medium" />
              </Link>
            )}
          </div>
          <div className="flex flex-col w-full mt-20">
            <div className="flex-1 mb-5">
              <label
                htmlFor="designation"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Company Name*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Company Name"
                type="text"
                maxLength={100}
                defaultValue={profileData.designation}
                {...register("designation", {
                  required: "Company Name is required",
                })}
              />
              {errors.designation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.designation.message as string}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="headline"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Describe your company in a few words?*
              </label>
            </div>
            <div>
              <textarea
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Describe your company in a few words?"
                maxLength={5000}
                rows={8}
                defaultValue={profileData.headline}
                {...register("headline", { required: "Headline is required" })}
              />
              {errors.headline && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.headline.message as string}
                </p>
              )}
              <p
                className="text-[13px] mt-2 text-right w-full"
                style={{ color: "#FFC905" }}
              >
                {profileData.headline?.length}/5000
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-10">
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
                  defaultValue={profileData.email || "sadsdad@gmail.com"}
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message as string}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-4 mt-4 sm:flex-col">
              <div className="flex-1">
                <label
                  htmlFor="address"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Address*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Address"
                  type="text"
                  maxLength={100}
                  defaultValue={profileData.address}
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.address.message as string}
                  </p>
                )}
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
                  pattern="[a-zA-Z \-]+"
                  maxLength={100}
                  defaultValue={profileData.city}
                  {...register("city", { required: "City is required" })}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.city?.message as string}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <SelectInput
                  required={false}
                  labelText="Country"
                  name="country"
                  inputValue={selectedCountry}
                  setInputValue={(country: any) => {
                    setValue("country", country.value);
                    setSelectedCountry(country);
                  }}
                  options={countries}
                  defaultValue={
                    countries[
                      countries.findIndex(
                        (country) =>
                          country.value === profileData?.country ||
                          countries[0],
                      )
                    ]
                  }
                />
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.country.message as string}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-4 mt-4 sm:flex-col">
              <div className="">
                <label
                  htmlFor="phone_country_code"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Phone Country Code*
                </label>
                <div className="relative">
                  <select
                    className="form-control block px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                    id=""
                    defaultValue={profileData.phone_country_code}
                    {...register("phone_country_code", {
                      required: "Phone Country Code is required",
                    })}
                  >
                    {countryCodes.map((countryCode) => (
                      <option
                        key={countryCode.code}
                        value={countryCode.dial_code}
                        selected={
                          profileData.phone_country_code ===
                          countryCode.dial_code
                        }
                      >
                        {countryCode.name} {countryCode.dial_code}
                      </option>
                    ))}
                  </select>
                  {errors.phone_country_code && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phone_country_code.message as string}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="phone_number"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Phone Number*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Phone Number"
                  type="text"
                  pattern="[0-9]+"
                  maxLength={20}
                  defaultValue={profileData.phone_number}
                  {...register("phone_number", {
                    required: "Phone Number is required",
                  })}
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone_number.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* Social media links: Linkedin, github, stackoverflow, telegram, portfolio */}
            <div className="flex w-full flex-col my-7">
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
                  setValue={setValue as any}
                  errorMessage={
                    errors[socialLink.name as keyof typeof errors]
                      ?.message as string
                  }
                />
              ))}
            </div>

            {isShowReferralSection && <ReferralSection />}

            <div className="mt-10 text-right">
              {isLoading ? (
                <div className="flex gap-4 justify-end">
                  <button
                    className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
                    type="submit"
                    disabled
                  >
                    Loading...
                  </button>
                  <button
                    className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
                    type="submit"
                    disabled
                  >
                    Loading...
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 justify-end">
                  <button
                    className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                    onClick={handleSubmit(handleFormSaving)}
                  >
                    Save
                  </button>
                  <button
                    className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                    type="submit"
                  >
                    Submit For Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
