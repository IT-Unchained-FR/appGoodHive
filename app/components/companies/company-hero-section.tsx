"use client";

import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { Sparkles, MapPin, Users, Briefcase } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface CompanyHeroSectionProps {
  companyName: string;
  city: string;
  country: string;
  imageUrl?: string;
  headline?: string;
  jobCount?: number;
  isVerified?: boolean;
}

export const CompanyHeroSection = ({
  companyName,
  city,
  country,
  imageUrl,
  headline,
  jobCount = 0,
  isVerified = false,
}: CompanyHeroSectionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-[400px] w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Enhanced Honeycomb Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <pattern
                id="honeycomb-hero"
                x="0"
                y="0"
                width="20"
                height="17.32"
                patternUnits="userSpaceOnUse"
                className="animate-hexagon-spin"
              >
                <polygon
                  points="10,0 20,5.77 20,11.55 10,17.32 0,11.55 0,5.77"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-amber-400"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#honeycomb-hero)" />
          </svg>
        </div>

        {/* Floating Bee Particles */}
        <div className="absolute top-1/4 left-1/6">
          <div className="bee-particle animate-float delay-100"></div>
        </div>
        <div className="absolute top-1/3 right-1/4">
          <div className="bee-particle animate-float-slow delay-300"></div>
        </div>
        <div className="absolute bottom-1/3 left-1/3">
          <div className="bee-particle animate-float delay-500"></div>
        </div>

        {/* Animated Bees */}
        <div className="absolute top-20 left-20 opacity-60">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "0s", animationDuration: "3s" }}
          >
            <span className="text-3xl">🐝</span>
          </div>
        </div>

        <div className="absolute top-32 right-32 opacity-50">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "1.5s", animationDuration: "4s" }}
          >
            <span className="text-2xl">🐝</span>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20"></div>
      </div>

      {/* Hero Content */}
      <div className="relative container mx-auto px-6 py-16 flex flex-col lg:flex-row items-center justify-between min-h-[400px]">
        {/* Company Information */}
        <div className="flex-1 text-center lg:text-left mb-8 lg:mb-0">
          {/* Company Logo and Name */}
          <div
            className={`flex flex-col lg:flex-row items-center lg:items-start mb-6 ${
              isVisible ? "animate-slide-in-left" : "opacity-0"
            }`}
          >
            <div className="relative mb-4 lg:mb-0 lg:mr-6 group">
              <div
                className="relative h-24 w-24 lg:h-32 lg:w-32 flex items-center justify-center cursor-pointer bg-gradient-to-br from-yellow-100 to-amber-100 border-4 border-white shadow-xl hover-glow"
                style={{
                  clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                }}
              >
                <Image
                  className="object-cover"
                  src={imageUrl || "/img/placeholder-image.png"}
                  alt={`${companyName} logo`}
                  fill
                />
              </div>
              {/* Verification Badge */}
              {isVerified && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              {/* Decorative bee icon */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#FFC905] rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-float">
                <span className="text-sm">🐝</span>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {companyName}
              </h1>
              
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-200/60 shadow-sm">
                  <div className="relative w-4 h-3 rounded-sm overflow-hidden shadow-sm border border-gray-200">
                    <Image
                      src={generateCountryFlag(country) as string}
                      alt={`${country} flag`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {country}
                  </span>
                </div>
                <MapPin className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600 text-lg">
                  {city}
                </span>
              </div>

              
            </div>
          </div>

          {/* Quick Stats */}
          <div
            className={`flex items-center justify-center lg:justify-start gap-6 ${
              isVisible ? "animate-slide-in-left delay-200" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
              <Briefcase className="w-4 h-4 text-[#FFC905]" />
              <span className="text-sm font-semibold text-gray-700">
                {jobCount} Active {jobCount === 1 ? 'Job' : 'Jobs'}
              </span>
            </div>
            
            {isVerified && (
              <div className="flex items-center gap-2 bg-green-100/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="flex-1 relative hidden lg:flex justify-center items-center">
          {/* Large Animated Bee */}
          <div
            className={`relative w-64 h-64 ${
              isVisible ? "animate-scale-in-center delay-400" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="relative w-full h-full animate-float-slow">
              <Image
                alt="Company mascot bee"
                src="/img/client-bee.png"
                fill={true}
                className="drop-shadow-2xl"
              />
            </div>
            {/* Floating particles around the bee */}
            <div className="absolute top-1/4 left-1/4 bee-particle animate-bee-trail delay-100"></div>
            <div className="absolute top-3/4 right-1/4 bee-particle animate-bee-trail delay-300"></div>
            <div className="absolute top-1/2 right-1/6 bee-particle animate-bee-trail delay-500"></div>
          </div>
        </div>
      </div>

      {/* Bottom Decorative Wave */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg
          className="w-full h-12 fill-current text-white"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  );
};