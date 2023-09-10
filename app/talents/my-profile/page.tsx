"use client";

import { useRef, useState, FormEvent, useEffect, useContext } from "react";

import toast from "react-hot-toast";
import Autosuggest from "react-autosuggest";

import DragAndDropFile from "../../components/drag-and-drop-file";
import { SelectInput } from "../../components/select-input";
import { AddressContext } from "../../components/context";
// TODO: use button but before add the type of the button component (i.e. type="button" or type="submit")
// import { Button } from "../../components/button";
import { skills } from "@/app/constants/skills";
import { countries } from "@/app/constants/countries";
import LabelOption from "@interfaces/label-option";
import FileData from "@interfaces/file-data";

export default function MyProfile() {
  const invoiceInputValue = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [file, setFile] = useState<false | FileData>(false);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [profileData, setProfileData] = useState({
    title: "",
    description: "",
    first_name: "",
    last_name: "",
    country: "",
    city: "",
    phone_country_code: "",
    phone_number: "",
    email: "",
    telegram: "",
    about_work: "",
    rate: "",
    skills: [],
    image_url: "",
  });

  const walletAddress = useContext(AddressContext);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<LabelOption | null>(
    null
  );

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(
          `/api/talents/my-profile?walletAddress=${walletAddress}`
        ); // replace with your actual API endpoint

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const profile = await response.json();

        setProfileData(profile);
        setSelectedSkills(profile.skills.split(","));
      } catch (error) {
        console.error("There was an error!", error);
      }
    };

    fetchProfileData();
  }, [walletAddress]);

  useEffect(() => {
    if (typeof file === "object" && file !== null) {
      const fetchImage = async () => {
        setIsLoading(true);

        const postImageResponse = await fetch("/api/picture", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(file),
        });

        if (postImageResponse.ok) {
          const { imageUrl } = await postImageResponse.json();

          setImageUrl(imageUrl);
        } else {
          console.error(postImageResponse.statusText);
        }

        setIsLoading(false);
      };

      fetchImage();
    }
  }, [file]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const dataForm = {
      title: formData.get("title"),
      description: formData.get("description"),
      firstName: formData.get("first-name"),
      lastName: formData.get("last-name"),
      country: selectedCountry?.value,
      city: formData.get("city"),
      phoneCountryCode: formData.get("phone-country-code"),
      phoneNumber: formData.get("phone-number"),
      email: formData.get("email"),
      telegram: formData.get("telegram"),
      aboutWork: formData.get("about-work"),
      rate: formData.get("rate"),
      skills: selectedSkills,
      imageUrl,
      walletAddress,
    };

    const profileResponse = await fetch("/api/talents/my-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    setIsLoading(false);

    if (!profileResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success(
        `🎉 Your profile has been successfully saved!

        It is now under review.
        `
      );
    }
  };

  //TODO: Put the following code in a Autosuggest Input component
  const AutoSuggestInput = () => {
    const [inputValue, setInputValue] = useState("");

    const getSuggestions = (value: string) => {
      const inputValue = value.trim().toLowerCase();
      const inputLength = inputValue.length;

      return inputLength === 0
        ? []
        : skills.filter(
            (skill) => skill.toLowerCase().slice(0, inputLength) === inputValue
          );
    };

    const onSuggestionSelected = (
      event: React.FormEvent<HTMLInputElement>,
      { suggestion }: Autosuggest.SuggestionSelectedEventData<string>
    ) => {
      if (!selectedSkills.includes(suggestion)) {
        setSelectedSkills([...selectedSkills, suggestion]);
      }
    };

    const renderSuggestion = (suggestion: string) => (
      <div className="mx-1 px-2 py-2 z-10 hover:text-[#FF8C05] bg-white shadow-md max-h-48 overflow-y-auto border-gray-400 border-b-[0.5px] border-solid">
        {suggestion}
      </div>
    );

    const inputProps = {
      placeholder: "JavaScript, NextJS,...",
      type: "text",
      maxLength: 255,
      name: "skills",
      value: inputValue,
      onChange: (
        event: React.FormEvent<HTMLElement>,
        { newValue }: { newValue: string }
      ) => {
        setInputValue(newValue);
      },
      className:
        "relative rounded-lg block w-full px-4 py-2 text-base font-normal text-gray-600 bg-clip-padding transition ease-in-out focus:text-black bg-gray-100 focus:outline-none focus:ring-0",
    };

    return (
      <Autosuggest
        suggestions={getSuggestions(inputValue)}
        onSuggestionsFetchRequested={() => ""}
        onSuggestionsClearRequested={() => ""}
        getSuggestionValue={(skill) => skill}
        onSuggestionSelected={onSuggestionSelected}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
    );
  };

  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300 pb-2">
        My Profile
      </h1>
      {!walletAddress && (
        <div>
          <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
            🚀 To get started, please connect your wallet. This will enable you
            to create or save your profile. Thanks!
          </p>
        </div>
      )}
      <section>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-center w-full mt-10">
            {profileData.image_url ? (
              <div
                className="relative h-[230px] w-[230px] flex items-center mt-10 justify-center cursor-pointer bg-gray-100"
                style={{
                  clipPath:
                    "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                }}
              >
                <img className="object-cover" src={profileData.image_url} />
              </div>
            ) : (
              <DragAndDropFile
                file={file}
                setFile={setFile}
                isRenderedPage={isRenderedPage}
                setIsRenderedPage={setIsRenderedPage}
                // FIXME: change name of invoiceInputValue to fileInputValue
                invoiceInputValue={invoiceInputValue}
              />
            )}
          </div>
          <div className="flex flex-col w-full mt-20">
            <div>
              <label
                htmlFor="title"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Job Profile*
              </label>
            </div>
            <input
              className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
              placeholder="Title"
              name="title"
              type="text"
              required
              maxLength={100}
              defaultValue={profileData?.title}
            />
            <div className="mt-5">
              <textarea
                name="description"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Describe your skills and experience in a few words*"
                required
                maxLength={255}
                rows={5}
                defaultValue={profileData?.description}
              />
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
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
                  name="first-name"
                  type="text"
                  required
                  pattern="[a-zA-Z -]+"
                  maxLength={100}
                  defaultValue={profileData?.first_name}
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
                  name="last-name"
                  type="text"
                  required
                  pattern="[a-zA-Z -]+"
                  maxLength={100}
                  defaultValue={profileData?.last_name}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <SelectInput
                  labelText="Country"
                  name="country"
                  required
                  disabled={false}
                  inputValue={selectedCountry}
                  setInputValue={setSelectedCountry}
                  options={countries}
                  defaultValue={
                    countries[
                      countries.findIndex(
                        (country) => country.value === profileData?.country
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
                  name="city"
                  required
                  pattern="[a-zA-Z -]+"
                  maxLength={100}
                  defaultValue={profileData?.city}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="phone-country-code"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Phone Country Code*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 top-[-4px] flex items-center pl-5 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">+</span>
                  </div>
                  <input
                    className="pl-8 form-control block w-full py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                    placeholder="Phone Country Code"
                    type="number"
                    name="phone-country-code"
                    required
                    maxLength={5}
                    defaultValue={profileData?.phone_country_code}
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
                  required
                  name="phone-number"
                  maxLength={20}
                  defaultValue={profileData?.phone_number}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
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
                  required
                  name="email"
                  maxLength={255}
                  defaultValue={profileData?.email}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="telegram"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Telegram
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Telegram"
                  type="text"
                  name="telegram"
                  maxLength={255}
                  defaultValue={profileData?.telegram}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="rate"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Rate ($/hour)
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Your rate per hour"
                  type="number"
                  name="rate"
                  maxLength={255}
                  defaultValue={profileData?.rate}
                />
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor="about-work"
                className="inline-block ml-3 text-base text-black form-label"
              >
                About your Work*
              </label>
              <textarea
                name="about-work"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="What you are looking for?"
                required
                rows={5}
                maxLength={65000}
                defaultValue={profileData?.about_work}
              />
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="skills"
                  className="inline-block ml-3 text-base font-bold text-black form-label"
                >
                  Skills*
                </label>
                <div className="absolute w-full pt-1 pr-10 text-base font-normal text-gray-600 bg-white form-control ">
                  <AutoSuggestInput />
                </div>
                <div className="pt-10">
                  {!!selectedSkills && selectedSkills.length > 0 && (
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
                                selectedSkills.filter((_, i) => i !== index)
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
            <div className="mt-10 text-right">
              {isLoading ? (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
                  type="submit"
                  disabled
                >
                  Saving...
                </button>
              ) : !!walletAddress ? (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                >
                  Save
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
