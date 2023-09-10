"use client";

import { useState, useEffect, useContext } from "react";

import { SelectInput } from "../../components/select-input";
import { AddressContext } from "../../components/context";
// TODO: use button but before add the type of the button component (i.e. type="button" or type="submit")
// import { Button } from "../../components/button";
import { countries } from "@/app/constants/countries";
import LabelOption from "@interfaces/label-option";

export default function MyProfile({ params }: { params: { address: string } }) {
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
        const response = await fetch(`/api/talents/${params.address}`); // replace with your actual API endpoint

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

  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300 pb-2">
        Profile
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
        <div className="flex flex-col items-center justify-center w-full mt-10">
          {profileData.image_url && (
            <div
              className="relative h-[230px] w-[230px] flex items-center mt-10 justify-center cursor-pointer bg-gray-100"
              style={{
                clipPath:
                  "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
              }}
            >
              <img className="object-cover" src={profileData.image_url} />
            </div>
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
            disabled
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
              disabled
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
                disabled
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
                disabled
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-4 sm:flex-row">
            <div className="flex-1">
              <SelectInput
                labelText="Country"
                name="country"
                required={false}
                disabled
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
                pattern="[a-zA-Z -]+"
                maxLength={100}
                defaultValue={profileData?.city}
                disabled
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
                  disabled
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
                disabled
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
                disabled
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
                disabled
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
                disabled
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
              disabled
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
              <div className="pt-1 pb-4">
                {!!selectedSkills && selectedSkills.length > 0 && (
                  <div className="flex flex-wrap mt-1">
                    {selectedSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="border border-[#FFC905] flex items-center bg-gray-200 rounded-full py-1 px-3 m-1"
                      >
                        <span className="mr-2">{skill}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
