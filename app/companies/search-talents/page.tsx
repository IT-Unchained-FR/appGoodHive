"use client";

import { useEffect, useState } from "react";

import Header from "@/app/components/header";
import Talent from "@interfaces/talent";
import TalentResult from "./talent-result";

export default function SearchTalents() {
  const [talentsData, setTalentsData] = useState<Talent[]>([]);

  useEffect(() => {
    const fetchTalents = async () => {
      try {
        const talentsResponse = await fetch("/api/companies/search-talents", {
          next: { revalidate: 1 },
        });

        if (!talentsResponse.ok) {
          throw new Error("Failed to fetch data from the server");
        }

        const talents = await talentsResponse.json();

        setTalentsData(talents);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchTalents();
  }, []);

  return (
    <main className="mx-5">
      <Header />
      <h1 className="pt-16 mx-5 text-xl font-bold">
        Search Results
        <span className="text-base font-normal">- Talent Search</span>
      </h1>
      <TalentResult talents={talentsData} />
    </main>
  );
}
