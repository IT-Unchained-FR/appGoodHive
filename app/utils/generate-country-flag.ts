import { countriesData } from "@constants/countriesData";

export const generateCountryFlag = (countryCode: string) => {
  const country = countriesData.find(
    (country) =>
      country.iso2 === countryCode
  );
  if (country) {
    return country.flag;
  }
  return "";
};
