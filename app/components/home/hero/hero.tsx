"use client";

import { Sparkles, Star, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { GoodhiveQuestLink } from "@/app/constants/common";

export const Hero = () => {
  const router = useRouter();

  const onFindJobBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push("/talents/job-search");
  };

  const onFindTalentBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push("/companies/search-talents");
  };

  const onJoinQuestsClickHandler = () => {
    window.open(GoodhiveQuestLink, "_blank");
  };

  return (
    <section className="relative min-h-[700px] w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Honeycomb Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="grid grid-cols-12 gap-4 transform rotate-12 scale-150 -translate-x-8 -translate-y-8">
            {Array.from({ length: 144 }, (_, i) => (
              <div
                key={i}
                className="w-8 h-8 border-2 border-amber-300 transform rotate-45"
              ></div>
            ))}
          </div>
        </div>

        {/* Animated Bee Swarm */}
        <div className="absolute top-1/4 left-1/4 w-12 h-12 opacity-80">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "0s", animationDuration: "3s" }}
          >
            <span className="text-4xl">🐝</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-full animate-ping opacity-20">
            <div className="w-full h-full bg-amber-400 rounded-full"></div>
          </div>
        </div>

        <div className="absolute top-1/3 right-1/3 w-10 h-10 opacity-70">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "1.5s", animationDuration: "4s" }}
          >
            <span className="text-3xl">🐝</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-full animate-ping opacity-15">
            <div className="w-full h-full bg-amber-400 rounded-full"></div>
          </div>
        </div>

        <div className="absolute bottom-1/4 left-1/2 w-8 h-8 opacity-60">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "3s", animationDuration: "5s" }}
          >
            <span className="text-2xl">🐝</span>
          </div>
        </div>

        {/* Floating Pollen Particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-40"></div>
        <div
          className="absolute top-32 right-32 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-30"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-32 left-32 w-1.5 h-1.5 bg-orange-300 rounded-full animate-ping opacity-25"
          style={{ animationDelay: "2.5s" }}
        ></div>
      </div>

      <div className="relative container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[700px]">
        {/* Decorative Bees and Swarm - Enhanced with Animations */}
        <div className="absolute left-4 top-12 w-[300px] h-[315px] sm:top-2.5 sm:left-0 sm:w-24 sm:h-24 md:left-0 md:w-44 md:h-44 lg:top-2.5 lg:left-12 lg:w-[250px] lg:h-[255px] xl:left-1 xl:top-4 z-10 opacity-90">
          <div
            className="group relative w-full h-full animate-bounce"
            style={{ animationDuration: "3s", animationDelay: "0.5s" }}
          >
            <Image
              alt="client bee"
              src="/img/client-bee.png"
              fill={true}
              className="drop-shadow-lg group-hover:scale-110 transition-transform duration-500 ease-out"
            />
            {/* Floating glow effect */}
            <div className="absolute inset-0 bg-amber-200 rounded-full opacity-0 group-hover:opacity-5 blur-3xl animate-pulse pointer-events-none"></div>
            {/* Bee trail effect */}
            <div
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-60"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>
        </div>

        <div className="absolute right-10 top-24 w-[350px] h-[236px] z-20 sm:top-3 sm:right-0 sm:w-[134px] sm:h-[91px] md:right-[-3px] md:top-12 md:w-48 md:h-[135px] lg:w-[250px] lg:h-[168px] xl:w-[250px] xl:h-[168px] opacity-90">
          <div
            className="group relative w-full h-full animate-bounce"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          >
            <Image
              alt="swarm"
              src="/img/swarm.png"
              fill={true}
              className="drop-shadow-lg group-hover:scale-105 group-hover:rotate-2 transition-all duration-700 ease-out"
            />
            {/* Swarm glow effect */}
            <div className="absolute inset-0 bg-orange-200 rounded-full opacity-0 group-hover:opacity-5 blur-3xl animate-pulse pointer-events-none"></div>
            {/* Multiple bee particles */}
            <div
              className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping opacity-50"
              style={{ animationDelay: "1.5s" }}
            ></div>
            <div
              className="absolute top-3/4 right-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-40"
              style={{ animationDelay: "3s" }}
            ></div>
          </div>
        </div>

        {/* Preserved Rectangular Honeycomb Frame */}
        <div className="absolute right-0 bottom-0 w-[400px] h-[494px] z-10 sm:top-[-75px] sm:right-[-20px] sm:w-[147px] sm:h-48 md:right[-10px] md:top-0 md:w-[180px] md:h-[221px] lg:top-0 lg:right-[-10px] lg:w-[250px] lg:h-[308px] xl:w-[250px] xl:h-[308px] xl:top-0 xl:right-[-10px] opacity-80">
          <Image
            alt="honeycomb"
            src="/img/polygons-frame.png"
            fill={true}
            className="drop-shadow-md"
          />
        </div>

        {/* Enhanced Logo with Hive Glow */}
        <div className="relative mb-8 group">
          <div className="h-20 w-80 relative z-10 sm:h-16 sm:w-64 md:h-18 md:w-72 group-hover:scale-105 transition-transform duration-1000">
            <Image
              alt="logo"
              src="/img/goodhive-logo.png"
              fill={true}
              className="drop-shadow-xl object-contain"
            />
          </div>
          {/* Logo enhancement particles */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4 bg-amber-400 rounded-full opacity-60 animate-bounce group-hover:animate-ping"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="absolute -top-1 -right-3 w-3 h-3 bg-yellow-400 rounded-full opacity-50 animate-bounce group-hover:animate-ping"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute -bottom-2 left-1/4 w-2 h-2 bg-orange-400 rounded-full opacity-40 animate-bounce group-hover:animate-ping"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        {/* Enhanced Title with Gradient */}
        <div className="text-center mb-6 z-20 relative">
          <div className="inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Buzzing with Innovation
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            <span className="text-gray-900">The Collaborative</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 animate-pulse">
              Recruitment Hive
            </span>
            <br />
            <span className="text-gray-900">for Web3 Devs</span>
          </h1>
          <h4 className="text-xl text-gray-700 font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
            More collaborative, more transparent and fairer than ever. <br />
            <span className="text-amber-600 font-semibold">
              Join the sweetest recruitment revolution! 🍯
            </span>
          </h4>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex gap-6 mb-12 z-20 relative sm:flex-col sm:gap-4 sm:w-full sm:max-w-xs">
          <button
            onClick={onFindJobBtnClick}
            className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center">
              <Star className="w-5 h-5 mr-2" />
              Find Sweet Jobs
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <button
            onClick={onFindTalentBtnClick}
            className="group px-8 py-4 bg-white text-amber-600 font-semibold rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <span className="flex items-center justify-center">
              <Zap className="w-5 h-5 mr-2" />
              Find Top Talent
            </span>
          </button>
        </div>

        {/* Enhanced Quest Section */}
        <div className="max-w-2xl flex flex-col items-center mb-12 z-20 relative">
          <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-amber-200">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Exclusive Hive Rewards
              </h3>
            </div>
            <p className="text-center text-gray-700 mb-6 leading-relaxed">
              Unlock exclusive referral rewards and gain governance power. Enjoy
              privileged access to
              <span className="font-semibold text-amber-600">
                {" "}
                Airdrops and Whitelists
              </span>
              , and become an esteemed holder of our{" "}
              <span className="font-semibold text-amber-600">
                Scout and Pioneer NFTs
              </span>
              .
            </p>
            <button
              onClick={onJoinQuestsClickHandler}
              className="group relative px-6 py-3 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden mx-auto block"
            >
              <span className="relative z-10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Join the Hive Quest
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

        {/* Bottom Decorative Elements */}
        <div className="absolute left-[-10px] bottom-[-162px] w-[300px] h-[397px] sm:w-[150px] sm:h-48 sm:left-[-19px] sm:bottom-[-47px] opacity-60">
          <Image
            alt="honeycomb-footer"
            src="/img/grey-polygons.png"
            fill={true}
          />
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-[-20px] left-0 w-full">
        <svg
          className="w-full h-16 fill-current text-amber-100"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
          ></path>
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
          ></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  );
};
