"use client";

import React from "react";

interface OptimizedJobBalanceProps {
  jobId?: number;
  blockId?: number;
  currency?: string;
  className?: string;
}

export const OptimizedJobBalance: React.FC<OptimizedJobBalanceProps> = ({
  jobId,
  blockId,
  currency = "",
  className = "",
}) => {
  // Stub component - will be replaced with Thirdweb integration
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFC905]/15 to-amber-200/60 border border-[#FFC905]/30 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm">
        <div className="w-1.5 h-1.5 bg-[#FFC905] rounded-full"></div>
        <span className="text-xs font-medium text-[#FFC905]">
          Balance loading...
        </span>
      </div>
    </div>
  );
};

export default OptimizedJobBalance;