import { useState } from "react";
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
  const itemsPerPage = 9; // Number of talents to display per page
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate the index range for talents to display based on the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Get the talents to display on the current page
  const talentsToDisplay = talents.slice(startIndex, endIndex);

  // Function to handle page navigation
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {talentsToDisplay.map((talent, index) => (
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
      <div className="flex justify-center mt-4">
        {talents.length > itemsPerPage && (
          <ul className="space-x-2">
            {Array(Math.ceil(talents.length / itemsPerPage))
              .fill(null)
              .map((_, i) => (
                <button key={i} onClick={() => handlePageChange(i + 1)}>
                  {i + 1}
                </button>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
