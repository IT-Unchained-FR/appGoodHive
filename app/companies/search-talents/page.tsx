import { Card } from "@/app/components/card";
import { Pagination } from "@/app/components/pagination";
import { fetchTalents } from "@/lib/talents";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Talents - Find Web3 & Blockchain Professionals | GoodHive",
  description:
    "Search and discover top Web3 developers, blockchain experts, and crypto professionals. Connect with skilled talent for your decentralized projects and blockchain initiatives.",
  keywords:
    "search Web3 developers, blockchain talent, crypto professionals, decentralized experts, smart contract developers, DeFi talent search",
};

const itemsPerPage = 9;

export const revalidate = 0;

export default async function SearchTalentsPage({
  searchParams,
}: {
  searchParams: {
    items?: number;
    page: number;
    search?: string;
    location?: string;
  };
}) {
  const query = { items: itemsPerPage, ...searchParams };
  const { talents, count } = (await fetchTalents(query)) || {
    talents: [],
    count: 0,
  };

  return (
    <div className="mb-12">
      <h1 className="pt-16 text-xl font-bold">
        Search Results
        <span className="text-base font-normal">- Talent Search</span>
      </h1>

      <div className="grid grid-cols-3 gap-5 md:gap-4 sm:gap-4 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
        {talents.map((talent) => (
          <Card
            key={talent.phoneNumber}
            type="talent"
            title={talent.title}
            postedBy={`${talent.firstName} ${talent.lastName}`}
            postedOn={talent.last_active} // TODO: use real data instead when available
            image={talent.imageUrl}
            country={talent.country} // TODO: create flag table
            city={talent.city}
            budget={Number(talent.rate)}
            projectType="hourly"
            currency={talent.currency}
            description={talent.description}
            skills={talent.skills}
            buttonText="Connect"
            walletAddress={talent.walletAddress}
            freelancer={talent.freelancer}
            remote={talent.remote}
            availability={talent.availability}
            last_active={talent.last_active}
            uniqueId={talent.userId}
          />
        ))}
      </div>

      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={count}
        query={query}
      />
    </div>
  );
}
