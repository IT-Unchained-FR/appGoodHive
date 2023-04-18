import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Applications | Talents | GoodHive",
  description: "The Decentralized Freelancing Plateforme",
};

export default function MyApplications() {
  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl">My Applications</h1>
    </main>
  );
}
