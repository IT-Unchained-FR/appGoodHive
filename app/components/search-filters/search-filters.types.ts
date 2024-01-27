export type SearchFiltersProps = {
    isSearchTalent?: boolean;
}

export type SearchQueryProps = {
    search: string;
    location: string;
    name: string;
    recruiter: boolean;
    mentor: boolean;
    onlyTalent: boolean;
    onlyMentor: boolean;
    onlyRecruiter: boolean;
}