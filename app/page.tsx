import { Metadata } from "next";

import { Hero } from "@components/home/hero";
import { Services } from "@components/home/services";
import { HowItWorks } from "@components/home/how-it-works";
import { ReachUs } from "@components/home/reach-us";
import GoogleAnalytics from "@components/google-analytics";

export const metadata: Metadata = {
  title: "Home Page | GoodHive",
  description: "The Decentralized Freelancing Platform",
};

export default function Home() {
  return (
    <div className="home-page overflow-hidden">
      <GoogleAnalytics />
      <Hero />
      <Services />
      <HowItWorks />
      <ReachUs />
    </div>
  );
}
