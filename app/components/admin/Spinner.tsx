"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Spinner({ size = "md", color = "#FFC905" }: SpinnerProps) {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeMap[size]} animate-spin`}
        style={{
          borderRadius: "50%",
          border: `2px solid ${color}`,
          borderTopColor: "transparent",
        }}
      />
    </div>
  );
}
