"use client";

import { Play, X } from "lucide-react";
import { useState } from "react";
import Modal from "../modal";

interface OnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  videoUrl?: string;
  title?: string;
  description?: string;
}

const OnboardingPopup = ({
  isOpen,
  onClose,
  onContinue,
  videoUrl = "https://www.youtube.com/watch?v=4ep_oZ0khzo",
  title = "Welcome to GoodHive!",
  description = "Watch this quick video to learn how to use our platform effectively.",
}: OnboardingPopupProps) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
        {/* Close Button - Floating */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-gray-800 bg-opacity-10 hover:bg-opacity-20 transition-all duration-200 backdrop-blur-md group"
          aria-label="Close popup"
        >
          <X className="w-5 h-5 text-gray-700 group-hover:text-gray-900" />
        </button>

        {/* Header Section */}
        <div className="relative px-8 py-8 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-b border-amber-100">
          {/* Decorative elements */}
          <div className="absolute top-4 left-8 w-20 h-20 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-4 right-8 w-16 h-16 bg-gradient-to-br from-orange-200 to-yellow-300 rounded-full opacity-30 blur-lg"></div>

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              {title}
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-600 leading-relaxed">
              {description}
            </p>

            {/* Progress indicator */}
            <div className="flex items-center justify-center mt-6 space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <div className="w-8 h-1 bg-amber-200 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative bg-gray-900">
          <div className="aspect-video w-full relative">
            {!isVideoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  {/* Loading animation */}
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-amber-400 ml-1" />
                    </div>
                  </div>
                  <p className="text-white text-lg font-medium">
                    Loading your onboarding video...
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    This will just take a moment
                  </p>
                </div>
              </div>
            )}
            <iframe
              src={embedUrl}
              title="Onboarding Video"
              className="w-full h-full rounded-none"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsVideoLoaded(true)}
            />
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-8 py-8 bg-white">
          <div className="max-w-4xl mx-auto">
            {/* Info Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Take a few seconds to learn the basics
              </div>
              <p className="text-gray-600 max-w-lg mx-auto">
                This introduction will help you understand how to make the most
                of GoodHive's features and start building your professional
                network.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3.5 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 min-w-[160px]"
              >
                Skip for now
              </button>
              <button
                onClick={onContinue}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 min-w-[160px] relative overflow-hidden group"
              >
                <span className="relative z-10">Continue to Profile</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            </div>

            {/* Note */}
            <p className="text-center text-xs text-gray-500 mt-6">
              You can always access this video later from your dashboard
              settings
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingPopup;
