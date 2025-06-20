import { SearchFilters } from "@/app/components/search-filters";
import React from "react";

export default function JobSearchLayout({ children }: React.PropsWithChildren) {
  return (
    <main className="w-full">
      <SearchFilters />

      {children}
    </main>
  );
}
