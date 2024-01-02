export type SearchFiltersProps = {
    isSearchTalent?: boolean;
}

export type SearchQueryProps = {
    search: string;
    location: string;
    name: string;
    recruiter: boolean;
    mentor: boolean;
    freelancer: boolean;
    remote: boolean;
}