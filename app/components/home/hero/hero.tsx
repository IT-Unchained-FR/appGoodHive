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

      {/* Left Side Hexagon Cluster */}
      <div className="absolute left-0 top-1/3 -translate-x-1/2 hidden lg:block">
        <svg className="w-96 h-96 opacity-[0.08]" viewBox="0 0 400 400">
          {/* Main large hexagon */}
          <polygon 
            points="200,50 270,85 270,155 200,190 130,155 130,85" 
            fill="none" 
            stroke="#d97706" 
            strokeWidth="2"
          />
          {/* Medium hexagon - top left */}
          <polygon 
            points="120,120 155,138 155,174 120,192 85,174 85,138" 
            fill="#fbbf24" 
            fillOpacity="0.15"
            stroke="#f59e0b" 
            strokeWidth="1.5"
          />
          {/* Medium hexagon - bottom right */}
          <polygon 
            points="280,200 315,218 315,254 280,272 245,254 245,218" 
            fill="none" 
            stroke="#fcd34d" 
            strokeWidth="1.8"
          />
          {/* Small accent hexagons */}
          <polygon 
            points="160,280 180,290 180,310 160,320 140,310 140,290" 
            fill="#f59e0b" 
            fillOpacity="0.12"
          />
          <polygon 
            points="320,100 335,108 335,124 320,132 305,124 305,108" 
            fill="none" 
            stroke="#d97706" 
            strokeWidth="1"
          />
          {/* Tiny details */}
          <polygon 
            points="90,320 100,325 100,335 90,340 80,335 80,325" 
            fill="#fcd34d" 
            fillOpacity="0.2"
          />
        </svg>
      </div>

      {/* Right Side Hexagon Cluster */}
      <div className="absolute right-0 top-1/2 translate-x-1/2 hidden lg:block">
        <svg className="w-80 h-80 opacity-[0.08]" viewBox="0 0 350 350">
          {/* Main central hexagon */}
          <polygon 
            points="175,40 230,70 230,130 175,160 120,130 120,70" 
            fill="#fbbf24" 
            fillOpacity="0.1"
            stroke="#d97706" 
            strokeWidth="2"
          />
          {/* Medium hexagon - top right */}
          <polygon 
            points="270,90 300,106 300,138 270,154 240,138 240,106" 
            fill="none" 
            stroke="#f59e0b" 
            strokeWidth="1.5"
          />
          {/* Medium hexagon - bottom left */}
          <polygon 
            points="80,170 110,186 110,218 80,234 50,218 50,186" 
            fill="none" 
            stroke="#fcd34d" 
            strokeWidth="1.8"
          />
          {/* Small hexagons */}
          <polygon 
            points="200,220 225,233 225,259 200,272 175,259 175,233" 
            fill="#f59e0b" 
            fillOpacity="0.08"
            stroke="#d97706" 
            strokeWidth="1"
          />
          <polygon 
            points="310,200 325,208 325,224 310,232 295,224 295,208" 
            fill="none" 
            stroke="#fbbf24" 
            strokeWidth="1.2"
          />
          {/* Tiny accent */}
          <polygon 
            points="120,280 130,285 130,295 120,300 110,295 110,285" 
            fill="#fcd34d" 
            fillOpacity="0.15"
          />
        </svg>
      </div>

      {/* Additional scattered hexagons for depth */}
      <div className="absolute inset-0 hidden lg:block">
        {/* Top center small hexagon */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 opacity-[0.08]">
          <svg width="30" height="30" viewBox="0 0 30 30">
            <polygon 
              points="15,3 24,7.5 24,16.5 15,21 6,16.5 6,7.5" 
              fill="none" 
              stroke="#f59e0b" 
              strokeWidth="1"
            />
          </svg>
        </div>
        
        {/* Bottom left hexagon */}
        <div className="absolute bottom-20 left-20 opacity-[0.1]">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <polygon 
              points="20,4 32,10 32,22 20,28 8,22 8,10" 
              fill="#fbbf24" 
              fillOpacity="0.3"
              stroke="#d97706" 
              strokeWidth="0.8"
            />
          </svg>
        </div>
        
        {/* Bottom right small hexagon */}
        <div className="absolute bottom-32 right-24 opacity-[0.06]">
          <svg width="25" height="25" viewBox="0 0 25 25">
            <polygon 
              points="12.5,2 20,5.5 20,12.5 12.5,16 5,12.5 5,5.5" 
              fill="none" 
              stroke="#fcd34d" 
              strokeWidth="1"
            />
          </svg>
        </div>
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
