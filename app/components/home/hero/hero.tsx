"use client";

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
    <section className="relative min-h-[700px] w-full overflow-hidden">
      {/* Minimalist Background with Subtle Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(at 40% 20%, hsla(45, 100%, 74%, 0.08) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(35, 100%, 70%, 0.06) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(50, 100%, 80%, 0.04) 0px, transparent 50%),
            linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)
          `
        }}
      />
      
      {/* Subtle Honeycomb Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(30deg, #d97706 12%, transparent 12.5%, transparent 87%, #d97706 87.5%, #d97706),
            linear-gradient(150deg, #d97706 12%, transparent 12.5%, transparent 87%, #d97706 87.5%, #d97706),
            linear-gradient(30deg, #d97706 12%, transparent 12.5%, transparent 87%, #d97706 87.5%, #d97706),
            linear-gradient(150deg, #d97706 12%, transparent 12.5%, transparent 87%, #d97706 87.5%, #d97706),
            linear-gradient(60deg, #dc2626 25%, transparent 25.5%, transparent 75%, #dc2626 75%, #dc2626),
            linear-gradient(60deg, #dc2626 25%, transparent 25.5%, transparent 75%, #dc2626 75%, #dc2626)
          `,
          backgroundSize: '40px 70px',
          backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px'
        }}
      />

      {/* Left Side Deconstructed Hexagon Cluster */}
      <div className="absolute left-0 top-1/4 -translate-x-1/2 hidden lg:block">
        <svg className="w-48 h-96 opacity-[0.04]" viewBox="0 0 200 400">
          {/* Large hexagon */}
          <polygon 
            points="100,20 150,50 150,110 100,140 50,110 50,50" 
            fill="none" 
            stroke="#d97706" 
            strokeWidth="1"
            transform="rotate(-15 100 80)"
          />
          {/* Medium hexagon - filled */}
          <polygon 
            points="80,180 120,200 120,240 80,260 40,240 40,200" 
            fill="#fbbf24" 
            fillOpacity="0.3"
            stroke="#d97706" 
            strokeWidth="0.5"
          />
          {/* Small hexagon - offset */}
          <polygon 
            points="120,280 145,295 145,325 120,340 95,325 95,295" 
            fill="none" 
            stroke="#f59e0b" 
            strokeWidth="0.8"
            transform="rotate(30 120 310)"
          />
          {/* Tiny accent hexagon */}
          <polygon 
            points="60,120 75,128 75,142 60,150 45,142 45,128" 
            fill="#fcd34d" 
            fillOpacity="0.4"
          />
        </svg>
      </div>

      {/* Right Side Deconstructed Hexagon Cluster */}
      <div className="absolute right-0 top-1/3 translate-x-1/2 hidden lg:block">
        <svg className="w-48 h-96 opacity-[0.04]" viewBox="0 0 200 400">
          {/* Medium hexagon - top */}
          <polygon 
            points="100,40 140,60 140,100 100,120 60,100 60,60" 
            fill="none" 
            stroke="#f59e0b" 
            strokeWidth="0.7"
            transform="rotate(20 100 80)"
          />
          {/* Large hexagon - middle filled */}
          <polygon 
            points="90,150 150,185 150,255 90,290 30,255 30,185" 
            fill="#fbbf24" 
            fillOpacity="0.25"
            stroke="#d97706" 
            strokeWidth="0.5"
          />
          {/* Small hexagon - bottom */}
          <polygon 
            points="70,320 95,335 95,365 70,380 45,365 45,335" 
            fill="none" 
            stroke="#d97706" 
            strokeWidth="1"
            transform="rotate(-25 70 350)"
          />
          {/* Tiny filled hexagon */}
          <polygon 
            points="140,240 155,248 155,262 140,270 125,262 125,248" 
            fill="#f59e0b" 
            fillOpacity="0.5"
          />
          {/* Extra small accent */}
          <polygon 
            points="50,100 60,106 60,118 50,124 40,118 40,106" 
            fill="none" 
            stroke="#fcd34d" 
            strokeWidth="0.6"
          />
        </svg>
      </div>

      <div className="relative container mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[700px]">

        {/* Clean Logo */}
        <div className="relative mb-10">
          <div className="h-20 w-80 relative z-10 sm:h-16 sm:w-64 md:h-18 md:w-72">
            <Image
              alt="logo"
              src="/img/goodhive-logo.png"
              fill={true}
              className="object-contain"
            />
          </div>
        </div>

        {/* Typography-First Title */}
        <div className="text-center mb-8 z-20 relative">
          <div className="inline-flex items-center bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-amber-200">
            <span className="mr-2">✦</span>
            Buzzing with Innovation
          </div>
          <h1 className="text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-gray-900">The Collaborative</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600">
              Recruitment Hive
            </span>
            <br />
            <span className="text-gray-900">for Web3 Devs</span>
          </h1>
          <p className="text-lg text-gray-600 font-normal max-w-xl mx-auto">
            More collaborative, more transparent and fairer than ever.
            <br />
            <span className="text-amber-600 font-medium">
              Join the sweetest recruitment revolution
            </span>
          </p>
        </div>

        {/* Simplified Action Buttons */}
        <div className="flex gap-4 mb-16 z-20 relative sm:flex-col sm:gap-3 sm:w-full sm:max-w-xs">
          <button
            onClick={onFindJobBtnClick}
            className="px-8 py-3.5 bg-amber-600 text-white font-medium rounded-xl shadow-sm hover:bg-amber-700 transition-colors duration-200"
          >
            Find Sweet Jobs
          </button>

          <button
            onClick={onFindTalentBtnClick}
            className="px-8 py-3.5 bg-white text-gray-900 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          >
            Find Top Talent
          </button>
        </div>

        {/* Simplified Rewards Section */}
        <div className="max-w-2xl flex flex-col items-center z-20 relative">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Exclusive Hive Rewards
              </h3>
            </div>
            <p className="text-center text-gray-600 mb-6 text-sm leading-relaxed">
              Unlock exclusive referral rewards and gain governance power. Enjoy
              privileged access to
              <span className="font-medium text-amber-600">
                {" "}
                Airdrops and Whitelists
              </span>
              , and become an esteemed holder of our{" "}
              <span className="font-medium text-amber-600">
                Scout and Pioneer NFTs
              </span>
              .
            </p>
            <button
              onClick={onJoinQuestsClickHandler}
              className="px-5 py-2.5 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 transition-colors duration-200 mx-auto block text-sm"
            >
              Join the Hive Quest
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
