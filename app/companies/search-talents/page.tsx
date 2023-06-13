"use client";

import { useEffect, useState } from "react";

import { BigNumberish } from "ethers";

import Header from "@/app/components/header";
import TalentResult from "./talent-result";

interface Talent {
  title: string;
  jobHeadline: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  phoneCountryCode: number;
  phoneNumber: number;
  email: string;
  aboutWork: string;
  telegram: string;
  rate: BigNumberish;
  currency: string;
  skills: string[];
  imageUrl: string;
}

export default function SearchTalents() {
  const [talentsData, setTalentsData] = useState<Talent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const talentsResponse = await fetch("/api/companies/search-talents");
        if (!talentsResponse.ok) {
          throw new Error("Failed to fetch data from the server");
        }
        const talents = await talentsResponse.json();
        setTalentsData(talents);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="mx-5">
      <Header />
      <h1 className="text-xl pt-16 mx-5 font-bold">
        Search Results
        <span className="text-base font-normal">- Talent Search</span>
      </h1>
      <TalentResult talents={talentsData} />
    </main>
  );
}