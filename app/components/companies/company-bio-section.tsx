"use client";

import React, { useState } from "react";

interface TruncatedBioProps {
  text: string;
  maxLength?: number;
}

export const CompanyBio: React.FC<TruncatedBioProps> = ({
  text,
  maxLength = 200,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = text?.length > maxLength;
  const displayText = isExpanded
    ? text
    : text?.slice(0, maxLength) + (shouldTruncate ? "..." : "");

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full mb-4">
      <p className="w-full  mb-2 text-ellipsis">
        {displayText}
        {shouldTruncate && (
          <button
            onClick={handleToggle}
            className="text-yellow-400  text-md font-medium ml-1"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        )}
      </p>
    </div>
  );
};
