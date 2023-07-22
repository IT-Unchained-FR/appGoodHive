import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Page | GoodHive",
  description: "The Decentralized Freelancing Platform",
};

export default function Home() {
  return (
    <main className="mx-5">
      <div className="flex flex-col">
        <h1 className="p-5 mt-5 text-4xl font-bold text-center">
          The Decentralized Freelancing Platform
        </h1>
        <section className="mt-5">
          <h2 className="text-2xl">Our Services</h2>
          <ul className="pl-5 list-disc">
            <li>Connect with global talents</li>
            <li>Secure and trustless payment system</li>
            <li>Full control over your contracts</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
