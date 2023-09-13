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
        <div className=" grid grid-cols-1 3xl:grid-cols-2">
          <div className="p-5">
            <Image alt="Bees" src="/img/bees.png" fill={true} />
          </div>
          <div className="3xl:row-span-2">
            <Image alt="GoodHive" src="/img/frame-29358@2x.png" fill={true} />
          </div>

          {/*  <div className="absolute object-cover absolute mix-blend-overlay">
              <img alt="" src="../frame-29370.svg" />
            </div> */}
          <div className="bg-comb flex flex-col justify-evenly">
            <div className="font-bold text-3xl p-5 ">
              <h1> Lorem ipsum dolor sit amet, consectetur adipiscing elit</h1>
            </div>
            <div className="font-bold text-xl p-5">
              <p> Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
            </div>
            <div className="p-5 flex flex-row justify-around">
              <Button text="Find a Job" type="primary" size="large"></Button>
              <Button text="Find a Talent" type="primary" size="large"></Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white flex flex-col h-[295px] items-center justify-center">
        <div className=" text-4xl text-black p-10">
          <b className="">Lorem ipsum dolor sit amet consectetur</b>
        </div>
        <div className="text-2xl text-gray p-10">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod
          tempor
        </div>
      </div>
      <div>
        <div className="flex">
          <img alt="" src="../footer@3x.png" />
        </div>
      </div>
    </div>
  );

  /*  <main className="mx-5">
      <div className="flex flex-col">
        <h1 className="p-5 mt-5 text-4xl font-bold text-center">
          The Decentralized Freelancing Platform
        </h1>
        <section className="mt-5">
          <h2 className="text-2xl">Our Services</h2>
          <ul className="pl-5 list-disc">
            <li>Connect with global talents</li>
            <li>Secure and trustless payment system</li>
            <li>Full control over your contracts</li>
          </ul>
        </section>
      </div>
    </main>
  ); */
}
