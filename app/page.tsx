import { Hero } from "@components/home/hero";
import { HowItWorks } from "@components/home/how-it-works";
import { ReachUs } from "@components/home/reach-us";
import { Services } from "@components/home/services";

export default function Home() {
  return (
    // Page Starts From Here
    <div className="home-page overflow-hidden">
      <Hero />
      <Services />
      <HowItWorks />
      <ReachUs />
    </div>
  );
}
