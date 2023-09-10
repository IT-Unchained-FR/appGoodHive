"use client";

import React from "react";

import { Input } from "@/app/components/input";
import { LinkButton } from "@/app/components/link-button";

import searchIcon from "@/public/icons/search.svg";
import addIcon from "@/public/icons/add.svg";

export default function SearchFilters() {
  const [query, setQuery] = React.useState<{
    search?: string;
    location?: string;
  }>({});

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((q) => ({ ...q, search: event.target.value }));
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((q) => ({ ...q, location: event.target.value }));
  };

  return (
    <div className="mx-5">
      <h1 className="my-5 font-bold text-2xl">Looking for Talent</h1>
      <div className=" space-y-6 sm:w-full md:w-full lg:w-6/12 xl:w-6/12 2xl:w-6/12">
        <Input
          type="text"
          placeholder="Try Developer Solidity, Rust, C++..."
          value={query.search}
          onChange={handleSearchChange}
        />
        <Input
          type="text"
          placeholder="Location Paris, Lodon, Remote..."
          value={query.location}
          onChange={handleLocationChange}
        />

        <div className="flex space-x-11">
          <LinkButton
            href={{
              href: "/companies/search-talents",
              query,
            }}
            icon={searchIcon}
            iconSize="large"
            variant="primary"
          >
            Search Talent
          </LinkButton>
          <LinkButton
            href={"/companies/create-job"}
            icon={addIcon}
            iconSize="large"
            variant="secondary"
          >
            Create Job
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
