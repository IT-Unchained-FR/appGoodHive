import { SearchFilters } from "@/app/components/search-filters";
import React from "react";

export default function JobSearchLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/40 to-yellow-50/30">
      <main className="container mx-auto">
        <SearchFilters />

        {children}
      </main>
    </div>
  );
}
