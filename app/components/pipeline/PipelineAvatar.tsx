"use client";

import { useState } from "react";

interface PipelineAvatarProps {
  src: string | null;
  name: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-2xl",
};

export function PipelineAvatar({ src, name, size = "sm" }: PipelineAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.[0]?.toUpperCase() ?? "T";
  const sizeClass = SIZE_CLASSES[size];

  if (src && !imgError) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0`}>
        <img
          src={src}
          alt={name ?? ""}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold flex-shrink-0`}
    >
      {initial}
    </div>
  );
}
