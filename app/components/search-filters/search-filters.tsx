"use client";

import { Input } from "@/app/components/input";
import { LinkButton } from "@/app/components/link-button";
import addIcon from "@/public/icons/add.svg";
import searchIcon from "@/public/icons/search.svg";
import { useRouter, useSearchParams } from "next/navigation";
import React, { FC, useState } from "react";
import { CitySuggestion } from "../city-suggestor/city-suggestor";
import { InputClasses, TRANSLATIONS } from "./search-filters.constants";
import type { SearchFiltersProps } from "./search-filters.types";

export const SearchFilters: FC<SearchFiltersProps> = (props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  const { isSearchTalent = false } = props;

  const title = isSearchTalent
    ? TRANSLATIONS.talentSearchTitle
    : TRANSLATIONS.jobSearchTitle;

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (location) params.append("location", location);

    const path = isSearchTalent
      ? "/companies/search-talents"
      : "/talents/job-search";
    router.push(`${path}?${params.toString()}`);
  };

  const handleClearFilters = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearch("");
    setLocation("");

    const path = isSearchTalent
      ? "/companies/search-talents"
      : "/talents/job-search";
    router.push(path);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50/60 via-white to-yellow-50/40 backdrop-blur-sm border-b border-amber-200/60">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {title}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Search Skills */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Skills & Technologies
              </label>
              <Input
                placeholder="Try Solidity, React, Rust, C++..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                classes={InputClasses.join(" ")}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Location
              </label>
              <CitySuggestion
                classes={InputClasses.join(" ")}
                onCitySelect={(address: { name: string }) =>
                  setLocation(address.name)
                }
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-3">
              <LinkButton
                href="#"
                icon={searchIcon}
                iconSize="medium"
                variant="primary"
                onClick={handleSearch}
              >
                {isSearchTalent ? "Search Talent" : "Search Jobs"}
              </LinkButton>

              <LinkButton
                href="#"
                icon={false as any}
                iconSize="medium"
                variant="secondary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </LinkButton>
            </div>

            <LinkButton
              href={
                isSearchTalent ? "/companies/create-job" : "/talents/my-profile"
              }
              icon={addIcon}
              iconSize="medium"
              variant="secondary"
            >
              {isSearchTalent ? "Create Job" : "My Talent Profile"}
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
};
