"use client";

import clsx from "clsx";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import {
  GooglePlaceResult,
  GooglePlaceSuggestionProps,
} from "./google-place-suggestion.types";
import {
  GMAP_API_KEY,
} from "./google-places-suggestion.constants";

export const GooglePlaceSuggestion: FC<GooglePlaceSuggestionProps> = (
  props,
) => {
  const {
    handleLocationChange,
    onPlaceResolved,
    onInputChange,
    value,
    label,
    classes = [],
  } = props;
  const searchInput = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [suggestions, setSuggestions] = useState<
    { id: string; primary: string; secondary?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onInputChange?.(value);
  };

  const inputClassName = useMemo(
    () => clsx(Array.isArray(classes) ? classes.join(" ") : classes),
    [classes],
  );

  const fetchPredictions = async (input: string) => {
    if (!GMAP_API_KEY || !input.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GMAP_API_KEY,
            "X-Goog-FieldMask":
              "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
          },
          body: JSON.stringify({
            input,
            languageCode: "en",
            // Bias to cities/places; can be extended with locationBias if desired
            includedPrimaryTypes: ["locality", "administrative_area_level_1", "country"],
          }),
        },
      );

      if (!response.ok) {
        console.error("Autocomplete error", await response.text());
        setSuggestions([]);
        return;
      }

      const data = await response.json();
      const results =
        data?.suggestions
          ?.map((suggestion: any) => {
            const pred = suggestion.placePrediction;
            if (!pred) return null;
            const primary = pred.text?.text || "";
            const secondary =
              pred.structuredFormat?.secondaryText?.text ||
              pred.structuredFormat?.mainText?.text;
            return {
              id: pred.placeId,
              primary,
              secondary: secondary && secondary !== primary ? secondary : undefined,
            };
          })
          .filter(Boolean) ?? [];

      setSuggestions(results.slice(0, 5));
    } catch (err) {
      console.error("Autocomplete fetch failed", err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaceDetails = async (placeId: string) => {
    if (!GMAP_API_KEY) return null;
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,addressComponents,location`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GMAP_API_KEY,
        },
      },
    );

    if (!response.ok) {
      console.error("Place details error", await response.text());
      return null;
    }

    const place = await response.json();
    const components = place?.addressComponents ?? [];
    const getComponent = (type: string) =>
      components.find((c: any) => c.types?.includes(type));

    const countryComp = getComponent("country");
    const localityComp = getComponent("locality");
    const adminComp = getComponent("administrative_area_level_1");

    const meta: GooglePlaceResult = {
      placeId: place.id,
      description: place.formattedAddress || place.displayName?.text,
      city: localityComp?.longText || adminComp?.longText,
      country: countryComp?.longText,
      countryCode: countryComp?.shortText,
    };

    return meta;
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchPredictions(value || "");
    }, 250);

    return () => clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = async (option: { id: string; primary: string }) => {
    const meta = await fetchPlaceDetails(option.id);
    const label = meta?.description || option.primary;

    if (label && handleLocationChange) {
      handleLocationChange(label, meta ?? undefined);
    }
    onPlaceResolved?.(meta ?? {});
    onInputChange?.(label);
    setSuggestions([]);
    setIsFocused(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        aria-label="Search location"
        className={inputClassName}
        ref={searchInput}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        value={value ?? ""}
        type="text"
        placeholder={label}
      />
      {isLoading && (
        <div className="absolute right-3 top-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1 shadow-sm">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-amber-300 border-t-amber-500 animate-spin" aria-hidden />
          <span className="font-semibold">Searching…</span>
        </div>
      )}
      {isFocused && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 w-full rounded-xl border border-amber-200 bg-white shadow-lg shadow-amber-100 z-50"
          style={{ minWidth: "100%" }}
        >
          {suggestions.map((option) => (
            <button
              key={option.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-amber-50"
              onClick={() => handleSelect(option)}
            >
              <div className="text-sm font-medium text-gray-800">
                {option.primary}
              </div>
              {option.secondary && (
                <div className="text-xs text-gray-500">{option.secondary}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
