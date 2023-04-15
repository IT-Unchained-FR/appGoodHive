"use client";

import { Rainbowkit } from "./components/rainbowkit";
import { NavBar } from "./components/nav-bar";

export default function Home() {
  return (
    <Rainbowkit>
      <NavBar />
      <main className="mx-5">
        <h1 className="mt-5 text-2xl">Home Page</h1>
        <p className="my-10 text-lg">Freelancing Platform</p>
      </main>
    </Rainbowkit>
  );
}
