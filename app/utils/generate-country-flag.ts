import { countriesData } from "@constants/countries-data";

export const generateCountryFlag = (countryCode: string) => {
  if (!countryCode) return null;
  
  // Try exact match first
  let country = countriesData.find(
    (country) => country.iso2 === countryCode.toUpperCase()
  );
  
  // If not found, try lowercase
  if (!country) {
    country = countriesData.find(
      (country) => country.iso2 === countryCode.toLowerCase()
    );
  }
  
  // If still not found, try by country name
  if (!country) {
    country = countriesData.find(
      (country) => country.name.toLowerCase() === countryCode.toLowerCase()
    );
  }
  
  if (country) {
    return country.flag;
  }
  
  // Return null instead of empty string for better handling
  return null;
};
