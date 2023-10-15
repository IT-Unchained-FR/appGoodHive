import { Metadata } from "next";
import { Button } from "./components/button";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Home Page | GoodHive",
  description: "The Decentralized Freelancing Platform",
};

export default function Home() {
  return (
    <div>
      <div className=" [background:linear-gradient(180deg,_rgba(214,_194,_188,_0.74),_rgba(0,_0,_0,_0.74))]">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="relative justify-self-end order-first sm:row-span-2 sm:order-2">
            <Image
              alt="Bees"
              src="/img/bees.png"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto"
            />
          </div>
          <div className="bg-comb flex flex-col content-around">
            <div className="p-5 font-bold text-3xl">
              <h1> Lorem ipsum dolor sit amet, consectetur adipiscing elit</h1>
            </div>
            <div className="p-5 font-bold text-xl">
              <p> Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
            </div>
            <div className="p-5 flex flex-col lg:flex-row justify-around">
              <Button text="Find a Job" type="primary" size="large"></Button>
              <Button text="Find a Talent" type="primary" size="large"></Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white flex flex-col md:col-span-2 items-center justify-center">
        <div className=" text-4xl text-black p-10">
          <b className="">Lorem ipsum dolor sit amet consectetur</b>
        </div>
        <div className="text-2xl text-gray p-10">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod
          tempor
        </div>
      </div>
      <div>
        <Image
          alt="honeycomb-footer"
          src="/img/footer@3x.png"
          width="0"
          height="0"
          sizes="100vw"
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}
