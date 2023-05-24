import { Card } from "../../components/card";

interface Talent {
  title: string;
  jobHeadline: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  aboutWork: string;
  telegram: string;
  rate: string;
  currency: string;
  skills: string[];
  imageUrl: string;
};

export default function TalentResult({ talentsData }: { talentsData: Talent[] }) {
  return (
    <div>
      {talentsData.map((talent, index) => (
        <Card
          key={index}
          type="talent"
          title={talent.title}
          postedBy={`${talent.firstName} ${talent.lastName}`}
          postedOn="Active 2 days ago" // TODO: use real data instead when available
          image="/img/talent_avatar.png" //TODO: remplace with actual image from backblaze bucket
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
