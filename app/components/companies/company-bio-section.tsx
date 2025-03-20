"use client";

import React, { useState } from "react";

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
    <div className="w-full mb-4 rich-text-content h-full">
      <div className="w-full mb-2 text-ellipsis">
        <div dangerouslySetInnerHTML={{ __html: displayHtml }} />
        {shouldTruncate && (
          <button
            onClick={handleToggle}
            className="text-yellow-400 text-md font-medium ml-1"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        )}
      </div>
    </div>
  );
};
