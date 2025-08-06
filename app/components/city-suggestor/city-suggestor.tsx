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
  value?: string;
}

export const CitySuggestion: React.FC<CitySuggestionProps> = ({
  onCitySelect,
  classes,
  value = "",
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

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

  const handleAddNewCity = () => {
    if (query.trim() && !cities.some(city => city.name.toLowerCase() === query.toLowerCase())) {
      const newCity: City = {
        id: `new-${Date.now()}`,
        name: query.trim(),
        country: 'Custom'
      };
      setQuery(newCity.name);
      setSuggestions([]);
      onCitySelect?.(newCity);
    }
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
      {(suggestions.length > 0 || (query.trim() && !cities.some(city => city.name.toLowerCase() === query.toLowerCase()))) && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {suggestions.map((city) => (
            <li
              key={city.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleCitySelect(city);
              }}
              className="px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-100"
            >
              {city.name}
              {city.country ? `, ${city.country}` : ""}
            </li>
          ))}
          {query.trim() && !cities.some(city => city.name.toLowerCase() === query.toLowerCase()) && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddNewCity();
              }}
              className="px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-100 text-blue-600 font-medium"
            >
              + Add "{query}" as new city
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
