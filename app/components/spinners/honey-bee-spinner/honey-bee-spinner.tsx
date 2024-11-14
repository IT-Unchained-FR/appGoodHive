"use client";

import React from "react";
import "./honey-bee-spinner.css";

interface HoneybeeSpinnerProps {
  message?: string;
}
export const HoneybeeSpinner: React.FC<HoneybeeSpinnerProps> = ({
  message,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center relative overflow-hidden"
      style={{ minHeight: "calc(100vh - 56px)" }}
    >
      {/* Honeycomb background */}
      <div className="absolute inset-0 grid grid-cols-6 gap-2 honeycomb-bg">
        {[...Array(60)].map((_, i) => (
          <div key={i} className="rounded-full aspect-square"></div>
        ))}
      </div>

      {/* Bee */}
      <div className="relative z-10 mb-8">
        <div className="w-24 h-24 bee-body rounded-full relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bee-stripe rounded-full"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bee-body rounded-full"></div>
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white rounded-full"></div>
          <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-white rounded-full"></div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bee-stripe rounded-full"></div>
        </div>
        <div className="absolute top-1/2 -left-4 w-8 h-1 bee-wing rounded-full animate-wing origin-right"></div>
        <div className="absolute top-1/2 -right-4 w-8 h-1 bee-wing rounded-full animate-wing origin-left"></div>
      </div>

      {/* Loading text */}
      <h2 className="text-2xl font-bold text-amber-800 mb-4 relative z-10">
        {message ?? "Loading..."}
      </h2>

      {/* Animated progress bar */}
      <div className="w-64 h-4 loading-bar-bg rounded-full overflow-hidden relative z-10">
        <div className="h-full w-1/3 loading-bar rounded-full absolute left-0 animate-loading-bar"></div>
      </div>

      {/* Honey drip animation */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-16 honey-drip animate-drip"></div> */}
    </div>
  );
};
