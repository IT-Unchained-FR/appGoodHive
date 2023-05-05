"use client";
import { CompaniesCard } from "../../components/companies-card";

export default function CompaniesResult() {
  return (
    <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1  xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3">
      <CompaniesCard
        designation="Company Name"
        image="/img/company_img.png"
        website="websitename.com"
        details="Responsible for In publishing and graphic design, Lorem ipsum is a placeonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum …see more"
        mail="example@example.com"
        phoneNumber="(123) 123 1234"
        country="USA"
        city="San Francisco"
        address="1975 Boring Lane"
        countryFlag="/img/country_flag.png"
        telegram=""
        buttonText="Connect"
      />
    </div>
  );
}
