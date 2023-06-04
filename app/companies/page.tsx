import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Companies Page | GoodHive",
  description: "The Decentralized Freelancing Platform",
};

export default function Companies() {
  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl">Company Page</h1>
    </main>
  );
}
