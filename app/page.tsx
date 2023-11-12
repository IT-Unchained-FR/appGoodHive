import { Metadata } from "next";

import { Hero } from "@components/home/hero";
import { Services } from "@components/home/services";
import { HowItWorks } from "@components/home/howitworks";
import { ReachUs } from "@components/home/reachus";

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
