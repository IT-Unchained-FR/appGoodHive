"use client";

import { NavBar } from "@/app/components/nav-bar";
import { Rainbowkit } from "@/app/components/rainbowkit";

export default function MyApplications() {
  return (
    <Rainbowkit>
      <NavBar />
      <main className="mx-5">
        <h1 className="my-5 text-2xl">My Applications</h1>
      </main>
    </Rainbowkit>
  );
}
