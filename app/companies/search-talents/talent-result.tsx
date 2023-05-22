import { useState } from "react";
import { Card } from "../../components/card";

type Talent = {
  title: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  city: string;
  rate: string;
  currency: string;
  aboutWork: string;
  skills: string[];
};

type TalentResultProps = {
  talentsData: Talent[];
};

export async function getServerSideProps() {
  try {
    const response = await fetch("/api/talents/search-talents");
    const talentsData = await response.json();

    return {
      props: {
        talentsData,
      },
    };
  } catch (error) {
    console.error("Error fetching talents data:", error);
    return {
      props: {
        talentsData: [],
      },
    };
  }
}

export default function TalentResult({ talentsData }: TalentResultProps) {
  if (!talentsData || talentsData.length === 0) {
    return <div>No talent data available.</div>;
  }

  const talent = talentsData[0]; // Only show the first talent

  return (
    <div>
      <Card
        type="talent"
        title={talent.title}
        postedBy={`${talent.firstName} ${talent.lastName}`}
        postedOn="Active 2 days ago"
        image={talent.imageUrl}
        countryFlag="/img/country_flag.png"
        city={talent.city}
        rate={talent.rate}
        currency={talent.currency}
        description={talent.aboutWork}
        skills={talent.skills}
        buttonText="Connect"
        escrowFee=""
      />
    </div>
  );
}
