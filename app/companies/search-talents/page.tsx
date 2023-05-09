import { Metadata } from "next";
import Header from "@/app/components/header";
import TalentResult from "./talent-result";

export const metadata: Metadata = {
  title: "Search Talents | Companies | GoodHive",
  description: "The Decentralized Freelancing Plateforme",
};

export default function SearchTalents() {
  return (
    <main className="mx-5">
      <Header />
      <h1 className="text-xl pt-16 mx-5 font-bold">
        Search Results
        <span className="text-base font-normal">- Talent Search</span>
      </h1>
      <TalentResult />
    </main>
  );
}
