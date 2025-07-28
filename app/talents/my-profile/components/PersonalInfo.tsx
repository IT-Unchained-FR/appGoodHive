import { SearchableSelectInput } from "@/app/components/searchable-select-input";
import LabelOption from "@/interfaces/label-option";
import { CountryOption, ProfileData } from "../types";

interface PersonalInfoProps {
  profileData: ProfileData;
  errors: { [key: string]: string };
  selectedCountry: CountryOption | null;
  countries: CountryOption[];
  onInputChange: (name: string, value: any) => void;
  onCountryChange: (country: CountryOption) => void;
}

// Helper function to convert CountryOption to LabelOption
const convertToLabelOption = (country: CountryOption): LabelOption => ({
  value: country.value,
  label: country.label,
  phoneCode: country.phoneCode,
});

export const PersonalInfo = ({
  profileData,
  errors,
  selectedCountry,
  countries,
  onInputChange,
  onCountryChange,
}: PersonalInfoProps) => {
  // Convert countries to LabelOption format for SearchableSelectInput
  const labelOptions: LabelOption[] = countries.map(convertToLabelOption);

  // Convert selectedCountry to LabelOption format
  const selectedLabelOption = selectedCountry
    ? convertToLabelOption(selectedCountry)
    : null;

  // Handler for country change that converts back to CountryOption
  const handleCountryChange = (option: LabelOption | null) => {
    if (option) {
      const countryOption = countries.find((c) => c.value === option.value);
      if (countryOption) {
        onCountryChange(countryOption);
      }
    }
  };

  return (
    <>
      {/* Name Fields */}
      <div className="flex gap-4 mt-4 sm:flex-col">
        <div className="flex-1">
          <label
            htmlFor="first_name"
            className="inline-block ml-3 text-base text-black form-label"
          >
            First Name*
          </label>
          <input
            className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
            placeholder="First Name"
            type="text"
            pattern="[a-zA-Z -]+"
            maxLength={100}
            value={profileData?.first_name || ""}
            onChange={(e) => onInputChange("first_name", e.target.value)}
          />
          {errors.first_name && (
            <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
          )}
        </div>
        <div className="flex-1">
          <label
            htmlFor="last_name"
            className="inline-block ml-3 text-base text-black form-label"
          >
            Last Name*
          </label>
          <input
            className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
            placeholder="Last Name"
            type="text"
            pattern="[a-zA-Z -]+"
            maxLength={100}
            value={profileData?.last_name || ""}
            onChange={(e) => onInputChange("last_name", e.target.value)}
          />
          {errors.last_name && (
            <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
          )}
        </div>
      </div>

      {/* Location Fields */}
      <div className="flex sm:flex-col gap-4 mt-4">
        <div className="flex-1">
          <SearchableSelectInput
            required={false}
            labelText="Country"
            name="country"
            inputValue={selectedLabelOption}
            setInputValue={handleCountryChange}
            options={labelOptions}
            placeholder="Search for a country..."
            defaultValue={
              profileData?.country
                ? labelOptions.find(
                    (option) => option.value === profileData.country,
                  ) || undefined
                : undefined
            }
          />
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">{errors.country}</p>
          )}
        </div>
        <div className="flex-1">
          <label
            htmlFor="city"
            className="inline-block ml-3 text-base text-black form-label"
          >
            City*
          </label>
          <input
            className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
            placeholder="City"
            type="text"
            pattern="[a-zA-Z -]+"
            maxLength={100}
            value={profileData?.city || ""}
            onChange={(e) => onInputChange("city", e.target.value)}
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
          )}
        </div>
      </div>

      {/* Phone Fields */}
      <div className="flex sm:flex-col gap-4 mt-4">
        <div className="flex-1">
          <label
            htmlFor="phone_country_code"
            className="inline-block ml-3 text-base text-black form-label"
          >
            Phone Country Code*
          </label>
          <div className="relative">
            <input
              className="pl-8 form-control block w-full py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
              placeholder="Phone Country Code"
              type="text"
              value={selectedCountry?.phoneCode || "+1"}
              readOnly
            />
          </div>
          {errors.phone_country_code && (
            <p className="text-red-500 text-sm mt-1">
              {errors.phone_country_code}
            </p>
          )}
        </div>
        <div className="flex-1">
          <label
            htmlFor="phone_number"
            className="inline-block ml-3 text-base text-black form-label"
          >
            Phone Number*
          </label>
          <input
            className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
            placeholder="Phone Number"
            type="number"
            maxLength={20}
            value={profileData?.phone_number || ""}
            onChange={(e) => onInputChange("phone_number", e.target.value)}
          />
          {errors.phone_number && (
            <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
          )}
        </div>
      </div>

      {/* Email and Rate Fields */}
      <div className="flex sm:flex-col gap-4 mt-4">
        <div className="flex-1">
          <label
            htmlFor="email"
            className="inline-block ml-3 text-base text-black form-label"
          >
            Email*
          </label>
          <input
            className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
            placeholder="Email"
            type="email"
            maxLength={255}
            value={profileData?.email || ""}
            onChange={(e) => onInputChange("email", e.target.value)}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        <div className="flex-1">
          <label
            htmlFor="rate"
            className="inline-block ml-3 text-base text-black form-label"
          >
            Rate (USD/Hour)
          </label>
          <input
            className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
            placeholder="Your rate per hour"
            type="number"
            maxLength={255}
            value={profileData?.rate || ""}
            onChange={(e) => onInputChange("rate", Number(e.target.value))}
          />
          {errors.rate && (
            <p className="text-red-500 text-sm mt-1">{errors.rate}</p>
          )}
        </div>
      </div>
    </>
  );
};
