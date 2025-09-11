"use client";

import Cookies from "js-cookie";
import {
  ArrowRight,
  Building2,
  Crown,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";

import { TRANSLATION, allServices } from "./services.constants";

export const Services = () => {
  const router = useRouter();
  const { isAuthenticated, checkAuthAndShowConnectPrompt } = useAuthCheck();

  const onCtaClickHandler = (id: string) => {
    if (!isAuthenticated) {
      checkAuthAndShowConnectPrompt("access this feature");
      return;
    }

    if (id === "talent") {
      router.push("/talents/my-profile");
    } else if (id === "companies") {
      router.push("/companies/my-profile");
    }
  };

  const getButtonText = (id: string) => {
    if (!isAuthenticated) {
      return "Create your profile";
    }

    if (id === "talent") {
      return "Visit your talent profile";
    } else if (id === "companies") {
      return "Visit your company profile";
    }

    return "Create your profile";
  };

  return (
    <section className="relative w-full bg-gradient-to-br from-white via-amber-50 to-yellow-50 py-20 overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0">
        {/* Floating Hexagons */}
        <div className="absolute top-16 left-16 w-24 h-24 transform rotate-45">
          <div className="w-full h-full bg-gradient-to-br from-amber-200 to-yellow-300 rounded-lg opacity-10 animate-pulse"></div>
        </div>
        <div className="absolute bottom-20 right-20 w-32 h-32 transform -rotate-45">
          <div
            className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-300 rounded-lg opacity-10 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        {/* Animated Bees */}
        <div className="absolute top-1/4 right-1/4 w-8 h-8 opacity-60">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "0.5s", animationDuration: "4s" }}
          >
            <span className="text-2xl">🐝</span>
          </div>
        </div>
        <div className="absolute bottom-1/3 left-1/4 w-6 h-6 opacity-50">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "2s", animationDuration: "5s" }}
          >
            <span className="text-xl">🐝</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Crown className="w-4 h-4 mr-2" />
            Sweet Benefits
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-gray-900">Why Choose</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 mt-2">
              GoodHive
            </span>
          </h1>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            {TRANSLATION.description}
          </p>
        </div>

        {/* Enhanced Service Cards */}
        <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto">
          {allServices.map((service, index) => {
            const { id, title, description } = service;
            const isForTalent = id === "talent";
            const Icon = isForTalent ? Users : Building2;

            return (
              <div key={id} className="group relative">
                {/* Card Background with Gradient */}
                <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-amber-100 hover:border-amber-300">
                  {/* Decorative Top Border */}
                  <div
                    className={`h-2 bg-gradient-to-r ${
                      isForTalent
                        ? "from-amber-400 to-yellow-400"
                        : "from-orange-400 to-amber-400"
                    }`}
                  ></div>

                  {/* Card Content */}
                  <div className="p-8">
                    {/* Icon and Hexagon Background */}
                    <div className="relative mb-6">
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${
                          isForTalent
                            ? "from-amber-100 to-yellow-100"
                            : "from-orange-100 to-amber-100"
                        } flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon
                          className={`w-10 h-10 ${
                            isForTalent ? "text-amber-600" : "text-orange-600"
                          }`}
                        />
                      </div>

                      {/* Floating Elements */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full opacity-60 animate-pulse"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-amber-400 rounded-full opacity-40 animate-ping"></div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-amber-600 transition-colors duration-300">
                      {title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-700 mb-8 leading-relaxed text-base">
                      {description}
                    </p>

                    {/* Features List */}
                    <div className="mb-8 space-y-3">
                      {isForTalent ? (
                        <>
                          <div className="flex items-center text-sm text-gray-600">
                            <Star className="w-4 h-4 text-yellow-500 mr-2" />
                            <span>100% commission returned</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
                            <span>Co-own your platform</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Zap className="w-4 h-4 text-yellow-500 mr-2" />
                            <span>Earn as recruiter & mentor</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center text-sm text-gray-600">
                            <Star className="w-4 h-4 text-orange-500 mr-2" />
                            <span>Stake-backed recruiters</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Trophy className="w-4 h-4 text-orange-500 mr-2" />
                            <span>Community mentoring</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Zap className="w-4 h-4 text-orange-500 mr-2" />
                            <span>Excellence rewards</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => {
                        console.log(isAuthenticated, id, "hehe");
                        if (!isAuthenticated) {
                          checkAuthAndShowConnectPrompt("access this feature");
                          return;
                        }

                        if (id === "talent") {
                          return router.push("/talents/my-profile");
                        } else if (id === "companies") {
                          return router.push("/companies/my-profile");
                        }
                      }}
                      className={`group/btn relative w-full px-6 py-4 bg-gradient-to-r ${
                        isForTalent
                          ? "from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                          : "from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      } text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        <span>{getButtonText(id)}</span>
                        <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </span>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"></div>
                    </button>
                  </div>

                  {/* Decorative Corner Elements */}
                  <div
                    className="absolute top-4 right-4 w-8 h-8 opacity-10 pointer-events-none"
                    aria-hidden
                  >
                    <div
                      className={`w-full h-full bg-gradient-to-br ${
                        isForTalent
                          ? "from-amber-400 to-yellow-400"
                          : "from-orange-400 to-amber-400"
                      } transform rotate-45 rounded-sm`}
                    ></div>
                  </div>
                  <div
                    className="absolute bottom-4 left-4 w-6 h-6 opacity-10 pointer-events-none"
                    aria-hidden
                  >
                    <div
                      className={`w-full h-full bg-gradient-to-br ${
                        isForTalent
                          ? "from-yellow-400 to-amber-400"
                          : "from-amber-400 to-orange-400"
                      } transform rotate-45 rounded-sm`}
                    ></div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${
                      isForTalent
                        ? "from-amber-500/5 to-yellow-500/5"
                        : "from-orange-500/5 to-amber-500/5"
                    } opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none`}
                    aria-hidden
                  ></div>
                </div>

                {/* Floating Decoration */}
                <div
                  className={`absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br ${
                    isForTalent
                      ? "from-amber-200 to-yellow-300"
                      : "from-orange-200 to-amber-300"
                  } rounded-full opacity-20 animate-pulse group-hover:opacity-40 transition-opacity duration-300 pointer-events-none`}
                  aria-hidden
                >
                  <div className="absolute inset-2 bg-white rounded-full opacity-60"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-6 py-3 rounded-2xl border border-amber-200">
            <Sparkles className="w-5 h-5 mr-2" />
            <span className="font-semibold">
              Join the sweetest community in Web3! 🍯
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
