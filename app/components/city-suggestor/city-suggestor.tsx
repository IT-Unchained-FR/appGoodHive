import React, { useState, useEffect } from "react";
import cities from "../../../json/cities.json";

interface City {
  name: string;
  id: string;
  country: string;
}

interface CitySuggestionProps {
  onCitySelect?: (city: City) => void;
  classes?: string;
}

export const CitySuggestion: React.FC<CitySuggestionProps> = ({
  onCitySelect,
  classes,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Update the debouncedQuery after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer); // Cleanup the timer on component unmount or query change
  }, [query]);

  // Fetch cities whenever the debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      return;
    }

    const filteredCities = cities.filter((city) =>
      city.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
    );
    setSuggestions(filteredCities as City[]);
  }, [debouncedQuery]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleCitySelect = (city: City) => {
    setQuery(city.name);
    setSuggestions([]);
    onCitySelect?.(city);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Type a city name..."
        className={`${classes} relative rounded-lg block w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 focus:outline-none focus:ring-0`}
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-sm max-h-60 overflow-y-auto mt-1">
          {suggestions.map((city) => (
            <li
              key={city.id}
              onClick={() => handleCitySelect(city)}
              className="px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-100"
            >
              {city.name}
              {city.country ? `, ${city.country}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
