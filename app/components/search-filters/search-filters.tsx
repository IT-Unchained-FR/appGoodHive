"use client";

import React, { FC, useState } from "react";

import { Input } from "@/app/components/input";
import { LinkButton } from "@/app/components/link-button";

import type {
  SearchFiltersProps,
  SearchQueryProps,
} from "./search-filters.types";
import { InputClasses, TRANSLATIONS } from "./search-filters.constants";
import searchIcon from "@/public/icons/search.svg";
import addIcon from "@/public/icons/add.svg";
import { skills } from "@constants/skills";
import { GooglePlaceSuggestion } from "@components/google-places-suggestion";
import { AutoSuggestInput } from "@components/autosuggest-input";
import { ToggleButton } from "../toggle-button";

export const SearchFilters: FC<SearchFiltersProps> = (props) => {
  const [query, setQuery] = useState<SearchQueryProps>({
    search: "",
    location: "",
    name: "",
    recruiter: false,
    mentor: false,
    onlyTalent: false,
    onlyMentor: false,
    onlyRecruiter: false,
  });

  const { isSearchTalent = false } = props;

  const title = isSearchTalent
    ? TRANSLATIONS.talentSearchTitle
    : TRANSLATIONS.jobSearchTitle;

  const handleSearchChange = (skills: string[]) => {
    console.log("skills search >>>", skills);
    setQuery((q) => ({ ...q, search: skills[0] }));
  };

  const handleLocationChange = (address: string) => {
    setQuery((q) => ({ ...q, location: address }));
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((q) => ({ ...q, name: event.target.value }));
  };

  const handleOpenToRecruiterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setQuery((q) => ({ ...q, recruiter: event.target.checked }));
  };

  const handleOpenToMentorChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setQuery((q) => ({ ...q, mentor: event.target.checked }));
  };

  const handleOnlyTalentChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setQuery((q) => ({ ...q, onlyTalent: event.target.checked }));
  };

  const handleOnlyMentorChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setQuery((q) => ({ ...q, onlyMentor: event.target.checked }));
  };

  const handleOnlyRecruiterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setQuery((q) => ({ ...q, onlyRecruiter: event.target.checked }));
  };

  return (
    <div>
      <h1 className="my-5 font-bold text-2xl">{title}</h1>
      <div className="relative pt-12 space-y-6 w-6/12 sm:w-full md:w-full">
        <div className="absolute w-full top-0 left-0">
          <AutoSuggestInput
            classes={InputClasses}
            placeholder={TRANSLATIONS.searchPlaceholder}
            inputs={skills}
            selectedInputs={[query.search]}
            setSelectedInputs={handleSearchChange}
            isSingleInput
          />
        </div>

        <GooglePlaceSuggestion
          classes={InputClasses}
          handleLocationChange={handleLocationChange}
          label={TRANSLATIONS.locationPlaceholder}
        />

        <Input
          placeholder={
            isSearchTalent
              ? TRANSLATIONS.searchByDeveloperName
              : TRANSLATIONS.searchByCompanyName
          }
          type="text"
          value={query.name}
          onChange={handleNameChange}
        />

        {isSearchTalent ? (
          <div className="flex gap-5 my-5 px-3 sm:flex-col">
            <ToggleButton
              label={TRANSLATIONS.onlyTalent}
              name="onlyTalent"
              checked={query.onlyTalent}
              onChange={handleOnlyTalentChange}
            />
            <ToggleButton
              label={TRANSLATIONS.onlyMentor}
              name="onlyMentor"
              checked={query.onlyMentor}
              onChange={handleOnlyMentorChange}
            />
            <ToggleButton
              label={TRANSLATIONS.onlyRecruiter}
              name="onlyRecruiter"
              checked={query.onlyRecruiter}
              onChange={handleOnlyRecruiterChange}
            />
          </div>
        ) : (
          <div className="flex gap-5 sm:flex-col">
            <ToggleButton
              label={TRANSLATIONS.openToRecruiter}
              name="openToRecruiter"
              checked={query.recruiter}
              onChange={handleOpenToRecruiterChange}
            />
            <ToggleButton
              label={TRANSLATIONS.openToMentor}
              name="openToMentor"
              checked={query.mentor}
              onChange={handleOpenToMentorChange}
            />
          </div>
        )}

        <div className="flex justify-between gap-3">
          <LinkButton
            href={{
              href: isSearchTalent
                ? "/companies/search-talents"
                : "/talents/job-search",
              query,
            }}
            icon={searchIcon}
            iconSize="large"
            variant="primary"
          >
            {isSearchTalent ? "Search Talent" : "Search Jobs"}
          </LinkButton>

          <LinkButton
            href={
              isSearchTalent ? "/companies/create-job" : "/talents/my-profile"
            }
            icon={addIcon}
            iconSize="large"
            variant="secondary"
          >
            {isSearchTalent ? "Create Job" : "My Talent Profile"}
          </LinkButton>
        </div>
      </div>
    </div>
  );
};
