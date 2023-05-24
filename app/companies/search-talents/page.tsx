"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/header";
import TalentResult from "./talent-result";

interface Talent {
  title: string;
  jobHeadline: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  aboutWork: string;
  telegram: string;
  rate: string;
  currency: string;
  skills: string[];
  imageUrl: string;
};

export default function SearchTalents() {
  const [talentsData, setTalentsData] = useState<Talent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/companies/search-talents");
        if (!response.ok) {
          throw new Error("Failed to fetch data from the server");
        }
        const talentsData = await response.json(); // Parse the response as JSON
        setTalentsData(talentsData); // Update the state with the fetched data
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData(); // Call the fetchData function when the component mounts
  }, []);

  return (
    <main className="mx-5">
      <Header />
      <h1 className="text-xl pt-16 mx-5 font-bold">
        Search Results
        <span className="text-base font-normal">- Talent Search</span>
      </h1>
      <TalentResult talentsData={talentsData} />
    </main>
  );
}
