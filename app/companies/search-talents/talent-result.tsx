import { BigNumberish } from "ethers";

import { Card } from "../../components/card";

interface Talent {
  title: string;
  jobHeadline: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  phoneCountryCode: number;
  phoneNumber: number;
  email: string;
  aboutWork: string;
  telegram: string;
  rate: BigNumberish;
  currency: string;
  skills: string[];
  imageUrl: string;
}

export default function TalentResult({ talents }: { talents: Talent[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {talents.map((talent, index) => (
        <Card
          key={index}
          type="talent"
          title={talent.title}
          postedBy={`${talent.firstName} ${talent.lastName}`}
          postedOn="Active 2 days ago" // TODO: use real data instead when available
          image={talent.imageUrl}
          countryFlag="/img/country_flag.png" // TODO: create flag table
          city={talent.city}
          rate={talent.rate}
          currency={talent.currency}
          description={talent.jobHeadline}
          skills={talent.skills}
          buttonText="Connect"
          escrowFee=""
        />
      ))}
    </div>
  );
}
