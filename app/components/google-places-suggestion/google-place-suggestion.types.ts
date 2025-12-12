export type GooglePlaceResult = {
  city?: string;
  country?: string;
  countryCode?: string;
  description?: string;
  placeId?: string;
};

export interface GooglePlaceSuggestionProps {
  handleLocationChange?: (location: string, meta?: GooglePlaceResult) => void;
  onPlaceResolved?: (meta: GooglePlaceResult) => void;
  onInputChange?: (value: string) => void;
  value?: string;
  label: string;
  classes?: string[];
}
