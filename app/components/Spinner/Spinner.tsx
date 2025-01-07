import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2
        className={`animate-spin text-gray-600 dark:text-gray-400 ${sizeMap[size]} ${className}`}
      />
    </div>
  );
}
