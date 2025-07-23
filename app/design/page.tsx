"use client";

import Image from "next/image";

import { ChangeEvent, useState } from "react";

import LabelOption from "@interfaces/label-option";
import { Button } from "../components/button";
import { IconButton } from "../components/icon-button";
import { Input } from "../components/input";
import { SelectInput } from "../components/select-input";

export default function Design() {
  const [textValue, setTextValue] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [urlValue, setURLValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<LabelOption | null>(
    null,
  );

  const textHandleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTextValue(event.target.value);
  };
  const numberHandleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNumberValue(event.target.value);
  };
  const emailHandleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmailValue(event.target.value);
  };
  const passwordHandleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswordValue(event.target.value);
  };
  const urlHandleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setURLValue(event.target.value);
  };

  const options: LabelOption[] = [
    { value: "option 1", label: "option 1" },
    { value: "option 2", label: "option 2" },
  ];

  return (
    <main className="mx-5">
      <h1 className="text-3xl font-bold font-montserrat">Design System</h1>

      <section className="mt-5 body-font font-montserrat">
        <h2 className="text-2xl font-bold">Logo</h2>
        <Image
          className="ml-10"
          width={600}
          height={456}
          src="/img/goodhive_logo.png"
          alt="Goodhive"
        />
      </section>

      <section className="mt-5 body-font font-montserrat">
        <h2 className="text-2xl font-bold">Typography</h2>
        <p className="m-3 text-sm font-light">Font family: Montserrat</p>
        <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3">
          <div className="grid p-5 mx-10 space-y-2 bg-gray-200 rounded-lg justify-items-left">
            <h3 className="text-xl font-semibold">Headlines</h3>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">H1</h1>
              <p>text-3xl font-bold</p>
            </div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold">H2</h2>
              <p>text-2xl font-bold</p>
            </div>
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-bold">H3</h3>
              <p>text-xl font-bold</p>
            </div>
            <div className="flex items-center space-x-3">
              <h4 className="text-base font-bold">H4</h4>
              <p>text-base font-bold</p>
            </div>
          </div>

          <div className="grid p-5 mx-10 space-y-2 bg-gray-200 rounded-lg justify-items-left">
            <h3 className="text-xl font-semibold">Text</h3>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl">Subtitle 1</h1>
              <p>text-2xl</p>
            </div>
            <div className="flex items-center space-x-3">
              <h2 className="text-base font-semibold">Body 1</h2>
              <p>text-base font-semibold</p>
            </div>
            <div className="flex items-center space-x-3">
              <h3 className="text-base">Body 2</h3>
              <p>text-base</p>
            </div>
            <div className="flex items-center space-x-3">
              <h4 className="text-sm">Body 3</h4>
              <p>text-sm</p>
            </div>
          </div>

          <div className="grid p-5 mx-10 space-y-2 bg-gray-200 rounded-lg justify-items-left">
            <h3 className="text-xl font-semibold">Buttons</h3>
            <div className="flex items-center space-x-3">
              <h1 className="text-base font-semibold">Large</h1>
              <p>text-base font-semibold</p>
            </div>
            <div className="flex items-center space-x-3">
              <h2 className="text-base">Medium</h2>
              <p>text-base</p>
            </div>
            <div className="flex items-center space-x-3">
              <h4 className="text-sm">Small</h4>
              <p>text-sm</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 body-font font-montserrat">
        <h2 className="text-2xl font-bold">Buttons</h2>
        <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3">
          <div className="grid mx-10 justify-items-center">
            <h3 className="mt-5 text-xl">Primary Buttons</h3>
            <Button text="Large" type="primary" size="large" />
            <Button text="Medium" type="primary" size="medium" />
          </div>
          <div className="grid mx-10 justify-items-center">
            <h3 className="mt-5 text-xl">Secondary Buttons</h3>
            <Button text="Large" type="secondary" size="large" />
            <Button text="Medium" type="secondary" size="medium" />
          </div>
          <div className="grid mx-10 justify-items-center">
            <h3 className="mt-5 text-xl">Icon Buttons</h3>
            <IconButton
              text="Large"
              type="primary"
              size="large"
              image="M184 48H328c4.4 0 8 3.6 8 8V96H176V56c0-4.4 3.6-8 8-8zm-56 8V96H64C28.7 96 0 124.7 0 160v96H192 320 512V160c0-35.3-28.7-64-64-64H384V56c0-30.9-25.1-56-56-56H184c-30.9 0-56 25.1-56 56zM512 288H320v32c0 17.7-14.3 32-32 32H224c-17.7 0-32-14.3-32-32V288H0V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V288z"
            />
            <IconButton
              text="Medium"
              type="secondary"
              size="medium"
              image="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
            />
          </div>
        </div>
      </section>

      <section className="mt-5 body-font font-montserrat">
        <h2 className="text-2xl font-bold">Links</h2>
      </section>

      {/* <section className="mt-5 body-font font-montserrat">
        <h2 className="text-2xl font-bold">Cards</h2>
        <h3 className="mt-2 text-xl">Company Card</h3>
        <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3">
          <Card
            type="company"
            title="Job Title 1"
            postedBy="by Goodhive"
            postedOn="posted 4 days ago"
            image="/img/company_img.png"
            countryFlag="/img/country_flag.png"
            city=""
            rate={100}
            currency=""
            description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
            skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
            buttonText="Apply"
          />
          <Card
            type="company"
            title="Job Title 2"
            postedBy="by Goodhive"
            postedOn="posted 3 days ago"
            image="/img/company_img.png"
            countryFlag="/img/country_flag.png"
            city=""
            rate={100}
            currency=""
            description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
            skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
            buttonText="Apply"
          />
          <Card
            type="company"
            title="Job Title 3"
            postedBy="by Goodhive"
            postedOn="posted 2 days ago"
            image="/img/company_img.png"
            countryFlag="/img/country_flag.png"
            city=""
            rate={100}
            currency=""
            description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
            skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
            buttonText="Apply"
          />
        </div>
        <h3 className="mt-5 text-xl">Talent Card</h3>
        <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3">
          <Card
            type="talent"
            title="Talent 1 Position"
            postedBy="Talent Name"
            postedOn="Active 4 days ago"
            image="/img/talent_avatar.png"
            countryFlag="/img/country_flag.png"
            city="Paris"
            rate={75}
            currency="EUR"
            description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod."
            skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
            buttonText="Connect"
          />
          <Card
            type="talent"
            title="Talent 2 Position"
            postedBy="Talent Name"
            postedOn="Active 3 days ago"
            image="/img/talent_avatar.png"
            countryFlag="/img/country_flag.png"
            city="Hyderabad"
            rate={50}
            currency="BTC"
            description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod."
            skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
            buttonText="Connect"
          />
          <Card
            type="talent"
            title="Talent 3 Position"
            postedBy="Talent Name"
            postedOn="Active 2 days ago"
            image="/img/talent_avatar.png"
            countryFlag="/img/country_flag.png"
            city="San Francisco"
            rate={120}
            currency="USD"
            description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod."
            skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
            buttonText="Connect"
          />
        </div>
      </section> */}

      <section className="mt-5 body-font font-montserrat">
        <h2 className="text-2xl font-bold">Inputs</h2>
        <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3">
          <Input
            labelText="Text Input*"
            placeholder="Enter a text"
            type="text"
            required={true}
            disabled={false}
            value={textValue}
            onChange={textHandleChange}
          />
          <Input
            labelText="Number Input*"
            placeholder="Enter a number"
            type="number"
            required={true}
            disabled={false}
            value={numberValue}
            onChange={numberHandleChange}
          />
          <Input
            labelText="Email Input*"
            placeholder="Enter your email"
            type="email"
            required={true}
            disabled={false}
            value={emailValue}
            onChange={emailHandleChange}
          />
          <Input
            labelText="Password Input*"
            placeholder="Enter your password"
            type="password"
            required={true}
            disabled={false}
            value={passwordValue}
            onChange={passwordHandleChange}
          />
          <Input
            labelText="URL Input"
            placeholder="Enter a URL"
            type="url"
            required={false}
            disabled={false}
            value={urlValue}
            onChange={urlHandleChange}
          />
          <Input
            labelText="Disabled Input"
            placeholder="Not able to write"
            type="text"
            required={false}
            disabled={true}
            value="Disabled value"
            onChange={textHandleChange}
          />
          <SelectInput
            labelText="Select an option"
            required={true}
            disabled={false}
            inputValue={selectedOption}
            setInputValue={setSelectedOption}
            options={options}
          />
        </div>
      </section>

      <section className="mt-5 body-font font-montserrat">
        <h2 className="text-2xl font-bold">Metamask</h2>
      </section>
    </main>
  );
}
