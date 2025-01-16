"use client";

import {
  useRef,
  useState,
  FormEvent,
  useEffect,
  useContext,
  useCallback,
} from "react";
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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
    inreview: null,
  });

  console.log(profileData, "Profile Data...");
  const unapprovedProfile =
    profileData?.approved === false && profileData.inreview === true;

  const savedProfile =
    profileData?.approved === false && profileData.inreview === false;

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [noProfileFound, setNoProfileFound] = useState<boolean>(false);
  const [isShowReferralSection, setIsShowReferralSection] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<LabelOption | null>(
    null,
  );

  const walletAddress = useContext(AddressContext);

  const handleImageClick = () => {
    setProfileData({ ...profileData, image_url: "" });
  };

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);

    const profileResponse = await fetch(
      `/api/companies/my-profile?userId=${userId}`,
    );

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();

      setProfileData(profileData);

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
  }, [userId]);

  useEffect(() => {
    setNoProfileFound(false);

    if (userId) fetchProfile();
  }, [userId, fetchProfile]);

  const handleFormSubmit = async (data: any, validate: boolean) => {
    setIsSaving(true);

    const isNewUser = !profileData.designation;
    const referralCode = Cookies.get("referralCode");
    const imageUrl = profileImage
      ? await uploadFileToBucket(profileImage)
      : null;

    const isAlreadyReferred = profileData.referrer ? true : false;

    const requiredFields = {
      headline: "Profile header",
      designation: "Profile description",
      address: "First name",
      email: "Last name",
      country: "Country",
      city: "City",
      phone_country_code: "Phone country code",
      phone_number: "Phone number",
      telegram: "Telegram",
    };

    if (validate) {
      const newErrors: { [key: string]: string } = {};

      Object.entries(requiredFields).forEach(([key, label]) => {
        if (!data[key]) {
          newErrors[key] = `${label} is required`;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        console.log(errors, "errors...");
        toast.error("Please fill in all required fields");
        setIsSaving(false);
        return;
      }
    }

    setErrors({}); // Clear errors if validation passes

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
      inreview: validate,
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
        window.location.reload();
      } else {
        toast.success("Profile sent to review by the core team!");
      }
    }
  };

  const handleFormSaving = (e: any) => {
    e.preventDefault();
    handleFormSubmit(profileData, false);
  };

  const handleFormReview = (e: any) => {
    e.preventDefault();
    handleFormSubmit(profileData, true);
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
      {noProfileFound && (
        <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
          🚀 Please Create a Profile To Continue
        </p>
      )}
      {unapprovedProfile && (
        <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
          🚀 Your Profile Is Pending Approval. It Will Be Live Soon After
          Review.
        </p>
      )}
      {savedProfile && (
        <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
          🚀 Your profile is saved complete the mandatory fields and submit for
          review when ready.
        </p>
      )}
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300 pb-2">
        My Profile
      </h1>
      <section>
        <form>
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
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    designation: e.target.value,
                  })
                }
              />
              {errors.designation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.designation as string}
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
                onChange={(e) =>
                  setProfileData({ ...profileData, headline: e.target.value })
                }
              />
              {errors.headline && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.headline as string}
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
                  defaultValue={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email as string}
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
                  onChange={(e) =>
                    setProfileData({ ...profileData, address: e.target.value })
                  }
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.address as string}
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
                  onChange={(e) =>
                    setProfileData({ ...profileData, city: e.target.value })
                  }
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.city as string}
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
                    setSelectedCountry(country);
                    setProfileData({ ...profileData, country });
                  }}
                  options={countries}
                  defaultValue={
                    countries[
                      countries.findIndex(
                        (country) => country.value === profileData?.country,
                      )
                    ]
                  }
                />
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.country as string}
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
                    id="phone-country-code"
                    aria-label="Phone country code selector"
                    defaultValue={profileData.phone_country_code}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        phone_country_code: e.target.value,
                      })
                    }
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
                      {errors.phone_country_code as string}
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
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      phone_number: e.target.value,
                    })
                  }
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone_number as string}
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
                  defaultValue={
                    profileData[
                      socialLink.name as keyof typeof profileData
                    ]?.toString() || ""
                  }
                  setValue={(name, value) => {
                    setProfileData((prev) => ({
                      ...prev,
                      [name]: value,
                    }));
                  }}
                  errorMessage={errors[socialLink.name as keyof typeof errors]}
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
                    onClick={handleFormSaving}
                  >
                    Save
                  </button>
                  <button
                    className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                    type="submit"
                    onClick={handleFormReview}
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
