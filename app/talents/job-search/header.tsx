"use client";
import React, { useState } from "react";

import { Input } from "../../components/input";
import { IconButton } from "../../components/icon-button";
import { Card } from "../../components/card";

export default function Header() {
  const [textValue, setTextValue] = useState("");

  const textHandleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(event.target.value);
  };
  return (
    <main className="mx-5">
      <div>
        <h1 className="text-2xl font-bold">Looking for Job </h1>
      </div>
      <div className="pt-7 space-y-6 w-5/12">
        <Input
          placeholder="Try Developer Solidity, Rust, C++..."
          type="text"
          required={true}
          disabled={false}
          value={textValue}
          onChange={textHandleChange}
        ></Input>

        <Input
          placeholder="Location Paris, Lodon, Remote..."
          type="text"
          required={true}
          disabled={false}
          value={textValue}
          onChange={textHandleChange}
        ></Input>

        <div className="flex  space-x-11 ">
          <IconButton
            text="Create Profile"
            type="secondary"
            size="large"
            image="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"
          />
          <IconButton
            text="Search Job"
            type="primary"
            size="large"
            image="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
          />
        </div>
      </div>
      <div className="pt-16  ">
        <h1 className="text-xl font-bold">
          Search Results
          <span className="text-base font-normal">- Talent Search</span>
        </h1>
        <div className="grid grid-cols-3">
          <Card
            type="talent"
            title="Talent 3 Position"
            postedBy="Talent Name"
            postedOn="Active 2 days ago"
            image="/img/talent_avatar.png"
            countryFlag="/img/country_flag.png"
            city="San Francisco"
            rate="120"
            currency="USD"
            description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod."
            skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
            buttonText="Connect"
            escrowFee=""
          />
        </div>
      </div>
    </main>
  );
}
