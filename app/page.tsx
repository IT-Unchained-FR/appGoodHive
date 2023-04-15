import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="mx-5">
      <h1 className="mt-5 text-2xl">Home Page</h1>
      <p className="my-10 text-lg">
        Get started by clicking on the Design System
      </p>
    </main>
  );
}
