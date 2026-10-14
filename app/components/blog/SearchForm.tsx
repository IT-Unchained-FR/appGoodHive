import { Search } from "lucide-react";

interface SearchFormProps {
  defaultValue?: string;
  size?: "md" | "lg";
}

// Plain GET form: works without JavaScript and gives every search a shareable URL.
export default function SearchForm({ defaultValue = "", size = "md" }: SearchFormProps) {
  const large = size === "lg";
  return (
    <form action="/blog" method="get" role="search" className="relative w-full">
      <label htmlFor={`blog-search-${size}`} className="sr-only">
        Search articles
      </label>
      <Search
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 ${large ? "left-5 h-5 w-5" : "left-3.5 h-4 w-4"}`}
        aria-hidden="true"
      />
      <input
        id={`blog-search-${size}`}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search articles…"
        maxLength={100}
        className={`w-full rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100 ${
          large ? "py-3.5 pl-12 pr-28 text-base" : "py-2.5 pl-10 pr-4 text-sm"
        }`}
      />
      {large && (
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Search
        </button>
      )}
    </form>
  );
}
