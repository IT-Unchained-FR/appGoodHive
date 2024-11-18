import React from "react";

interface GoodHiveSpinnerProps {
  size?: "small" | "default" | "large";
  className?: string;
  style?: React.CSSProperties;
}

export default function GoodHiveSpinner({
  size = "default",
  className = "",
  style = {},
}: GoodHiveSpinnerProps) {
  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-12 h-12",
    large: "w-16 h-16",
  };

  const innerSizeClasses = {
    small: "w-6 h-6",
    default: "w-10 h-10",
    large: "w-14 h-14",
  };

  const svgSizeClasses = {
    small: "w-4 h-4",
    default: "w-6 h-6",
    large: "w-8 h-8",
  };

  return (
    <div
      className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}
      style={{
        height: "calc(100vh - 112px)",
        width: "100%",
        ...style,
      }}
    >
      <div
        className={`absolute rounded-full bg-amber-300 opacity-70 ${sizeClasses[size]} animate-ping`}
      ></div>
      <div
        className={`absolute rounded-full bg-amber-400 ${innerSizeClasses[size]} animate-pulse`}
      ></div>
      <svg
        className={`relative ${svgSizeClasses[size]} animate-spin text-amber-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M13.1747 3.07702C11.01 2.79202 8.81537 3.30372 6.99988 4.51679C5.18439 5.72987 3.8718 7.56158 3.30668 9.67065C2.74155 11.7797 2.96243 14.0223 3.92815 15.9806C4.89388 17.9389 6.53859 19.4794 8.55586 20.3149C10.5731 21.1505 12.8254 21.2242 14.893 20.5224C16.9606 19.8205 18.7025 18.3805 19.7942 16.5L21.6453 17.5C20.3247 19.8196 18.1858 21.6133 15.6022 22.4729C13.0186 23.3324 10.1913 23.2413 7.66771 22.2143C5.1441 21.1873 3.12012 19.2933 1.95903 16.8874C0.797946 14.4815 0.569371 11.7286 1.31941 9.15761C2.06945 6.58659 3.74001 4.36748 5.98823 2.90307C8.23644 1.43865 10.9053 0.820312 13.5541 1.17312C16.2028 1.52593 18.6089 2.82136 20.3602 4.80419C22.1115 6.78703 23.1065 9.32319 23.1946 11.9992L21.1953 12.0008C21.1199 9.71598 20.2684 7.52574 18.7458 5.83609C17.2232 4.14644 15.1421 3.0861 13.1747 3.07702Z"
        />
      </svg>
    </div>
  );
}
