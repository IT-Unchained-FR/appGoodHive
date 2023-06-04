import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Page | GoodHive",
  description: "The Decentralized Freelancing Platform",
};

export default function Home() {
  return (
    <main className="mx-5">
      <h1 className="mt-5 text-2xl">Home Page</h1>
      <p className="my-10 text-lg">Freelancing Platform</p>
    </main>
  );
}
