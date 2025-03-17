"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { uploadFileToBucket } from "@/app/utils/upload-file-bucket";
import Image from "next/image";
import { Button } from "@/app/components/button";
import { useRouter } from "next/navigation";
import { ToggleButton } from "@/app/components/toggle-button";
import Link from "next/link";
import { resumeUploadSizeLimit } from "./constants";
import { countries } from "@/app/constants/countries";
import { AutoSuggestInput } from "@/app/components/autosuggest-input";
import { skills } from "@/app/constants/skills";
import { createJobServices } from "@/app/constants/common";
import { socialLinks } from "./constant";
import { SocialLink } from "./social-link";
import DragAndDropFile from "@/app/components/drag-and-drop-file";
import Cookies from "js-cookie";
import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";
import { ReferralSection } from "@/app/components/referral/referral-section";
import { SearchableSelectInput } from "@/app/components/searchable-select-input";

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
  skills?: string;
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
  user_id?: string;
  inreview?: boolean;
  referred_by?: string;
  approved_roles?: object[];
};

// Component to display profile status
const ProfileStatus = ({ profileData }: { profileData: ProfileData }) => {
  const unapprovedProfile =
    profileData?.approved === false && profileData.inreview === true;
  const savedProfile =
    profileData?.approved === false && profileData.inreview === false;

  if (!unapprovedProfile && !savedProfile) return null;

  return (
    <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
      {unapprovedProfile
        ? "🚀 Your profile is pending approval. Check your email to schedule your interview."
        : "🚀 Profile saved! Complete the mandatory fields and submit for review when ready."}
    </p>
  );
};

