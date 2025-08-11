"use client";

import React, { useState } from "react";
import { MessagePopup } from "@components/message-popup";
import { TRANSLATION } from "./reach-us.constants";

export const ReachUs = () => {
  const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);

  const onContactUsClick = () => {
    window.open(
      "https://calendly.com/benoit-kulesza/virtual-coffe-10-mins",
      "_blank"
    );
  };

  const onMessageUsClick = () => {
    setIsMessagePopupOpen(true);
  };

  return (
    <>
      <section className="relative w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0">
          {/* Honeycomb Pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="grid grid-cols-12 gap-4 transform rotate-12 scale-150 -translate-x-8 -translate-y-8">
              {Array.from({ length: 144 }, (_, i) => (
                <div key={i} className="w-8 h-8 border-2 border-amber-300 transform rotate-45"></div>
              ))}
            </div>
          </div>
          
          {/* Floating Bees */}
          <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
            🐝
          </div>
          <div className="absolute top-1/3 right-1/4 text-3xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
            🐝
          </div>
          <div className="absolute bottom-1/4 left-1/3 text-2xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}>
            🐝
          </div>
          
          {/* Hexagon Shapes */}
          <div className="absolute top-16 right-16 w-24 h-24 transform rotate-45">
            <div className="w-full h-full bg-gradient-to-br from-amber-200 to-yellow-300 rounded-lg opacity-20 animate-pulse"></div>
          </div>
          <div className="absolute bottom-16 left-16 w-32 h-32 transform -rotate-45">
            <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-300 rounded-lg opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        <div className="relative container mx-auto px-6 py-20 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <span className="mr-2">🍯</span>
                  Sweet Communication
                </div>
                
                {/* Title */}
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Let's Create Some
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">
                    Honey Magic
                  </span>
                  Together! 🐝
                </h2>
                
                {/* Description */}
                <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  {TRANSLATION.description}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-amber-600 mb-1">24h</div>
                    <div className="text-sm text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-amber-600 mb-1">100%</div>
                    <div className="text-sm text-gray-600">Sweet Support</div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    type="button"
                    onClick={onMessageUsClick}
                    className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <span className="mr-2">💌</span>
                      Send us a Sweet Message
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={onContactUsClick}
                    className="group px-8 py-4 bg-white text-amber-600 font-semibold rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <span className="flex items-center justify-center">
                      <span className="mr-2">📞</span>
                      Book a Hive Call
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Visual */}
              <div className="relative">
                <div className="relative z-10 max-w-md mx-auto lg:max-w-none">
                  {/* Main Hive Structure */}
                  <div className="relative bg-gradient-to-br from-amber-300 to-yellow-400 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6">
                      {/* Honeycomb Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {Array.from({ length: 9 }, (_, i) => (
                          <div key={i} className={`aspect-square bg-white bg-opacity-30 rounded-lg flex items-center justify-center text-2xl ${
                            i === 4 ? 'bg-opacity-60 scale-110' : ''
                          } transition-all duration-300`}>
                            {i === 4 ? '🍯' : i % 3 === 0 ? '🐝' : '⬢'}
                          </div>
                        ))}
                      </div>
                      
                      {/* Message Preview */}
                      <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-amber-500 rounded-full mr-2 flex items-center justify-center text-xs">
                            💌
                          </div>
                          <span className="text-sm font-medium text-amber-800">Your message here</span>
                        </div>
                        <div className="h-2 bg-amber-200 rounded-full mb-2"></div>
                        <div className="h-2 bg-amber-200 rounded-full w-3/4"></div>
                      </div>
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white bg-opacity-30 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl animate-bounce">
                      🌻
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white bg-opacity-30 backdrop-blur-sm rounded-full flex items-center justify-center text-xl animate-pulse">
                      🍯
                    </div>
                  </div>
                </div>
                
                {/* Background Decoration */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-8 left-8 w-32 h-32 bg-gradient-to-br from-amber-200 to-yellow-300 rounded-full opacity-20 blur-xl"></div>
                  <div className="absolute bottom-8 right-8 w-24 h-24 bg-gradient-to-br from-orange-200 to-amber-300 rounded-full opacity-20 blur-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg className="w-full h-16 fill-current text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </section>

      {/* Message Popup */}
      <MessagePopup
        isOpen={isMessagePopupOpen}
        onClose={() => setIsMessagePopupOpen(false)}
      />
    </>
  );
};
