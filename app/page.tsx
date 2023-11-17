import { Metadata } from "next";

import { Hero } from "@components/home/hero";
import { Services } from "@components/home/services";
import { HowItWorks } from "@/app/components/home/how-it-works";
import { ReachUs } from "@/app/components/home/reach-us";

export const metadata: Metadata = {
  title: "Home Page | GoodHive",
  description: "The Decentralized Freelancing Platform",
};

export default function Home() {
  return (
    <div className="home-page overflow-hidden">
      <Hero />
      <Services />
      <HowItWorks />
      <ReachUs />
    </div>
  );
}