export default function ProfilePage() {
  // Static references
  const imageInputRef = useRef(null);
  const isInitialMount = useRef(true);

  // Router
  const router = useRouter();

  // User identifiers
  const user_id = useMemo(() => Cookies.get("user_id"), []);

  // Primary state
  const [profileData, setProfileData] = useState<ProfileData>(
    {} as ProfileData,
  );
  const [user, setUser] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // UI state
  const [isProfileDataFetching, setIsProfileDataFetching] = useState(false);
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);
  const [reviewProfileLoading, setReviewProfileLoading] = useState(false);

  // Form state
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploadedCvLink, setIsUploadedCvLink] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Derived state
  const unapprovedProfile = useMemo(
    () => profileData?.approved === false && profileData.inreview === true,
    [profileData?.approved, profileData.inreview],
  );

  const savedProfile = useMemo(
    () => profileData?.approved === false && profileData.inreview === false,
    [profileData?.approved, profileData.inreview],
  );

  // API calls
  const fetchProfile = useCallback(async () => {
    if (!user_id) return;

    try {
      setIsProfileDataFetching(true);
      const response = await fetch(
        `/api/talents/my-profile?user_id=${user_id}`,
      );

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);

        // Only set these on initial mount
        if (isInitialMount.current) {
          if (data.country) {
            setSelectedCountry({ value: data.country, label: data.country });
          }
          if (data.skills) {
            setSelectedSkills(data.skills.split(","));
          }
          isInitialMount.current = false;
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsProfileDataFetching(false);
    }
  }, [user_id]);

  const fetchUser = useCallback(async () => {
    if (!user_id) return;

    try {
      const response = await fetch(`/api/profile?user_id=${user_id}`);
      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }, [user_id]);

  // Initial data load
  useEffect(() => {
    if (!user_id) return;

    const initializeData = async () => {
      await Promise.all([fetchProfile(), fetchUser()]);
    };

    initializeData();
  }, [user_id, fetchProfile, fetchUser]);

  // Form validation
  const validateForm = useCallback(
    (data: ProfileData, requireAll: boolean): boolean => {
      if (!requireAll) return true;

      const requiredFields = {
        title: "Profile header",
        description: "Profile description",
        first_name: "First name",
        last_name: "Last name",
        country: "Country",
        city: "City",
        phone_country_code: "Phone country code",
        phone_number: "Phone number",
        email: "Email",
        about_work: "About work",
        telegram: "Telegram",
      };

      const newErrors: { [key: string]: string } = {};

      Object.entries(requiredFields).forEach(([key, label]) => {
        if (!data[key as keyof ProfileData]) {
          newErrors[key] = `${label} is required`;
        }
      });

      // Make skills mandatory for review submission
      if (!selectedSkills.length) {
        newErrors.skills = "Skills are required";
      }

      if (!data.talent && !data.mentor && !data.recruiter) {
        newErrors.role = "Select at least one role";
        setErrors(newErrors);
        toast.error("Select at least one role");
        return false;
      }

      if (requireAll && !data.cv_url && !cvFile) {
        newErrors.cv_url = "Please upload your CV";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Please fill in all required fields");
        return false;
      }

      setErrors({});
      return true;
    },
    [selectedSkills],
  );

  // Form submission
  const handleFormSubmit = useCallback(
    async (validate: boolean) => {
      try {
        if (validate) {
          setReviewProfileLoading(true);
        } else {
          setSaveProfileLoading(true);
        }

        // Validate form
        if (!validateForm(profileData, validate)) {
          setSaveProfileLoading(false);
          setReviewProfileLoading(false);
          return;
        }

        // Upload files if necessary
        let imageUrl = profileData.image_url;
        let cvUrl = profileData.cv_url;

        if (profileImage) {
          imageUrl = (await uploadFileToBucket(profileImage)) as string;
        }

        if (cvFile) {
          cvUrl = (await uploadFileToBucket(cvFile)) as string;
        }

        // Prepare form data
        const formData = {
          ...profileData,
          country: selectedCountry?.value,
          phone_country_code: selectedCountry?.phoneCode,
          skills: selectedSkills.join(","),
          image_url: imageUrl,
          cv_url: cvUrl,
          wallet_address: walletAddress,
          user_id,
        };

        if (validate && user?.referred_by) {
          formData.referred_by = user.referred_by;
        }

        // Submit form
        const profileResponse = await fetch("/api/talents/my-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, validate }),
        });

        console.log(
          profileResponse.ok,
          validate,
          "profileResponse",
          "validate",
        );
        if (profileResponse.ok) {
          // Send email when profile is sent for review
          if (validate) {
            try {
              await fetch("/api/send-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: formData.email,
                  type: "new-talent",
                  subject: `Welcome to GoodHive, ${formData.first_name}! 🎉 Your profile has been sent for review`,
                  toUserName: `${formData.first_name} ${formData.last_name}`,
                }),
              });
            } catch (error) {
              console.error("Error sending email:", error);
              // Don't show error to user, since the profile was saved successfully
            }
          }

          toast.success(
            validate
              ? "Profile sent to review by the core team!"
              : "Profile saved successfully",
          );
          fetchProfile();
        } else {
          const profileSavingErrorData = await profileResponse.json();
          toast.error(profileSavingErrorData.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong while saving your profile");
      } finally {
        setSaveProfileLoading(false);
        setReviewProfileLoading(false);
      }
    },
    [
      profileData,
      validateForm,
      profileImage,
      cvFile,
      selectedCountry,
      selectedSkills,
      walletAddress,
      user_id,
      user,
      fetchProfile,
    ],
  );

  // Event handlers
  const handleSaveProfile = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleFormSubmit(false);
    },
    [handleFormSubmit],
  );

  const handleSendForReview = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleFormSubmit(true);
    },
    [handleFormSubmit],
  );

  const handleCvFileChange = useCallback((file: File | null) => {
    if (!file) return;

    if (file.size > 1024 * 1024 * Number(resumeUploadSizeLimit)) {
      toast.error(`File size should be less than ${resumeUploadSizeLimit} MB`);
      return;
    }

    setCvFile(file);
  }, []);

  const onCvInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      handleCvFileChange(event.target.files[0]);
    },
    [handleCvFileChange],
  );

  const handleCountryChange = useCallback((country: any) => {
    if (!country) return;

    setSelectedCountry(country);
    setProfileData((prev) => ({
      ...prev,
      country: country?.value,
      phone_country_code: country?.phoneCode,
    }));
  }, []);

  const handleSkillsChange = useCallback(
    (skills: string[]) => {
      setSelectedSkills(skills);
      setProfileData((prev) => ({
        ...prev,
        skills: skills.join(","),
      }));

      // Clear the skills error if at least one skill is added
      if (skills.length > 0 && errors.skills) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.skills;
          return updated;
        });
      }
    },
    [errors.skills],
  );

  const handleInputChange = useCallback((name: string, value: any) => {
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleToggleChange = useCallback((name: string, checked: boolean) => {
    setProfileData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }, []);

  // Loading states
  if (isProfileDataFetching) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Loading Your Profile..."} />;
  }

  if (saveProfileLoading) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Saving Your Profile..."} />;
  }

  // Render components
  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileStatus profileData={profileData} />

      <form className="space-y-6">
        {/* Profile Image */}
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
              isRenderedPage={true}
              setIsRenderedPage={() => {}}
              imageInputValue={imageInputRef}
            />
          )}
        </div>

        {/* Public View Button */}
        <div className="w-full flex justify-center mt-7">
          <Button
            text="Public View"
            type="secondary"
            size="medium"
            onClickHandler={() => router.push(`/talents/${user_id}`)}
          />
        </div>

        {/* Availability Toggle */}
        <div className="flex w-full justify-center mt-5">
          <label
            htmlFor="availability"
            className="inline-block ml-3 mr-5 text-base text-black form-label"
          >
            Set Availability
          </label>
          <ToggleButton
            label=""
            name="availability"
            tooltip="If Seeking Jobs"
            checked={profileData.availability}
            setValue={handleToggleChange}
            errorMessage={errors.availability}
          />
        </div>

        {/* Profile Header */}
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
            value={profileData?.title || ""}
            onChange={(e) => handleInputChange("title", e.target.value)}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}

          {/* Description */}
          <div className="mt-5">
            <textarea
              className="form-control block w-full px-4 py-2 pb-4 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
              placeholder="Describe your skills and experience in a few words*"
              maxLength={5000}
              rows={8}
              value={profileData?.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p
              className="text-[13px] mt-2 text-right w-full"
              style={{ color: "#FFC905" }}
            >
              {profileData.description?.length || 0}/5000
            </p>
          </div>

          {/* Name Fields */}
          <div className="flex gap-4 mt-4 sm:flex-col">
            <div className="flex-1">
              <label
                htmlFor="first_name"
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
                value={profileData?.first_name || ""}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>
            <div className="flex-1">
              <label
                htmlFor="last_name"
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
                value={profileData?.last_name || ""}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Location Fields */}
          <div className="flex sm:flex-col gap-4 mt-4">
            <div className="flex-1">
              <SearchableSelectInput
                required={false}
                labelText="Country"
                name="country"
                inputValue={selectedCountry}
                setInputValue={handleCountryChange}
                options={countries}
                placeholder="Search for a country..."
                defaultValue={
                  countries[
                    countries.findIndex(
                      (country) => country.value === profileData?.country,
                    )
                  ]
                }
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
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
                pattern="[a-zA-Z -]+"
                maxLength={100}
                value={profileData?.city || ""}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>
          </div>

          {/* Phone Fields */}
          <div className="flex sm:flex-col gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="phone_country_code"
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
                  readOnly
                />
              </div>
              {errors.phone_country_code && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone_country_code}
                </p>
              )}
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
                type="number"
                maxLength={20}
                value={profileData?.phone_number || ""}
                onChange={(e) =>
                  handleInputChange("phone_number", e.target.value)
                }
              />
              {errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone_number}
                </p>
              )}
            </div>
          </div>

          {/* Email and Rate Fields */}
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
                value={profileData?.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
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
                value={profileData?.rate || ""}
                onChange={(e) =>
                  handleInputChange("rate", Number(e.target.value))
                }
              />
              {errors.rate && (
                <p className="text-red-500 text-sm mt-1">{errors.rate}</p>
              )}
            </div>
          </div>

          {/* Hide Contact Details Toggle */}
          <div className="w-full mt-5 pl-2">
            <ToggleButton
              label="Hide my contact details"
              name="hide_contact_details"
              checked={profileData?.hide_contact_details ?? false}
              setValue={handleToggleChange}
            />
            {errors.hide_contact_details && (
              <p className="text-red-500 text-sm mt-1">
                {errors.hide_contact_details}
              </p>
            )}
          </div>

          {/* About Work */}
          <div className="mt-4">
            <label
              htmlFor="about_work"
              className="inline-block ml-3 text-base text-black form-label"
            >
              About your Work*
            </label>
            <textarea
              className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
              placeholder="What you are looking for?"
              rows={8}
              maxLength={5000}
              value={profileData?.about_work || ""}
              onChange={(e) => handleInputChange("about_work", e.target.value)}
            />
            {errors.about_work && (
              <p className="text-red-500 text-sm mt-1">{errors.about_work}</p>
            )}
            <p
              className="text-[13px] mt-2 text-right w-full"
              style={{ color: "#FFC905" }}
            >
              {profileData.about_work?.length || 0}/5000
            </p>
          </div>

          {/* CV Upload */}
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
              <div>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="CV"
                  type="file"
                  name="cv"
                  accept=".pdf"
                  onChange={onCvInputChange}
                />
                {errors.cv_url && (
                  <p className="text-red-500 text-sm mt-1">{errors.cv_url}</p>
                )}
              </div>
            )}
          </div>

          {/* Work Preference Toggles */}
          <div className="flex w-full justify-between mt-9 sm:flex-wrap sm:gap-3">
            <ToggleButton
              label="Freelance Only"
              name="freelance_only"
              checked={profileData?.freelance_only ?? false}
              setValue={handleToggleChange}
            />
            <ToggleButton
              label="Remote Only"
              name="remote_only"
              checked={profileData?.remote_only ?? false}
              setValue={handleToggleChange}
            />
          </div>

          {/* Skills Section */}
          <div className="relative flex flex-col gap-4 mt-12 mb-2 z-30 sm:flex-row">
            <div className="flex-1">
              <label
                htmlFor="skills"
                className="inline-block ml-3 text-base font-bold text-black form-label"
              >
                Skills*
              </label>
              <div
                className={`absolute w-full pt-1 pr-10 text-base font-normal text-gray-600 bg-white form-control ${errors.skills ? "border border-red-500 rounded-lg" : ""}`}
              >
                <AutoSuggestInput
                  inputs={skills}
                  selectedInputs={selectedSkills}
                  setSelectedInputs={handleSkillsChange}
                />
                {errors.skills && (
                  <p className="text-red-500 text-sm mt-1 ml-3">
                    {errors.skills}
                  </p>
                )}
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
                            const updatedSkills = [...selectedSkills];
                            updatedSkills.splice(index, 1);
                            handleSkillsChange(updatedSkills);
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

          {/* Role Selection */}
          <div className="flex flex-col mt-3">
            <p className="my-4">I want to be:</p>
            <div className="w-1/2 sm:w-full mb-5 px-3 flex justify-between sm:px-1 sm:flex-wrap sm:gap-3">
              {createJobServices.map((service) => {
                const { label, value } = service;
                const isChecked = profileData[
                  value as keyof ProfileData
                ] as boolean;
                return (
                  <ToggleButton
                    key={value}
                    label={label}
                    name={value}
                    checked={isChecked ?? false}
                    setValue={handleToggleChange}
                  />
                );
              })}
            </div>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role}</p>
            )}
          </div>

          {/* Social Links */}
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
                defaultValue={
                  profileData[
                    socialLink.name as keyof typeof profileData
                  ]?.toString() || ""
                }
                setValue={(name, value) => handleInputChange(name, value)}
                errorMessage={errors[socialLink.name as keyof typeof errors]}
              />
            ))}
          </div>

          {/* Referral Section */}
          <ReferralSection />

          {/* Submit Buttons */}
          <div className="mt-10 mb-16 text-center flex gap-4 justify-center">
            <button
              className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
              type="button"
              name="save-talent-only"
              onClick={handleSaveProfile}
              disabled={saveProfileLoading}
            >
              {saveProfileLoading ? "Saving Profile..." : "Save Profile"}
            </button>
            <button
              className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
              type="submit"
              name="send-for-review"
              onClick={handleSendForReview}
              disabled={reviewProfileLoading}
            >
              {reviewProfileLoading
                ? "Sending Profile To Review..."
                : "Send Profile To Review"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
