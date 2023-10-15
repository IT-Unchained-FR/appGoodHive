import { Metadata } from "next";
import Image from "next/image";

import { Button } from "./components/button";

export const metadata: Metadata = {
  title: "Home Page | GoodHive",
  description: "The Decentralized Freelancing Platform",
};

export default function Home() {
  return (
    <div>
      <div className="[background:linear-gradient(180deg,_rgba(214,_194,_188,_0.74),_rgba(0,_0,_0,_0.74))]">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="relative order-first justify-self-end sm:row-span-2 sm:order-2">
            <Image
              alt="Bees"
              src="/img/bees.png"
              width="0" // width and height are required for next/image but it will be ignored
              height="0"
              sizes="100vw"
              className="w-full h-auto"
            />
          </div>
          <div className="flex flex-col content-around bg-comb">
            <div className="p-5 text-3xl font-bold">
              <h1>The Decentralized Freelancing Platform</h1>
            </div>
            <div className="p-5 text-xl font-bold">
              <p>More collaborative, more transparent and fairer than ever.</p>
            </div>
            <div className="flex flex-col justify-around p-5 lg:flex-row">
              {/* TODO: Add links to the buttons */}
              <Button text="Find a Job" type="primary" size="large" />
              <Button text="Find a Talent" type="primary" size="large" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-white md:col-span-2">
        <div className="p-10 text-4xl text-black ">
          <b className="">Why to Choose GoodHive?</b>
        </div>
        <div className="p-10 text-2xl text-gray">
          GoodHive is platform drive by the community, for the community. We are
          a group of freelancers, developers, designers, and crypto enthusiasts
          who are passionate about building a better future for freelancers.
        </div>
      </div>
      <div>
        <Image
          alt="honeycomb-footer"
          src="/img/footer@3x.png"
          width="0" // width and height are required for next/image but it will be ignored
          height="0"
          sizes="100vw"
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}
