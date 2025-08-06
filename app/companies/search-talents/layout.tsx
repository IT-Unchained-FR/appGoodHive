import { SearchFilters } from "@/app/components/search-filters";
import React from "react";

export default function SearchTalentsLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <main className="">
      <SearchFilters isSearchTalent />
      {children}
    </main>
  );
}
