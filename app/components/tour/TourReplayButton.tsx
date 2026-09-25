"use client";

import { Compass } from "lucide-react";

interface TourReplayButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function TourReplayButton({
  onClick,
  label = "How it works",
  className = "",
}: TourReplayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 ${className}`}
    >
      <Compass className="h-4 w-4" />
      {label}
    </button>
  );
}
