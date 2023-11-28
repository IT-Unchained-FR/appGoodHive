import React from "react";
import { SearchFilters } from "@/app/components/search-filters";

export default function SearchTalentsLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <main className="container mx-auto">
      <SearchFilters isSearchTalent />

      {children}
    </main>
  );
}
