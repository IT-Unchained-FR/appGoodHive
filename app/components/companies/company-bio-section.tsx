"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import "react-quill/dist/quill.snow.css";
import "@/app/styles/rich-text.css";

interface TruncatedBioProps {
  text: string;
  maxLength?: number;
}

export const CompanyBio: React.FC<TruncatedBioProps> = ({
  text,
  maxLength = 200,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Remove HTML tags for length calculation
  const plainText = text?.replace(/<[^>]*>/g, "") || "";
  const shouldTruncate = plainText?.length > maxLength;

  // This is a simplistic approach to truncating HTML - a better solution would parse the HTML properly
  let displayHtml = text;
  if (!isExpanded && shouldTruncate) {
    const truncateIndex =
      text.indexOf(plainText.substring(maxLength, maxLength + 20)) || maxLength;
    displayHtml = text.substring(0, truncateIndex) + "...";
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`w-full rich-text-content transition-all duration-500 ${isVisible ? 'animate-slide-in-up' : 'opacity-0'}`}>
      {/* Enhanced Bio Container */}
      <div className="relative bg-gradient-to-br from-amber-50/50 to-yellow-50/50 rounded-2xl p-6 border border-amber-100 hover:border-amber-200 transition-all duration-300 group">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="honeycomb-pattern w-full h-full rounded-2xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Bio Text */}
          <div 
            className={`prose prose-gray max-w-none leading-relaxed text-gray-700 transition-all duration-300 ${
              isExpanded ? '' : 'line-clamp-4'
            }`}
            dangerouslySetInnerHTML={{ __html: displayHtml }} 
          />
          
          {/* Enhanced Show More/Less Button */}
          {shouldTruncate && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleToggle}
                className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 text-amber-700 font-semibold rounded-full border border-amber-200 hover:border-amber-300 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md"
              >
                <span className="text-sm">
                  {isExpanded ? "Show Less" : "Read More"}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 group-hover/btn:animate-bounce" />
                ) : (
                  <ChevronDown className="w-4 h-4 group-hover/btn:animate-bounce" />
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
          <div className="w-6 h-6 animate-float-slow">
            <span className="text-lg">🐝</span>
          </div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-30 transition-opacity duration-500">
          <div className="bee-particle animate-float"></div>
        </div>
        
        {/* Gradient hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/10 to-yellow-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
      </div>
      
      {/* Quote-style indicator */}
      {text && (
        <div className="flex items-center justify-center mt-4 opacity-60">
          <div className="flex items-center gap-2 text-amber-600">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium tracking-wider uppercase">Company Story</span>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
};
